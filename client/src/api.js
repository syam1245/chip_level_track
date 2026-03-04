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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/session")) {
    window.dispatchEvent(new Event("session:expired"));
  }

  return response;
};

export default API_BASE_URL;
