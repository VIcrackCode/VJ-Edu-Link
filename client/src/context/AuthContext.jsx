import { useEffect, useMemo, useState } from "react";
import { getSession, restoreSession, signIn, signOut } from "../services/authService";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then((nextUser) => setUser(nextUser))
      .catch(() => {
        signOut();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: async (credentials) => {
      const nextUser = await signIn(credentials);
      setUser(nextUser);
      return nextUser;
    },
    logout: () => {
      signOut();
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
