# Lambda Log Viewer

Lightweight, dependency-free viewer for browsing Lambda log files. Uses static mock data by default and can be wired to any API/Lambda/CloudWatch source for real logs.

## Quick start
- Open `index.html` in your browser (no build step needed).
- Use the Account and Function dropdowns to drill into log files; type in the filter box to narrow results.
- Hit **Refresh** to reload data (re-runs the `loadData()` function).
- Choose a time range, enable auto-refresh (tail), click a log stream to see events, filter events by text, copy or download them.

## Plug in real data
- Serve an endpoint at `/api/logs` that returns JSON shaped like below (could be CloudWatch Logs data proxied via API Gateway or a tiny Lambda).
- `loadData()` already calls that endpoint and falls back to mock data if the fetch fails.
- Include optional `url` per log entry to let clicks open/download the file.

```js
[
  {
    id: "your-account-id",
    name: "Human name",
    functions: [
      {
        name: "lambda-name",
        region: "us-east-1",
        logs: [
          { fileName, sizeBytes, lastModified, url, events: [{ timestamp, message }] }
        ]
      }
    ]
  }
];
```

Because everything is static, it stays extremely fast—no frameworks, no bundlers.
