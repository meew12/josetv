// Store de navegación por estado (SPA dentro de la ruta /)
import { create } from "zustand";

export type View =
  | "loading"
  | "landing"
  | "login"
  | "register"
  | "browse"
  | "search"
  | "watch"
  | "series"
  | "live"
  | "adult"
  | "mylist"
  | "history"
  | "profile"
  | "subscription"
  | "admin";

interface NavState {
  view: View;
  params: Record<string, string>;
  // navegación
  navigate: (view: View, params?: Record<string, string>) => void;
  back: () => void;
  history: { view: View; params: Record<string, string> }[];
}

export const useNav = create<NavState>((set, get) => ({
  view: "loading",
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    const current = { view: get().view, params: get().params };
    set({
      view,
      params,
      history: [...get().history.slice(-30), current],
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },
  back: () => {
    const h = get().history;
    if (h.length === 0) {
      set({ view: "browse" });
      return;
    }
    const last = h[h.length - 1];
    set({ view: last.view, params: last.params, history: h.slice(0, -1) });
  },
}));
