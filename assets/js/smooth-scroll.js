export function initSmoothScroll() {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  // A short, time-based ease feels the same on 60Hz and 120Hz displays.
  const easeTime = 110;
  let frame = 0;
  let current = window.scrollY;
  let target = current;
  let rendered = current;
  let previousTime = 0;
  let listening = false;

  const maximum = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const clamp = (value) => Math.max(0, Math.min(maximum(), value));
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    current = target = rendered = window.scrollY;
  };

  const animate = (time) => {
    const elapsed = Math.min(50, Math.max(0, time - previousTime));
    previousTime = time;
    target = clamp(target);
    current += (target - current) * (1 - Math.exp(-elapsed / easeTime));
    const settled = Math.abs(target - current) < 0.5;
    if (settled) current = target;
    // Bypass CSS anchor smoothing so it does not ease each animation frame again.
    window.scrollTo({ top: current, behavior: "instant" });
    rendered = window.scrollY;
    frame = settled ? 0 : requestAnimationFrame(animate);
  };

  const needsNativeScroll = (event) => {
    for (const element of event.composedPath()) {
      if (!(element instanceof Element) || element === root || element === document.body) continue;
      if (
        element.matches("dialog, select, textarea, input, [contenteditable], [data-native-scroll]")
      ) {
        return true;
      }
      const style = getComputedStyle(element);
      if (!/^(auto|scroll|overlay)$/.test(style.overflowY)) continue;
      if (element.scrollHeight <= element.clientHeight + 1) continue;
      const canScroll =
        event.deltaY < 0
          ? element.scrollTop > 0
          : element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      if (canScroll || /^(contain|none)$/.test(style.overscrollBehaviorY)) return true;
    }
    return false;
  };

  const onWheel = (event) => {
    if (
      event.defaultPrevented ||
      !event.cancelable ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      !event.deltaY ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      document.querySelector("dialog[open]") ||
      needsNativeScroll(event)
    ) {
      stop();
      return;
    }

    const delta =
      event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if ((delta < 0 && window.scrollY <= 0) || (delta > 0 && window.scrollY >= maximum())) {
      stop();
      return;
    }

    event.preventDefault();
    // Reversing direction responds immediately, without finishing the old glide.
    if (!frame || Math.sign(delta) !== Math.sign(target - current)) {
      current = target = window.scrollY;
    }
    target = clamp(target + delta);
    if (!frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  };

  const configure = () => {
    stop();
    const enabled = finePointer.matches && !reducedMotion.matches;
    if (enabled === listening) return;
    listening = enabled;
    if (enabled) window.addEventListener("wheel", onWheel, { passive: false });
    else window.removeEventListener("wheel", onWheel);
  };

  // Native navigation and direct manipulation always take over from a wheel glide.
  window.addEventListener("keydown", stop, { passive: true });
  window.addEventListener("pointerdown", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("resize", stop, { passive: true });
  window.addEventListener("pageshow", stop);
  window.addEventListener("hashchange", stop);
  document.addEventListener("click", stop);
  document.addEventListener("focusin", stop);
  document.addEventListener("visibilitychange", stop);
  window.addEventListener(
    "scroll",
    () => {
      // Honor scrollbar dragging, browser restoration, and other programmatic scrolling.
      if (frame && Math.abs(window.scrollY - rendered) > 1) stop();
    },
    { passive: true },
  );
  reducedMotion.addEventListener("change", configure);
  finePointer.addEventListener("change", configure);
  configure();
}
