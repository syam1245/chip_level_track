

const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "" // same origin on Render
    : "http://localhost:5000"; // local dev

export default API_BASE_URL;
