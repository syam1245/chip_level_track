const API_BASE_URL =
    import.meta.env.MODE === "production"
        ? ""
        : "http://localhost:5000";

const getCookieValue = (key) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${key}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
};

// Default timeout for all authenticated requests.
// Render free tier cold starts can take 15–50 seconds — without a timeout,
// any request during a cold start hangs the UI indefinitely with no feedback.
// 30s is generous enough to survive a cold start while still giving users
// a clear error rather than an infinite spinner.
const REQUEST_TIMEOUT_MS = 30_000;

export const authFetch = async (path, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        const csrfToken = getCookieValue("chip_csrf");
        if (csrfToken) {
            headers["x-csrf-token"] = csrfToken;
        }
    }

    // Merge the timeout signal with any caller-provided signal (e.g. fetchItems
    // passes an AbortController signal for component-unmount cancellation).
    // AbortSignal.any() aborts the request when EITHER signal fires first.
    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = options.signal
        ? AbortSignal.any([timeoutSignal, options.signal])
        : timeoutSignal;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            method,
            headers,
            credentials: "include",
            signal,
        });
    } catch (err) {
        // Distinguish timeout from network failure for better UX in callers
        if (err.name === "TimeoutError" || (err.name === "AbortError" && timeoutSignal.aborted)) {
            throw new Error("Request timed out — the server may be starting up. Please try again.");
        }
        // Re-throw AbortErrors from the caller's own signal (component unmount)
        // so they propagate naturally and are caught as AbortError upstream.
        if (err.name === "AbortError") throw err;
        // General network failure (offline, DNS, etc.)
        throw new Error("Network error — please check your connection and try again.");
    }

    if (
        response.status === 401 &&
        !path.includes("/auth/login") &&
        !path.includes("/auth/session")
    ) {
        window.dispatchEvent(new Event("session:expired"));
    }

    return response;
};

export default API_BASE_URL;