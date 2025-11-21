import { FormEvent, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

type CommandResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
};

type CommandStreamPayload = {
  command_id: string;
  stream: "stdout" | "stderr";
  chunk: string;
};

type ProjectLink = {
  id: string;
  name: string;
  projectRef: string;
  createdAt: number;
};

const DEFAULT_API_URL = "http://127.0.0.1:54321";
const STORAGE_KEYS = {
  projects: "supadash.projects",
  selectedProject: "supadash.selectedProject",
};

const commandCatalog = [
  {
    title: "Local stack",
    commands: [
      { label: "Status", args: "status", description: "Check container health and ports." },
      { label: "Start", args: "start", description: "Boot every Supabase service locally." },
      { label: "Stop", args: "stop", description: "Stop and clean up the running stack." },
      {
        label: "Reset DB",
        args: "db reset",
        description: "Apply migrations and seed data from scratch.",
      },
    ],
  },
  {
    title: "Database",
    commands: [
      {
        label: "DB Start",
        args: "db start",
        description: "Start Postgres only (for quick experiments).",
      },
      { label: "DB Stop", args: "db stop", description: "Stop the Postgres-only container." },
      { label: "DB Shell", args: "db shell", description: "Open a psql session into Postgres." },
      {
        label: "DB Branches",
        args: "db branch list",
        description: "List database branches available for branching workflows.",
      },
    ],
  },
  {
    title: "Functions & Auth",
    commands: [
      {
        label: "Functions Serve",
        args: "functions serve",
        description: "Run Edge Functions locally with hot reload.",
      },
      {
        label: "Functions List",
        args: "functions list",
        description: "See the Edge Functions currently defined.",
      },
      {
        label: "Login",
        args: "login",
        description: "Authenticate the CLI with your Supabase account.",
      },
      {
        label: "Link Project",
        args: "link",
        description: "Link this directory to an existing Supabase project.",
      },
    ],
  },
];

const generateCommandId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function App() {
  const [commandLine, setCommandLine] = useState("status");
  const [workingDir, setWorkingDir] = useState("");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [projects, setProjects] = useState<ProjectLink[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddProjectVisible, setIsAddProjectVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectRef, setNewProjectRef] = useState("");
  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const activeCommandIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCommandIdRef.current = activeCommandId;
  }, [activeCommandId]);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.projects);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects) as ProjectLink[];
        setProjects(parsed);
      }
      const storedSelected = localStorage.getItem(STORAGE_KEYS.selectedProject);
      if (storedSelected) {
        setSelectedProjectId(storedSelected);
      }
    } catch (storageError) {
      console.warn("Failed to load stored project links", storageError);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(STORAGE_KEYS.selectedProject, selectedProjectId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.selectedProject);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    listen<CommandStreamPayload>("supabase://command-output", (event) => {
      const currentId = activeCommandIdRef.current;
      if (!currentId || event.payload.command_id !== currentId) {
        return;
      }

      if (event.payload.stream === "stdout") {
        setStdout((prev) => prev + event.payload.chunk);
      } else {
        setStderr((prev) => prev + event.payload.chunk);
      }
    })
      .then((dispose) => {
        unlisten = dispose;
      })
      .catch((err) => {
        console.error("Failed to attach Supabase stream listener", err);
      });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const activeProject = projects.find((project) => project.id === selectedProjectId) || null;

  const runCommand = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    const commandId = generateCommandId();
    setActiveCommandId(commandId);
    activeCommandIdRef.current = commandId;
    setStdout("");
    setStderr("");
    try {
      const output = await invoke<CommandResult>("run_supabase_command", {
        commandId,
        commandLine,
        workingDir: workingDir.trim().length ? workingDir : null,
        apiUrl: apiUrl.trim().length ? apiUrl : null,
        projectRef: activeProject?.projectRef ?? null,
      });
      setResult(output);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setActiveCommandId(null);
      activeCommandIdRef.current = null;
    }
  };

  const hasStdout = Boolean(stdout.trim().length);
  const hasStderr = Boolean(stderr.trim().length);

  return (
    <main className="shell">
      <header>
        <div>
          <p className="eyebrow">Supadash</p>
          <h1>Supabase CLI runner</h1>
          <p className="lede">
            Provide the exact arguments you would usually give to{" "}
            <code>supabase</code>. Results stream back into the panel below.
          </p>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <section className="project-links">
            <div className="project-links-header">
              <div>
                <h3>Projects</h3>
                <p>
                  {activeProject
                    ? `Using ${activeProject.name}`
                    : "Link a project ref to target remote resources."}
                </p>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsAddProjectVisible((prev) => !prev)}
              >
                {isAddProjectVisible ? "Close" : "Add"}
              </button>
            </div>

            {projects.length > 0 ? (
              <ul className="project-list">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className={project.id === activeProject?.id ? "selected" : undefined}
                  >
                    <div className="project-list-info">
                      <strong>{project.name}</strong>
                      <code>{project.projectRef}</code>
                    </div>
                    <div className="project-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProjectId((current) =>
                            current === project.id ? null : project.id,
                          )
                        }
                      >
                        {selectedProjectId === project.id ? "Unset" : "Use"}
                      </button>
                      <button
                        type="button"
                        className="danger ghost"
                        onClick={() => {
                          setProjects((prev) => prev.filter((item) => item.id !== project.id));
                          setSelectedProjectId((current) =>
                            current === project.id ? null : current,
                          );
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="project-empty">No linked projects yet.</p>
            )}

            {isAddProjectVisible && (
              <form
                className="project-add-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmedName = newProjectName.trim();
                  const trimmedRef = newProjectRef.trim();
                  if (!trimmedName || !trimmedRef) {
                    return;
                  }

                  const newProject: ProjectLink = {
                    id: typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? crypto.randomUUID()
                      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: trimmedName,
                    projectRef: trimmedRef,
                    createdAt: Date.now(),
                  };
                  setProjects((prev) => [...prev, newProject]);
                  setSelectedProjectId(newProject.id);
                  setNewProjectName("");
                  setNewProjectRef("");
                  setIsAddProjectVisible(false);
                }}
              >
                <label htmlFor="project-name-input">Project name</label>
                <input
                  id="project-name-input"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Personal blog"
                  autoComplete="off"
                />
                <label htmlFor="project-ref-input">Project ref</label>
                <input
                  id="project-ref-input"
                  value={newProjectRef}
                  onChange={(event) => setNewProjectRef(event.target.value)}
                  placeholder="abcd1234"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newProjectName.trim().length || !newProjectRef.trim().length}
                >
                  Save project
                </button>
              </form>
            )}
          </section>

          <section className="command-sidebar">
            <div className="command-sidebar-header">
              <h3>Command palette</h3>
              <p>Click a command to load it into the runner.</p>
            </div>
            {commandCatalog.map((section) => (
              <div className="command-section" key={section.title}>
                <p className="command-section-title">{section.title}</p>
                <ul>
                  {section.commands.map((command) => (
                    <li key={command.label}>
                      <button
                        type="button"
                        onClick={() => setCommandLine(command.args)}
                        disabled={isRunning}
                      >
                        {command.label}
                      </button>
                      <span>{command.description}</span>
                      <code>{command.args}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </aside>

        <div className="primary-pane">
          <form className="command-panel" onSubmit={runCommand}>
            <label htmlFor="command-input">Supabase arguments</label>
            <div className="command-input">
              <span>supabase</span>
              <input
                id="command-input"
                value={commandLine}
                onChange={(event) => setCommandLine(event.target.value)}
                placeholder="status"
                autoComplete="off"
              />
            </div>

            <label htmlFor="cwd-input">Working directory (optional)</label>
            <input
              id="cwd-input"
              value={workingDir}
              onChange={(event) => setWorkingDir(event.target.value)}
              placeholder="Defaults to the current project"
              autoComplete="off"
            />

            <label htmlFor="api-url-input">Supabase API URL</label>
            <input
              id="api-url-input"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder={DEFAULT_API_URL}
              autoComplete="off"
            />

            <div className="actions">
              <button type="submit" disabled={isRunning || !commandLine.trim()}>
                {isRunning ? "Running..." : "Run command"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setCommandLine("");
                  setWorkingDir("");
                  setApiUrl(DEFAULT_API_URL);
                  setResult(null);
                  setError(null);
                  setStdout("");
                  setStderr("");
                  setActiveCommandId(null);
                  activeCommandIdRef.current = null;
                }}
                disabled={isRunning}
              >
                Reset
              </button>
            </div>

            <div className="project-hint">
              {activeProject ? (
                <>
                  Active project: <strong>{activeProject.name}</strong>{" "}
                  <code>{activeProject.projectRef}</code>
                </>
              ) : (
                <span>No linked project selected (commands run locally).</span>
              )}
            </div>
          </form>

          <section className="output-panel">
            <div className="output-header">
              <h2>CLI output</h2>
              <div className="exit-status">
                {result ? (
                  <>
                    Exit code:{" "}
                    <span className={result.exit_code === 0 ? "success" : "danger"}>
                      {result.exit_code}
                    </span>
                  </>
                ) : (
                  "No command executed yet"
                )}
              </div>
            </div>

            {error && (
              <div className="error-banner">
                <strong>Failed:</strong> {error}
              </div>
            )}

            {hasStdout && (
              <article>
                <h3>stdout</h3>
                <pre>
                  <code>{stdout}</code>
                </pre>
              </article>
            )}

            {hasStderr && (
              <article>
                <h3>stderr</h3>
                <pre>
                  <code>{stderr}
                  </code>
                </pre>
              </article>
            )}

            {!error && !hasStdout && !hasStderr && (
              <p className="empty-state">
                Run a command to view the output stream in this panel.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
