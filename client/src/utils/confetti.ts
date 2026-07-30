import confetti from "canvas-confetti";

const PIGGY_COLORS = ["#ffb096", "#ff6f91", "#e14c74", "#ffd0bc", "#c93e63"];

export function fireConfetti() {
  confetti({
    particleCount: 15,
    spread: 60,
    origin: { x: 0.5, y: 1 },
    colors: PIGGY_COLORS,
    ticks: 90,
    gravity: 1.2,
    scalar: 1.1,
    shapes: ["circle"],
    zIndex: 9999,
  });
}
