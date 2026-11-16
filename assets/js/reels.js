import { createReelPlayer } from "./reel-player.js?v=viewer-3";

export function initReels(root) {
  const carousel = root.querySelector(".reels-carousel");
  const stage = carousel?.querySelector(".reels-grid");
  if (!stage) return;
  // Add another .reel-card in index.html: slides and controls use this list automatically.
  const sources = [...stage.querySelectorAll(".reel-card")];
  if (sources.length < 3) return;
  const navigation = carousel.querySelector(".reels-navigation");
  const status = carousel.querySelector(".reels-status");
  const dots = carousel.querySelector(".reels-dots");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const slideDuration = 720;
  const playReel = sources.some((card) => card.hasAttribute("data-reel-video"))
    ? createReelPlayer(sources.filter((card) => card.hasAttribute("data-reel-video")), {
        onSelect: (card) => {
          active = sources.indexOf(card);
          render();
        },
        getReturnFocus: () => stage.querySelector(".reel-card.is-active") || carousel,
      })
    : null;
  let active = 2;
  let moving = false;
  let shift = 0;
  let gesture = null;
  let suppressClick = false;
  let suppressionTimer;
  const wrap = (index) => ((index % sources.length) + sources.length) % sources.length;
  const title = (index) => sources[index].querySelector("img").alt;
  const visibleRadius = () => (window.innerWidth <= 680 ? 1 : 2);
  const step = () => stage.clientWidth * (window.innerWidth <= 680 ? 0.56 : 0.185);

  const position = (nextShift = shift) => {
    shift = nextShift;
    const spacing = step();
    stage.querySelectorAll(".reel-card").forEach((card) => {
      const offset = Number(card.dataset.slot) + shift;
      const distance = Math.min(Math.abs(offset), 2);
      card.style.transform = `translate(-50%, -50%) translate3d(${offset * spacing}px, 0, 0) scale(${1 - distance * 0.14})`;
      card.style.opacity = "1";
      card.style.zIndex = String(1000 - Math.round(Math.abs(offset) * 100));
      card.style.setProperty("--reel-focus", String(Math.max(0, 1 - Math.abs(offset))));
      const hidden = Math.abs(Number(card.dataset.slot)) > visibleRadius();
      card.inert = hidden;
      card.setAttribute("aria-hidden", String(hidden));
    });
  };

  const render = (movedSlots = 0) => {
    stage.classList.remove("is-moving", "is-dragging");
    // Reuse the cards that just moved; only recycle copies beyond the visible stack.
    const existing = new Map();
    stage.querySelectorAll(".reel-card").forEach((card) => {
      if (card.dataset.slot === undefined) {
        card.remove();
        return;
      }
      existing.set(Number(card.dataset.slot) - movedSlots, card);
    });
    const buffer = 2 + Math.floor(sources.length / 2);
    for (let slot = -buffer; slot <= buffer; slot += 1) {
      const index = wrap(active + slot);
      let card = existing.get(slot);
      existing.delete(slot);
      if (card && Number(card.dataset.reelIndex) !== index) {
        card.remove();
        card = null;
      }
      if (!card) {
        card = sources[index].cloneNode(true);
        card.draggable = false;
        card.querySelector("img").draggable = false;
        card.querySelector("img").loading = "eager";
        stage.append(card);
      }
      card.dataset.slot = String(slot);
      card.dataset.reelIndex = String(index);
      card.classList.toggle("is-active", slot === 0);
      card.setAttribute("aria-label", slot === 0 ? sources[index].getAttribute("aria-label") : `Show ${title(index)}`);
      if (slot !== 0) {
        card.setAttribute("role", "button");
        card.removeAttribute("target");
      } else {
        card.removeAttribute("role");
        const target = sources[index].getAttribute("target");
        if (target) card.setAttribute("target", target);
      }
    }
    existing.forEach((card) => card.remove());
    position(0);
    status.textContent = `${String(active + 1).padStart(2, "0")} / ${String(sources.length).padStart(2, "0")} — ${title(active)}`;
    [...dots.children].forEach((dot, index) => {
      dot.setAttribute("aria-pressed", String(index === active));
    });
  };

  const move = (direction, destination = wrap(active + direction)) => {
    if (moving) return;
    moving = true;
    if (stage.contains(document.activeElement)) carousel.focus({ preventScroll: true });
    stage.classList.remove("is-dragging");
    stage.classList.add("is-moving");
    const from = shift;
    const to = -direction;
    const finish = () => {
      active = destination;
      render(direction);
      moving = false;
    };
    if (reducedMotion.matches || Math.abs(to - from) < 0.001) {
      position(to);
      finish();
      return;
    }
    // One clock controls translation, scale, depth, and the active treatment.
    // Settling re-bases the same nodes at exactly the final animated positions.
    const started = performance.now();
    const animate = (now) => {
      const progress = reducedMotion.matches ? 1 : Math.max(0, Math.min((now - started) / slideDuration, 1));
      const eased = progress * progress * (3 - 2 * progress);
      position(from + (to - from) * eased);
      if (progress < 1) window.requestAnimationFrame(animate);
      else finish();
    };
    window.requestAnimationFrame(animate);
  };

  sources.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show reel ${index + 1}: ${title(index)}`);
    dot.addEventListener("click", () => {
      if (index === active) return;
      const forward = wrap(index - active);
      move(forward <= sources.length / 2 ? forward : forward - sources.length, index);
    });
    dots.append(dot);
  });
  navigation.querySelectorAll("[data-reel-direction]").forEach((button) => {
    button.addEventListener("click", () => move(Number(button.dataset.reelDirection)));
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === " " && event.target.matches('.reel-card[role="button"]')) {
      event.preventDefault();
      event.target.click();
    }
  });
  stage.addEventListener("click", (event) => {
    const card = event.target.closest(".reel-card");
    if (!card) return;
    if (suppressClick || moving) {
      event.preventDefault();
      return;
    }
    const slot = Number(card.dataset.slot);
    if (slot !== 0) {
      event.preventDefault();
      move(slot, wrap(active + slot));
    } else if (
      card.hasAttribute("data-reel-video") && playReel &&
      !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
    ) {
      event.preventDefault();
      playReel(card);
    }
  });
  stage.addEventListener("dragstart", (event) => event.preventDefault());
  stage.addEventListener("pointerdown", (event) => {
    if (moving || !event.isPrimary || event.button !== 0) return;
    stage.classList.remove("is-moving");
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0, dragging: false };
  });
  stage.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const x = event.clientX - gesture.x;
    const y = event.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.abs(y) > 10 && Math.abs(y) > Math.abs(x)) {
        gesture = null;
        return;
      }
      if (Math.abs(x) < 8) return;
      gesture.dragging = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("is-dragging");
    }
    gesture.distance = Math.max(-step(), Math.min(step(), x));
    position(gesture.distance / step());
  });
  const finishGesture = (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const { distance, dragging } = gesture;
    gesture = null;
    if (!dragging) return;
    suppressClick = true;
    window.clearTimeout(suppressionTimer);
    suppressionTimer = window.setTimeout(() => { suppressClick = false; }, 150);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (event.type !== "pointercancel" && Math.abs(distance) >= Math.min(55, step() * 0.2)) {
      move(distance < 0 ? 1 : -1);
    } else {
      move(0, active);
    }
  };
  stage.addEventListener("pointerup", finishGesture);
  stage.addEventListener("pointercancel", finishGesture);
  stage.addEventListener("pointerleave", () => { if (gesture && !gesture.dragging) gesture = null; });
  window.addEventListener("resize", () => { if (!moving) position(); });
  carousel.classList.add("is-ready");
  navigation.hidden = false;
  render();
}
