

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "" // same origin on Render
    : "http://localhost:5000"; // local dev

export default API_BASE_URL;
