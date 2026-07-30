import confetti from "canvas-confetti";

const PIGGY_COLORS = ["#ffb096", "#ff6f91", "#e14c74", "#ffd0bc", "#c93e63"];

export function fireConfetti() {
  const myConfetti = confetti.create(undefined, {
    resize: true,
    useWorker: true,
  });

  myConfetti({
    particleCount: 30,
    spread: 70,
    origin: { x: 0.5, y: 0.95 },
    colors: PIGGY_COLORS,
    ticks: 120,
    gravity: 1.0,
    scalar: 1.2,
    shapes: ["circle"],
    zIndex: 2147483647,
    disableForReducedMotion: true,
  });
}
