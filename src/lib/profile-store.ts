import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isKids: boolean;
  isDefault: boolean;
}

interface ProfileState {
  activeProfile: Profile | null;
  showProfileGate: boolean;
  setActive: (profile: Profile | null) => void;
  showGate: () => void;
  hideGate: () => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      showProfileGate: false,
      setActive: (profile) => set({ activeProfile: profile, showProfileGate: false }),
      showGate: () => set({ showProfileGate: true }),
      hideGate: () => set({ showProfileGate: false }),
    }),
    { name: "jose-demo-profile" }
  )
);
