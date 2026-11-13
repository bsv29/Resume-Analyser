// The login token is kept in localStorage so a page refresh keeps the user
// logged in. try/catch because storage can be blocked (private mode).

const KEY = "shortlist.token";

export function readToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // the session still works until the tab is closed
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
