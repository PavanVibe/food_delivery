import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";
import { setUnauthorizedHandler, TOKEN_KEY } from "../api/client";
import { AuthContext, STAFF_ROLES } from "./contexts";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // Restore the session from a stored token on first load
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then(({ data }) => setUser(data))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const startSession = useCallback(({ data }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback((credentials) => authApi.login(credentials).then(startSession), [startSession]);
  const register = useCallback((details) => authApi.register(details).then(startSession), [startSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user && STAFF_ROLES.includes(user.role)),
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
