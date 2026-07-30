import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import AppRoot from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// Clear stale localStorage from old persist-enabled vault store
try {
  const raw = localStorage.getItem("piggy-vault");
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.state?.transactions) {
      // Remove any transactions with null timestamps
      parsed.state.transactions = parsed.state.transactions.filter(
        (tx: { timestamp?: unknown }) => tx.timestamp != null && tx.timestamp !== "Invalid Date",
      );
      localStorage.setItem("piggy-vault", JSON.stringify(parsed));
    }
  }
} catch {
  // Ignore parse errors — clear corrupted data entirely
  localStorage.removeItem("piggy-vault");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRoot />
    </QueryClientProvider>
  </StrictMode>,
);
