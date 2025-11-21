use serde::Serialize;
use std::{
    io::{BufRead, BufReader},
    path::PathBuf,
    process::{Command, Stdio},
    sync::{Arc, Mutex},
    thread,
};
use tauri::Emitter;

#[derive(Serialize)]
struct SupabaseCommandOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

#[derive(Serialize, Clone)]
struct SupabaseCommandStreamEvent {
    command_id: String,
    stream: String,
    chunk: String,
}

const STREAM_EVENT_NAME: &str = "supabase://command-output";

/// Runs the Supabase CLI with the provided arguments and optional working directory.
#[tauri::command]
async fn run_supabase_command(
    window: tauri::Window,
    command_id: String,
    command_line: String,
    working_dir: Option<String>,
    api_url: Option<String>,
    project_ref: Option<String>,
) -> Result<SupabaseCommandOutput, String> {
    let trimmed = command_line.trim();
    if trimmed.is_empty() {
        return Err("Enter the arguments you want to pass to `supabase`.".into());
    }

    let mut args =
        shell_words::split(trimmed).map_err(|err| format!("Could not parse arguments: {err}"))?;

    if args
        .first()
        .map(|first| first.eq_ignore_ascii_case("supabase"))
        .unwrap_or(false)
    {
        args.remove(0);
    }

    let project_ref = project_ref.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    });

    let working_dir = working_dir
        .and_then(|value| {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        })
        .map(PathBuf::from);
    let api_url = api_url.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    });

    let command_output =
        tauri::async_runtime::spawn_blocking(move || -> Result<SupabaseCommandOutput, String> {
            let mut command = Command::new("supabase");
            if let Some(dir) = working_dir {
                command.current_dir(dir);
            }

            command
                .args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            if let Some(ref url) = api_url {
                command.env("SUPABASE_URL", url);
                command.env("SUPABASE_API_URL", url);
            }
            if let Some(ref project_ref) = project_ref {
                command.env("SUPABASE_PROJECT_REF", project_ref);
            }

            let mut child = command.spawn().map_err(|err| err.to_string())?;

            let stdout_buffer = Arc::new(Mutex::new(String::new()));
            let stderr_buffer = Arc::new(Mutex::new(String::new()));

            let stdout_handle = if let Some(stdout) = child.stdout.take() {
                let window = window.clone();
                let buffer = stdout_buffer.clone();
                let command_id = command_id.clone();
                Some(thread::spawn(move || {
                    emit_stream(window, buffer, stdout, command_id, "stdout");
                }))
            } else {
                None
            };

            let stderr_handle = if let Some(stderr) = child.stderr.take() {
                let window = window.clone();
                let buffer = stderr_buffer.clone();
                let command_id = command_id.clone();
                Some(thread::spawn(move || {
                    emit_stream(window, buffer, stderr, command_id, "stderr");
                }))
            } else {
                None
            };

            let status = child.wait().map_err(|err| err.to_string())?;

            if let Some(handle) = stdout_handle {
                let _ = handle.join();
            }
            if let Some(handle) = stderr_handle {
                let _ = handle.join();
            }

            Ok(SupabaseCommandOutput {
                stdout: stdout_buffer
                    .lock()
                    .map(|buf| buf.clone())
                    .unwrap_or_else(|_| String::new()),
                stderr: stderr_buffer
                    .lock()
                    .map(|buf| buf.clone())
                    .unwrap_or_else(|_| String::new()),
                exit_code: status.code().unwrap_or(-1),
            })
        })
        .await
        .map_err(|err| err.to_string())??;

    Ok(command_output)
}

fn emit_stream<R: std::io::Read>(
    window: tauri::Window,
    buffer: Arc<Mutex<String>>,
    reader: R,
    command_id: String,
    stream: &str,
) {
    let mut reader = BufReader::new(reader);
    let mut line = String::new();

    loop {
        match reader.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {
                {
                    if let Ok(mut buf) = buffer.lock() {
                        buf.push_str(&line);
                    }
                }

                let payload = SupabaseCommandStreamEvent {
                    command_id: command_id.clone(),
                    stream: stream.to_string(),
                    chunk: line.clone(),
                };

                let _ = window.emit(STREAM_EVENT_NAME, payload);
                line.clear();
            }
            Err(_) => break,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_supabase_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
