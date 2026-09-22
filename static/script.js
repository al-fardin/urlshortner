const form = document.getElementById("shortenForm");
const longUrlInput = document.getElementById("longUrl");
const aliasInput = document.getElementById("alias");
const shortenBtn = document.getElementById("shortenBtn");
const message = document.getElementById("message");
const resultCard = document.getElementById("resultCard");
const shortUrlLink = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");

let currentShortUrl = "";

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const longUrl = longUrlInput.value.trim();
    const alias = aliasInput.value.trim();

    clearState();

    if (!longUrl) {
        showMessage("Please enter a URL.");
        return;
    }

    if (alias && alias.length < 5) {
        showMessage("Alias must be at least 5 characters.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/shorten", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ longUrl, alias })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not shorten URL.");
        }

        currentShortUrl = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        shortUrlLink.href = data.shortUrl;
        openBtn.href = data.shortUrl;
        resultCard.hidden = false;
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
            copyBtn.textContent = "Copy";
        }, 1400);
    } catch {
        showMessage("Could not copy automatically. Copy the link manually.");
    }
});

function setLoading(loading) {
    shortenBtn.disabled = loading;
    shortenBtn.querySelector("span").textContent = loading ? "Creating..." : "Shorten link";
}

function clearState() {
    message.textContent = "";
    message.className = "message";
    resultCard.hidden = true;
    currentShortUrl = "";
}

function showMessage(text, success = false) {
    message.textContent = text;
    message.className = success ? "message success" : "message";
}
