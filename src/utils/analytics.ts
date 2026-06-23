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
}

export const analytics = {
  track: sendEvent,
};
