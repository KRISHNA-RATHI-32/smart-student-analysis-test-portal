import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type UserPayload } from "@/lib/api";

export interface User {
  id: string;
  role: "admin" | "teacher" | "student";
  email: string;
  fullName: string;
  username: string;
  batch?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

function toUser(u: UserPayload): User {
  return {
    id: u._id,
    role: u.role,
    email: u.email,
    fullName: u.fullName,
    username: u.username,
    batch: u.batch,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try restoring session from cookie via /me endpoint
  useEffect(() => {
    const restore = async () => {
      // First try localStorage cache for instant render
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem("user");
        }
      }

      // Then validate with backend (cookies are sent automatically)
      try {
        const res = await authApi.getCurrentUser();
        const u = toUser(res.data);
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      } catch {
        // Cookie expired or invalid — clear local state
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const u = toUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear local state regardless
    }
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
