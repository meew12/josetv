import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  adultVerified: boolean;
  token: string; // JWT
  accessToken?: string | null; // token simple legible
  subscription?: {
    status: string;
    endDate: string;
    plan?: { name: string; quality: string; screens: number };
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAuthenticated: () => get().user !== null,
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    { name: "jose-demo-auth" }
  )
);
