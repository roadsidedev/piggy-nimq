import { useState, useEffect, useCallback } from "react";
import { apiPost, apiGet, setToken, clearToken } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import type { UserProfile } from "@piggy/shared/types";

interface AuthState {
  status: "unauthenticated" | "authenticating" | "authenticated";
  user: UserProfile | null;
  error: string | null;
}

interface AuthNonceResponse {
  success: boolean;
  data?: { nonce: string; message: string };
  error?: string;
}

interface AuthVerifyResponse {
  success: boolean;
  data?: {
    token: string;
    address: string;
    user: UserProfile;
  };
  error?: string;
}

interface AuthMeResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    status: "unauthenticated",
    user: null,
    error: null,
  });
  const { address, isConnected, signMessage } = useWallet();

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem("piggy-session-token");
    if (token) {
      apiGet<AuthMeResponse>("/auth/me")
        .then((res) => {
          if (res.success && res.data) {
            setState({
              status: "authenticated",
              user: res.data,
              error: null,
            });
          } else {
            clearToken();
            setState({ status: "unauthenticated", user: null, error: null });
          }
        })
        .catch(() => {
          clearToken();
          setState({ status: "unauthenticated", user: null, error: null });
        });
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      setState((s) => ({ ...s, error: "Wallet not connected" }));
      return;
    }

    setState({ status: "authenticating", user: null, error: null });

    try {
      // Step 1: Get nonce
      const nonceRes = await apiPost<AuthNonceResponse>("/auth/nonce", {
        address,
      });

      if (!nonceRes.success || !nonceRes.data) {
        throw new Error(nonceRes.error ?? "Failed to get nonce");
      }

      // Step 2: Sign message with wallet
      const signature = await signMessage(nonceRes.data.message);

      if (!signature) {
        throw new Error("User rejected signing");
      }

      // Step 3: Verify signature
      const verifyRes = await apiPost<AuthVerifyResponse>("/auth/verify", {
        address,
        signature,
        nonce: nonceRes.data.nonce,
      });

      if (!verifyRes.success || !verifyRes.data) {
        throw new Error(verifyRes.error ?? "Verification failed");
      }

      // Store token
      setToken(verifyRes.data.token);

      setState({
        status: "authenticated",
        user: verifyRes.data.user,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setState({ status: "unauthenticated", user: null, error: message });
    }
  }, [address, isConnected, signMessage]);

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout", {});
    } catch {
      // Ignore errors on logout
    }
    clearToken();
    setState({ status: "unauthenticated", user: null, error: null });
  }, []);

  return {
    ...state,
    authenticate,
    logout,
    isAuthenticated: state.status === "authenticated",
  };
}
