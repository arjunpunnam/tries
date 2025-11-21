// Tiny, dependency-free viewer with CloudWatch-like features.
const mockData = [
  {
    id: "acct-prod",
    name: "Production",
    functions: [
      {
        name: "payments-handler",
        region: "us-east-1",
        logs: [
          {
            fileName: "2025/11/18/[$LATEST]abcd1234.log",
            sizeBytes: 18734,
            lastModified: "2025-11-18T14:19:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-18T14:18:21Z", message: "START RequestId=abc Version=$LATEST" },
              { timestamp: "2025-11-18T14:18:22Z", message: "Processing payment for order=92138 amount=42.00" },
              { timestamp: "2025-11-18T14:18:23Z", message: "END RequestId=abc" }
            ]
          },
          {
            fileName: "2025/11/18/[$LATEST]abcd1234.recent.log",
            sizeBytes: 8245,
            lastModified: "2025-11-18T14:43:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-18T14:42:11Z", message: "START RequestId=def Version=$LATEST" },
              { timestamp: "2025-11-18T14:42:12Z", message: "Charge captured stripeId=ch_123" },
              { timestamp: "2025-11-18T14:42:13Z", message: "END RequestId=def" }
            ]
          }
        ]
      },
      {
        name: "notifications-worker",
        region: "us-east-1",
        logs: [
          {
            fileName: "2025/11/18/[$LATEST]notify-ef56.log",
            sizeBytes: 11294,
            lastModified: "2025-11-18T14:41:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-18T14:40:50Z", message: "START RequestId=ghi Version=$LATEST" },
              { timestamp: "2025-11-18T14:40:51Z", message: "Published notification to topic=alerts" },
              { timestamp: "2025-11-18T14:40:52Z", message: "END RequestId=ghi" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "acct-sandbox",
    name: "Sandbox",
    functions: [
      {
        name: "orders-api",
        region: "us-west-2",
        logs: [
          {
            fileName: "2025/11/17/[$LATEST]sand-9012.log",
            sizeBytes: 4321,
            lastModified: "2025-11-17T22:05:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-17T22:04:50Z", message: "START RequestId=jkl Version=$LATEST" },
              { timestamp: "2025-11-17T22:04:52Z", message: "Order fetched id=555 state=pending" },
              { timestamp: "2025-11-17T22:04:54Z", message: "END RequestId=jkl" }
            ]
          },
          {
            fileName: "2025/11/18/[$LATEST]sand-9012.log",
            sizeBytes: 9966,
            lastModified: "2025-11-18T11:12:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-18T11:11:12Z", message: "START RequestId=mno Version=$LATEST" },
              { timestamp: "2025-11-18T11:11:13Z", message: "Order updated id=559 status=completed" },
              { timestamp: "2025-11-18T11:11:14Z", message: "END RequestId=mno" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "acct-dev",
    name: "Developer",
    functions: [
      {
        name: "image-resizer",
        region: "eu-central-1",
        logs: [
          {
            fileName: "2025/11/15/[$LATEST]resize.log",
            sizeBytes: 5099,
            lastModified: "2025-11-15T08:12:00Z",
            url: "",
            events: [
              { timestamp: "2025-11-15T08:11:55Z", message: "START RequestId=pqr Version=$LATEST" },
              { timestamp: "2025-11-15T08:11:56Z", message: "Resized image id=img_101 -> 800x600" },
              { timestamp: "2025-11-15T08:11:57Z", message: "END RequestId=pqr" }
            ]
          }
        ]
      },
      {
        name: "ingestion-poller",
        region: "eu-central-1",
        logs: []
      }
    ]
  }
];

const DATA_ENDPOINT = "/api/logs";

const state = {
  accounts: [],
  selectedAccountId: null,
  selectedFunctionName: null,
  search: "",
  eventSearch: "",
  selectedLogId: null,
  timeRangeMinutes: 60,
  autoRefresh: false,
  autoRefreshInterval: null
};

const accountSelect = document.querySelector("#accountSelect");
const functionSelect = document.querySelector("#functionSelect");
const logList = document.querySelector("#logList");
const searchInput = document.querySelector("#searchInput");
const timeRangeSelect = document.querySelector("#timeRangeSelect");
const autoRefreshButton = document.querySelector("#autoRefreshButton");
const emptyState = document.querySelector("#emptyState");
const refreshButton = document.querySelector("#refreshButton");
const eventSearchInput = document.querySelector("#eventSearchInput");
const copyEventsButton = document.querySelector("#copyEventsButton");
const downloadEventsButton = document.querySelector("#downloadEventsButton");
const eventList = document.querySelector("#eventList");
const eventEmptyState = document.querySelector("#eventEmptyState");
const eventStreamMeta = document.querySelector("#eventStreamMeta");

const fetchData = async () => {
  const resp = await fetch(DATA_ENDPOINT, { cache: "no-store" });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.json();
};

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
};

const cutoffMs = () => (state.timeRangeMinutes > 0 ? Date.now() - state.timeRangeMinutes * 60 * 1000 : null);

const loadData = async () => {
  try {
    const data = await fetchData();
    return data;
  } catch (err) {
    console.warn("Falling back to mock data because fetch failed:", err);
    return mockData;
  }
};

const setAccounts = (accounts) => {
  state.accounts = accounts;
  const hadSelection = state.selectedAccountId;

  accountSelect.innerHTML = "";
  accounts.forEach((acct, idx) => {
    const option = document.createElement("option");
    option.value = acct.id;
    option.textContent = `${acct.name} (${acct.id})`;
    accountSelect.appendChild(option);
    if ((!hadSelection && idx === 0) || hadSelection === acct.id) {
      option.selected = true;
      state.selectedAccountId = acct.id;
    }
  });

  functionSelect.disabled = accounts.length === 0;
  renderFunctions();
};

const renderFunctions = () => {
  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  functionSelect.innerHTML = "";

  if (!account) {
    functionSelect.disabled = true;
    state.selectedFunctionName = null;
    renderLogs([]);
    return;
  }

  functionSelect.disabled = false;
  account.functions.forEach((fn, idx) => {
    const opt = document.createElement("option");
    opt.value = fn.name;
    opt.textContent = `${fn.name} · ${fn.region}`;
    functionSelect.appendChild(opt);
    if ((!state.selectedFunctionName && idx === 0) || state.selectedFunctionName === fn.name) {
      opt.selected = true;
      state.selectedFunctionName = fn.name;
    }
  });

  const selected = account.functions.find((fn) => fn.name === state.selectedFunctionName);
  renderLogs(selected?.logs ?? []);
};

const renderLogs = (logs) => {
  const search = state.search.trim().toLowerCase();
  const cutoff = cutoffMs();
  const filtered = logs.filter((log) => {
    const matchesSearch = log.fileName.toLowerCase().includes(search);
    if (!matchesSearch) return false;
    if (!cutoff) return true;
    return new Date(log.lastModified).getTime() >= cutoff;
  });

  logList.innerHTML = "";
  let selectedLog = null;
  filtered.forEach((log) => {
    const item = document.createElement("li");
    item.className = "log-item";
    item.tabIndex = 0;
    const logId = `${state.selectedAccountId}:${state.selectedFunctionName}:${log.fileName}`;
    if (state.selectedLogId === logId) {
      item.classList.add("selected");
      selectedLog = log;
    }

    const title = document.createElement("h3");
    title.className = "log-title";
    title.textContent = log.fileName;

    const meta = document.createElement("p");
    meta.className = "log-meta";
    const size = (log.sizeBytes / 1024).toFixed(1);
    meta.textContent = `${size} KB • Updated ${fmtDate(log.lastModified)}`;

    item.appendChild(title);
    item.appendChild(meta);

    const selectLog = () => {
      state.selectedLogId = logId;
      renderLogs(logs);
      renderEvents(log);
    };
    item.addEventListener("click", selectLog);
    item.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") selectLog();
    });

    logList.appendChild(item);
  });

  emptyState.classList.toggle("hidden", filtered.length !== 0);
  if (!state.selectedLogId || !selectedLog) {
    renderEvents(null);
  } else {
    renderEvents(selectedLog);
  }
};

const filteredEvents = (log) => {
  const cutoff = cutoffMs();
  const search = state.eventSearch.trim().toLowerCase();
  return (log?.events || []).filter((evt) => {
    const withinRange = !cutoff || new Date(evt.timestamp).getTime() >= cutoff;
    if (!withinRange) return false;
    if (!search) return true;
    return evt.message.toLowerCase().includes(search);
  });
};

const renderEvents = (log) => {
  if (!log) {
    eventList.innerHTML = "";
    eventStreamMeta.textContent = "";
    eventEmptyState.textContent = "Select a log stream to view events.";
    eventEmptyState.classList.remove("hidden");
    copyEventsButton.disabled = true;
    downloadEventsButton.disabled = true;
    return;
  }

  const events = filteredEvents(log);

  eventList.innerHTML = "";
  events.forEach((evt) => {
    const li = document.createElement("li");
    li.className = "event-item";

    const header = document.createElement("div");
    header.className = "event-header";
    header.innerHTML = `<span>${fmtDate(evt.timestamp)}</span><span>${new Date(evt.timestamp).toISOString()}</span>`;

    const msg = document.createElement("p");
    msg.className = "event-message";
    msg.textContent = evt.message;

    li.appendChild(header);
    li.appendChild(msg);
    eventList.appendChild(li);
  });

  if (events.length === 0) {
    eventEmptyState.textContent = "No events match the filters in this range.";
    eventEmptyState.classList.remove("hidden");
  } else {
    eventEmptyState.classList.add("hidden");
  }

  const earliest = events[0]?.timestamp;
  const latest = events[events.length - 1]?.timestamp;
  eventStreamMeta.textContent = `${events.length} events` + (earliest ? ` · ${fmtDate(earliest)} - ${fmtDate(latest)}` : "");
  copyEventsButton.disabled = events.length === 0;
  downloadEventsButton.disabled = events.length === 0;
};

const getSelectedLog = () => {
  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  const fn = account?.functions.find((f) => f.name === state.selectedFunctionName);
  if (!fn) return null;
  return fn.logs.find((l) => `${state.selectedAccountId}:${state.selectedFunctionName}:${l.fileName}` === state.selectedLogId) || null;
};

const refresh = async () => {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";
  try {
    const data = await loadData();
    setAccounts(data);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Refresh";
  }
};

accountSelect.addEventListener("change", (e) => {
  state.selectedAccountId = e.target.value;
  state.selectedFunctionName = null;
  state.selectedLogId = null;
  renderFunctions();
});

functionSelect.addEventListener("change", (e) => {
  state.selectedFunctionName = e.target.value;
  state.selectedLogId = null;
  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  const selected = account?.functions.find((fn) => fn.name === state.selectedFunctionName);
  renderLogs(selected?.logs ?? []);
});

searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  const fn = account?.functions.find((f) => f.name === state.selectedFunctionName);
  renderLogs(fn?.logs ?? []);
});

eventSearchInput.addEventListener("input", (e) => {
  state.eventSearch = e.target.value;
  const log = getSelectedLog();
  renderEvents(log);
});

timeRangeSelect.addEventListener("change", (e) => {
  state.timeRangeMinutes = parseInt(e.target.value, 10);
  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  const fn = account?.functions.find((f) => f.name === state.selectedFunctionName);
  renderLogs(fn?.logs ?? []);
});

copyEventsButton.addEventListener("click", async () => {
  const log = getSelectedLog();
  if (!log) return;
  const events = filteredEvents(log);
  const text = events.map((evt) => `${evt.timestamp} ${evt.message}`).join("\n");
  await navigator.clipboard.writeText(text);
  copyEventsButton.textContent = "Copied!";
  setTimeout(() => (copyEventsButton.textContent = "Copy"), 1200);
});

downloadEventsButton.addEventListener("click", () => {
  const log = getSelectedLog();
  if (!log) return;
  const events = filteredEvents(log);
  const text = events.map((evt) => `${evt.timestamp} ${evt.message}`).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${state.selectedFunctionName || "logs"}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
});

const toggleAutoRefresh = () => {
  state.autoRefresh = !state.autoRefresh;
  autoRefreshButton.textContent = state.autoRefresh ? "On" : "Off";
  autoRefreshButton.setAttribute("aria-pressed", state.autoRefresh ? "true" : "false");
  if (state.autoRefresh) {
    state.autoRefreshInterval = setInterval(refresh, 5000);
  } else if (state.autoRefreshInterval) {
    clearInterval(state.autoRefreshInterval);
    state.autoRefreshInterval = null;
  }
};

autoRefreshButton.addEventListener("click", toggleAutoRefresh);

refreshButton.addEventListener("click", () => {
  refresh();
});

// Kick off initial render.
refresh();
