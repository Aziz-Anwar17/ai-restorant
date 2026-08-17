"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient, authEnabled, type User } from "@/lib/firebaseClient";

type Profile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  credits: number;
} | null;

type AuthCtx = {
  enabled: boolean;
  user: User | null;
  profile: Profile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  enabled: false,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

/** Attach the Firebase ID token (when signed in) to an API request. */
export async function authedFetch(input: string, init: RequestInit = {}) {
  const token = await authClient.idToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!authEnabled) return;
    try {
      const res = await authedFetch("/api/me");
      const data = await res.json();
      setProfile(data.authenticated ? data.user : null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const off = authClient.onChange(async (u) => {
      setUser(u);
      setLoading(false);
      if (u) await refreshProfile();
      else setProfile(null);
    });
    return off;
  }, [refreshProfile]);

  return (
    <Ctx.Provider
      value={{
        enabled: authEnabled,
        user,
        profile,
        loading,
        refreshProfile,
        signOut: () => authClient.signOut(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
