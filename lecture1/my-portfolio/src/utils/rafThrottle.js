export function rafThrottle(callback) {
  let ticking = false;
  let lastArgs = null;

  const throttled = (...args) => {
    lastArgs = args;
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      callback(...lastArgs);
      ticking = false;
    });
  };

  return throttled;
}
