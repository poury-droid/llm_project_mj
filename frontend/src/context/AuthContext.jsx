import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as supabaseAuth from "../services/supabaseAuth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await supabaseAuth.getCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (credentials) => {
    const data = await supabaseAuth.signIn(credentials.email, credentials.password, credentials.remember);
    const nextUser = { id: data.user.id, email: data.user.email };
    setUser(nextUser);
    return nextUser;
  }, []);

  const signUp = useCallback(async (credentials) => {
    const data = await supabaseAuth.signUp(credentials.email, credentials.password);
    if (!data.session) throw new Error("가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.");
    const nextUser = { id: data.user.id, email: data.user.email };
    setUser(nextUser);
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    await supabaseAuth.signOut();
    setUser(null);
  }, []);

  const signInWithGoogle = useCallback(() => {
    supabaseAuth.signInWithGoogle();
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, signInWithGoogle, refreshUser }),
    [user, loading, signIn, signUp, signOut, signInWithGoogle, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
