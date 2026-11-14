// The only file that talks to the backend. Pages call these functions
// and never use fetch() directly.

import { readToken } from "../utils/tokenStorage.js";

// VITE_API_URL may be given with or without "/api/v1" and a trailing slash
// (e.g. "https://api.example.com/"); all forms end up as ".../api/v1".
function apiBase(raw) {
  const url = (raw || "http://localhost:8000").trim().replace(/\/+$/, "");
  return url.endsWith("/api/v1") ? url : `${url}/api/v1`;
}

const BASE_URL = apiBase(import.meta.env.VITE_API_URL);

// AuthContext registers a function here. It runs when the server answers
// 401 (token expired), so the user is logged out in one place.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { auth = true, ...options } = {}) {
  const headers = { ...options.headers };
  const token = readToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    // fetch only throws when the request never reached the server
    throw new Error("Could not reach the server. Check that the backend is running.");
  }

  if (response.status === 204) return null; // delete has no body

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized();
    const error = new Error(
      typeof body?.detail === "string" ? body.detail : "Something went wrong. Try again."
    );
    error.status = response.status;
    throw error;
  }
  return body;
}

function postJson(path, data, options = {}) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
}

// ---------- auth ----------

export function registerUser({ name, email, password }) {
  return postJson("/auth/register", { name, email, password }, { auth: false });
}

export function loginUser({ email, password }) {
  return postJson("/auth/login", { email, password }, { auth: false });
}

export function getCurrentUser() {
  return request("/auth/me");
}

// ---------- analyses ----------

/** The resume goes either as a PDF file or as plain text, never both. */
export function createMatch({ jdText, resumeText, resumeFile }) {
  const formData = new FormData();
  formData.append("jd_text", jdText);
  if (resumeFile) {
    formData.append("resume_file", resumeFile);
  } else {
    formData.append("resume_text", resumeText);
  }
  return request("/matches", { method: "POST", body: formData });
}

export function listMatches() {
  return request("/matches?limit=100");
}

export function getMatch(id) {
  return request(`/matches/${id}`);
}

export function deleteMatch(id) {
  return request(`/matches/${id}`, { method: "DELETE" });
}

export function getDashboard() {
  return request("/dashboard");
}

export function rankResumes({ jdText, resumeFiles }) {
  const formData = new FormData();
  formData.append("jd_text", jdText);
  resumeFiles.forEach((file) => formData.append("resume_files", file));
  return request("/rankings", { method: "POST", body: formData });
}

export function getSkillInsights() {
  return request("/insights/skills");
}
