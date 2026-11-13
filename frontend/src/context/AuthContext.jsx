import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, registerUser, setUnauthorizedHandler } from "../api/client.js";
import { clearToken, readToken, saveToken } from "../utils/tokenStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until we know whether the saved token is still valid
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // On first load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    setUnauthorizedHandler(logout);

    if (!readToken()) {
      setIsCheckingSession(false);
      return;
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsCheckingSession(false));
  }, [logout]);

  const startSession = useCallback((response) => {
    saveToken(response.access_token);
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await loginUser(credentials)),
    [startSession]
  );

  const register = useCallback(
    async (details) => startSession(await registerUser(details)),
    [startSession]
  );

  const value = useMemo(
    () => ({ user, isCheckingSession, login, register, logout }),
    [user, isCheckingSession, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
