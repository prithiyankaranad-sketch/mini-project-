import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { AppRole, Profile } from "../../types/database";

type AuthState = {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  error: string | null;
  recoveryAllowed: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  finishRecovery: () => void;
};
const Context = createContext<AuthState | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);
  const [recoveryUntil, setRecoveryUntil] = useState(0);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const version = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        if (version === generation.current) {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
        return;
      }
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (version !== generation.current) return;
      setUser(data.user);
      setProfile(null);
      setRoles([]);
      if (!data.user.email_confirmed_at) return;
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", data.user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      if (version !== generation.current) return;
      setProfile(p.data);
      setRoles(r.data.map((v) => v.role));
    } catch (e) {
      if (version === generation.current) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setError(
          e instanceof Error ? e.message : "Account verification failed.",
        );
      }
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!supabase) return;
    // Do not await Supabase calls inside this callback (Auth lock deadlock).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY")
        setRecoveryUntil(Date.now() + 15 * 60_000);
      if (event === "SIGNED_OUT") setRecoveryUntil(0);
      setTimeout(() => {
        void refresh();
      }, 0);
    });
    void refresh();
    return () => {
      subscription.unsubscribe();
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    if (!recoveryUntil) return;
    const timer = setTimeout(
      () => setRecoveryUntil(0),
      Math.max(0, recoveryUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [recoveryUntil]);
  const signOut = async () => {
    if (!supabase) return;
    const { error: failure } = await supabase.auth.signOut();
    if (failure) throw failure;
    generation.current++;
    setUser(null);
    setProfile(null);
    setRoles([]);
    setRecoveryUntil(0);
    setError(null);
    setLoading(false);
  };
  return (
    <Context.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        error,
        recoveryAllowed: recoveryUntil > Date.now(),
        refresh,
        signOut,
        finishRecovery: () => setRecoveryUntil(0),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
