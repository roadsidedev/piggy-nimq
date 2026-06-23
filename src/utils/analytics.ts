type AnalyticsEvent =
  | "deposit"
  | "withdraw"
  | "borrow"
  | "repay"
  | "goal_created"
  | "challenge_joined"
  | "yield_toggled"
  | "recurring_created"
  | "wallet_connected";

function sendEvent(event: AnalyticsEvent, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log("[Analytics]", event, data);
  }
  try {
    const payload = { event, data, timestamp: new Date().toISOString(), url: window.location.href };
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics are best-effort
  }
}

export function trackError(error: Error, context?: Record<string, unknown>): void {
  console.error("[Error]", error, context);
  try {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: { message: error.message, name: error.name, stack: error.stack },
        context,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // error logging is best-effort
  }
}

export const analytics = {
  track: sendEvent,
};
