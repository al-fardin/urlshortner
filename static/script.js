const form = document.getElementById("shortenForm");
const longUrlInput = document.getElementById("longUrl");
const aliasInput = document.getElementById("alias");
const shortenBtn = document.getElementById("shortenBtn");
const message = document.getElementById("message");
const resultCard = document.getElementById("resultCard");
const shortUrlLink = document.getElementById("shortUrl");
const resultCode = document.getElementById("resultCode");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");

const sessionLinks = document.getElementById("sessionLinks");
const lastLatency = document.getElementById("lastLatency");
const latestCode = document.getElementById("latestCode");
const chartWindow = document.getElementById("chartWindow");
const fastestLatency = document.getElementById("fastestLatency");
const averageLatency = document.getElementById("averageLatency");
const latestLatencyInsight = document.getElementById("latestLatencyInsight");
const latencyAreaPath = document.getElementById("latencyAreaPath");
const latencyLinePath = document.getElementById("latencyLinePath");
const latencyDots = document.getElementById("latencyDots");
const latencyTooltip = document.getElementById("latencyTooltip");
const chartEmpty = document.getElementById("chartEmpty");
const ringValue = document.getElementById("ringValue");
const dashboardShortUrl = document.getElementById("dashboardShortUrl");
const dashboardStatus = document.getElementById("dashboardStatus");

let currentShortUrl = "";
let stats = loadStats();
renderStats();

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const longUrl = longUrlInput.value.trim();
    const alias = aliasInput.value.trim();

    clearMessage();

    if (!longUrl) {
        showMessage("Please enter a URL.");
        longUrlInput.focus();
        return;
    }

    if (!isHttpUrl(longUrl)) {
        showMessage("Use a full URL starting with http:// or https://.");
        longUrlInput.focus();
        return;
    }

    if (alias && alias.length < 5) {
        showMessage("Alias must be at least 5 characters.");
        aliasInput.focus();
        return;
    }

    if (alias && /[\s/?#]/.test(alias)) {
        showMessage("Alias cannot contain spaces, /, ? or #.");
        aliasInput.focus();
        return;
    }

    setLoading(true);
    const startedAt = performance.now();

    try {
        const response = await fetch("/api/shorten", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ longUrl, alias })
        });

        const data = await response.json();
        const elapsed = Math.max(1, Math.round(performance.now() - startedAt));

        if (!response.ok) {
            throw new Error(data.error || "Could not shorten URL.");
        }

        currentShortUrl = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        shortUrlLink.href = data.shortUrl;
        resultCode.textContent = data.code;
        openBtn.href = data.shortUrl;
        resultCard.hidden = false;

        updateSessionStats(data, elapsed);
        showMessage("Short link created successfully.", true);
    } catch (error) {
        showMessage(error.message);
    } finally {
        setLoading(false);
    }
});

copyBtn.addEventListener("click", async () => {
    if (!currentShortUrl) return;

    try {
        await navigator.clipboard.writeText(currentShortUrl);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
            copyBtn.textContent = "Copy link";
        }, 1400);
    } catch {
        showMessage("Could not copy automatically. Copy the link manually.");
    }
});

function isHttpUrl(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function setLoading(loading) {
    shortenBtn.disabled = loading;
    shortenBtn.querySelector("span").textContent = loading ? "Creating..." : "Shorten link";
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
}

function showMessage(text, success = false) {
    message.textContent = text;
    message.className = success ? "message success" : "message";
}

function loadStats() {
    try {
        const saved = JSON.parse(sessionStorage.getItem("quicklinkStats"));
        if (saved && Array.isArray(saved.latencies)) {
            return {
                count: Number(saved.count) || 0,
                latencies: saved.latencies.slice(-8).map(Number).filter(Number.isFinite),
                latestCode: saved.latestCode || "",
                latestUrl: saved.latestUrl || ""
            };
        }
    } catch {}

    return { count: 0, latencies: [], latestCode: "", latestUrl: "" };
}

function saveStats() {
    try {
        sessionStorage.setItem("quicklinkStats", JSON.stringify(stats));
    } catch {}
}

function updateSessionStats(data, elapsed) {
    stats.count += 1;
    stats.latencies.push(elapsed);
    stats.latencies = stats.latencies.slice(-8);
    stats.latestCode = data.code;
    stats.latestUrl = data.shortUrl;
    saveStats();
    renderStats();
}

function renderStats() {
    sessionLinks.textContent = stats.count;
    ringValue.textContent = stats.count;
    latestCode.textContent = stats.latestCode || "—";

    if (stats.latestUrl) {
        dashboardShortUrl.textContent = stats.latestUrl;
        dashboardStatus.textContent = "Ready. Visiting this short URL will trigger the Go redirect handler.";
    } else {
        dashboardShortUrl.textContent = "Waiting for a link";
        dashboardStatus.textContent = "Submit the form above and this panel will update instantly.";
    }

    if (!stats.latencies.length) {
        lastLatency.textContent = "—";
        fastestLatency.textContent = "—";
        averageLatency.textContent = "—";
        latestLatencyInsight.textContent = "—";
        chartWindow.textContent = "No requests yet";
        latencyAreaPath.setAttribute("d", "");
        latencyLinePath.setAttribute("d", "");
        latencyDots.innerHTML = "";
        chartEmpty.hidden = false;
        latencyTooltip.hidden = true;
        return;
    }

    const values = stats.latencies;
    const latest = values[values.length - 1];
    const fastest = Math.min(...values);
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    lastLatency.textContent = latest;
    fastestLatency.textContent = `${fastest} ms`;
    averageLatency.textContent = `${average} ms`;
    latestLatencyInsight.textContent = `${latest} ms`;
    chartWindow.textContent = `${values.length} request${values.length === 1 ? "" : "s"} · current session`;

    drawLatencyChart(values);
}

function drawLatencyChart(values) {
    const left = 48;
    const right = 680;
    const top = 35;
    const bottom = 225;
    const width = right - left;
    const height = bottom - top;
    const maxValue = Math.max(...values, 20);
    const paddedMax = maxValue * 1.25;

    const points = values.map((value, index) => {
        const x = values.length === 1 ? left + width / 2 : left + (index / (values.length - 1)) * width;
        const y = bottom - (value / paddedMax) * height;
        return { x, y, value };
    });

    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1].x.toFixed(1)} ${bottom} L${points[0].x.toFixed(1)} ${bottom} Z`;

    latencyLinePath.setAttribute("d", line);
    latencyAreaPath.setAttribute("d", area);
    latencyDots.innerHTML = points.map((point, index) => {
        const radius = index === points.length - 1 ? 6 : 4;
        return `<circle class="latency-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius}"></circle>`;
    }).join("");

    const latest = points[points.length - 1];
    latencyTooltip.hidden = false;
    latencyTooltip.querySelector("b").textContent = `${latest.value} ms`;
    chartEmpty.hidden = true;
}
