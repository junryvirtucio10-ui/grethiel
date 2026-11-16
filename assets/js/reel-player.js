const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const playIcon = icon('<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>');
const pauseIcon = icon('<path d="M8 5v14M16 5v14" stroke-width="3"/>');
const soundIcon = icon('<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>');
const muteIcon = icon('<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="m16 9 6 6m0-6-6 6"/>');
const fullscreenIcon = icon('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>');

export function createReelPlayer(cards, { onSelect, getReturnFocus } = {}) {
  const dialog = document.createElement("dialog");
  if (!dialog.showModal) return null;
  const reels = cards.map((card) => ({
    card,
    url: card.href,
    poster: card.querySelector("img").src,
    title: card.querySelector("img").alt,
    category: card.dataset.reelCategory || "Client work",
    description: card.dataset.reelDescription || "A selection from my short-form editing work.",
    duration: card.dataset.reelDuration || "—",
  }));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  dialog.className = "reel-player";
  dialog.setAttribute("aria-labelledby", "reel-player-title");
  dialog.innerHTML = `
    <div class="reel-player-window">
      <header class="reel-player-topbar">
        <span class="reel-player-brand">Grethiel<span> / In motion</span></span>
        <button class="reel-player-close" type="button" autofocus aria-label="Close reel and return to work">
          <span>Back to work</span>${icon('<path d="m6 6 12 12M6 18 18 6"/>')}
        </button>
      </header>
      <div class="reel-player-shell">
        <div class="reel-player-screen">
          <div class="reel-player-media">
            <video controls playsinline preload="metadata"></video>
            <img class="reel-player-poster" alt="" />
          </div>
          <div class="reel-player-loading" role="status" aria-live="polite"><i></i><span></span></div>
          <button class="reel-player-big-play" type="button" aria-label="Play reel">${playIcon}</button>
          <div class="reel-player-controls">
            <input class="reel-player-seek" type="range" min="0" max="1" value="0" step="0.1" aria-label="Seek through reel" disabled />
            <div class="reel-player-toolbar">
              <button class="reel-player-toggle" type="button" aria-label="Pause reel">${pauseIcon}</button>
              <span class="reel-player-time"><span class="reel-player-elapsed">0:00</span><span class="reel-player-time-divider">/</span><span class="reel-player-total">—</span></span>
              <button class="reel-player-mute" type="button" aria-label="Mute reel" aria-pressed="false">${soundIcon}</button>
              <button class="reel-player-fullscreen" type="button" aria-label="Enter fullscreen">${fullscreenIcon}</button>
            </div>
          </div>
          <div class="reel-player-error" hidden>
            <strong>Let’s give that another try.</strong>
            <p>This reel couldn’t load.</p>
            <button class="reel-player-retry" type="button">Try again ${icon('<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>')}</button>
            <a>Open video directly ↗</a>
          </div>
        </div>
        <aside class="reel-player-info">
          <div class="reel-player-project-copy">
            <p class="reel-player-eyebrow">CLIENT WORK <span> / SHORT-FORM</span></p>
            <h2 id="reel-player-title"></h2>
            <p class="reel-player-description"></p>
            <div class="reel-player-tags"><span>Video editing</span><span>Captions</span></div>
            <dl class="reel-player-details">
              <div><dt>Category</dt><dd class="reel-player-category"></dd></div>
              <div><dt>Runtime</dt><dd class="reel-player-duration"></dd></div>
            </dl>
          </div>
          <nav class="reel-player-projects" aria-label="Choose a client reel">
            <p class="reel-player-nav-label">MORE TO EXPLORE ${icon('<path d="M4 12h16m-6-6 6 6-6 6"/>')}</p>
            <div class="reel-player-project-list"></div>
          </nav>
          <span class="reel-player-keyboard-hint"><kbd>esc</kbd> to return to the work</span>
        </aside>
      </div>
    </div>`;
  document.body.append(dialog);

  const screen = dialog.querySelector(".reel-player-screen");
  const player = dialog.querySelector("video");
  const poster = dialog.querySelector(".reel-player-poster");
  const title = dialog.querySelector("h2");
  const error = dialog.querySelector(".reel-player-error");
  const status = dialog.querySelector(".reel-player-loading span");
  const seek = dialog.querySelector(".reel-player-seek");
  const toggle = dialog.querySelector(".reel-player-toggle");
  const bigPlay = dialog.querySelector(".reel-player-big-play");
  const mute = dialog.querySelector(".reel-player-mute");
  const fullscreen = dialog.querySelector(".reel-player-fullscreen");
  const total = dialog.querySelector(".reel-player-total");
  const elapsed = dialog.querySelector(".reel-player-elapsed");
  const soundtrack = document.querySelector("#portfolio-audio");
  const buttons = [];
  let active = 0;
  let resumeSoundtrack = false;
  let closing = false;
  let closeTimer = 0;
  let switchTimer = 0;
  let pendingIndex = null;
  let controlsTimer = 0;
  let loadingTimer = 0;
  let revealFrame = 0;
  let launchCard = null;

  const formatTime = (seconds) => {
    const time = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;
  };
  const showControls = () => {
    clearTimeout(controlsTimer);
    screen.classList.add("show-controls");
    if (!player.paused && !screen.contains(document.activeElement)) {
      controlsTimer = window.setTimeout(() => screen.classList.remove("show-controls"), 2400);
    }
  };
  const setLoading = (loading) => {
    clearTimeout(loadingTimer);
    if (!loading) {
      screen.classList.remove("is-loading");
      status.textContent = "";
      return;
    }
    loadingTimer = window.setTimeout(() => {
      if (!dialog.open || closing) return;
      screen.classList.add("is-loading");
      status.textContent = "Loading reel…";
    }, 250);
  };
  const updateTime = () => {
    const duration = player.duration;
    const validDuration = Number.isFinite(duration) && duration > 0;
    seek.disabled = !validDuration;
    if (validDuration) {
      seek.max = String(duration);
      seek.value = String(player.currentTime);
      seek.style.setProperty("--reel-played", `${(player.currentTime / duration) * 100}%`);
      seek.setAttribute("aria-valuetext", `${formatTime(player.currentTime)} of ${formatTime(duration)}`);
      total.textContent = formatTime(duration);
      dialog.querySelector(".reel-player-duration").textContent = formatTime(duration);
    }
    elapsed.textContent = formatTime(player.currentTime);
  };
  const updatePlayback = () => {
    const playing = !player.paused && !player.ended;
    screen.classList.toggle("is-playing", playing);
    toggle.innerHTML = playing ? pauseIcon : playIcon;
    toggle.setAttribute("aria-label", playing ? "Pause reel" : "Play reel");
    bigPlay.setAttribute("aria-label", player.ended ? "Replay reel" : "Play reel");
    showControls();
  };
  const play = () => {
    player.play().catch((error) => {
      if (error?.name === "AbortError" || !dialog.open || closing) return;
      setLoading(false);
      updatePlayback();
    });
  };
  const togglePlayback = () => {
    if (player.paused || player.ended) play();
    else player.pause();
  };

  const loadReel = (index) => {
    const reel = reels[index];
    active = index;
    pendingIndex = null;
    screen.classList.remove("has-frame", "is-playing", "has-error");
    player.pause();
    error.hidden = true;
    poster.src = reel.poster;
    player.poster = reel.poster;
    player.src = reel.url;
    player.setAttribute("aria-label", reel.title);
    title.textContent = reel.title;
    dialog.querySelector(".reel-player-description").textContent = reel.description;
    dialog.querySelector(".reel-player-category").textContent = reel.category;
    dialog.querySelector(".reel-player-duration").textContent = reel.duration;
    total.textContent = reel.duration;
    elapsed.textContent = "0:00";
    seek.disabled = true;
    seek.value = "0";
    seek.style.setProperty("--reel-played", "0%");
    error.querySelector("a").href = reel.url;
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === active;
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".reel-player-project-state").textContent = selected ? "Now viewing" : "Watch reel";
    });
    setLoading(true);
    play();
  };
  const selectReel = (index) => {
    if (closing) return;
    clearTimeout(switchTimer);
    if (index === active) {
      screen.classList.remove("is-switching");
      if (pendingIndex !== null) play();
      pendingIndex = null;
      return;
    }
    pendingIndex = index;
    screen.classList.add("is-switching");
    player.pause();
    switchTimer = window.setTimeout(() => {
      loadReel(index);
      onSelect?.(reels[index].card);
      screen.classList.remove("is-switching");
    }, reducedMotion.matches ? 0 : 160);
  };

  const list = dialog.querySelector(".reel-player-project-list");
  reels.forEach((reel, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reel-player-project";
    button.setAttribute("aria-label", `Watch ${reel.title}`);
    button.innerHTML = `<img alt="" loading="lazy" /><span class="reel-player-project-text"><strong></strong><span class="reel-player-project-state"></span></span><span class="reel-player-project-arrow">${playIcon}</span>`;
    button.querySelector("img").src = reel.poster;
    button.querySelector("strong").textContent = reel.title;
    button.addEventListener("click", () => selectReel(index));
    buttons.push(button);
    list.append(button);
  });

  const close = () => {
    if (!dialog.open || closing) return;
    closing = true;
    clearTimeout(switchTimer);
    pendingIndex = null;
    cancelAnimationFrame(revealFrame);
    player.pause();
    setLoading(false);
    dialog.classList.remove("is-visible");
    closeTimer = window.setTimeout(() => dialog.close(), reducedMotion.matches ? 0 : 220);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (screen.requestFullscreen) screen.requestFullscreen().catch(() => {});
    else player.webkitEnterFullscreen?.();
  };

  dialog.querySelector(".reel-player-close").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
  let backdropPress = false;
  dialog.addEventListener("pointerdown", (event) => { backdropPress = event.target === dialog; });
  dialog.addEventListener("click", (event) => {
    if (backdropPress && event.target === dialog) close();
    backdropPress = false;
  });
  dialog.addEventListener("close", () => {
    clearTimeout(closeTimer);
    clearTimeout(switchTimer);
    clearTimeout(controlsTimer);
    clearTimeout(loadingTimer);
    cancelAnimationFrame(revealFrame);
    closing = false;
    dialog.classList.remove("is-visible");
    player.pause();
    player.removeAttribute("src");
    player.load();
    if (resumeSoundtrack) soundtrack.play().catch(() => {});
    resumeSoundtrack = false;
    const returnFocus = getReturnFocus?.() || launchCard;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  toggle.addEventListener("click", togglePlayback);
  bigPlay.addEventListener("click", togglePlayback);
  player.addEventListener("click", togglePlayback);
  mute.addEventListener("click", () => { player.muted = !player.muted; });
  fullscreen.addEventListener("click", toggleFullscreen);
  fullscreen.hidden = !screen.requestFullscreen && !player.webkitEnterFullscreen;
  seek.addEventListener("input", () => {
    if (Number.isFinite(player.duration)) player.currentTime = Number(seek.value);
    updateTime();
    showControls();
  });
  screen.addEventListener("pointermove", showControls);
  screen.addEventListener("pointerdown", showControls, { passive: true });
  screen.addEventListener("focusin", showControls);
  screen.addEventListener("focusout", showControls);
  player.addEventListener("loadedmetadata", updateTime);
  player.addEventListener("timeupdate", updateTime);
  player.addEventListener("play", updatePlayback);
  player.addEventListener("pause", updatePlayback);
  player.addEventListener("ended", updatePlayback);
  player.addEventListener("waiting", () => setLoading(true));
  player.addEventListener("seeking", () => setLoading(true));
  player.addEventListener("seeked", () => setLoading(false));
  player.addEventListener("canplay", () => setLoading(false));
  player.addEventListener("playing", () => {
    screen.classList.add("has-frame");
    setLoading(false);
    updatePlayback();
  });
  player.addEventListener("volumechange", () => {
    mute.innerHTML = player.muted ? muteIcon : soundIcon;
    mute.setAttribute("aria-label", player.muted ? "Unmute reel" : "Mute reel");
    mute.setAttribute("aria-pressed", String(player.muted));
    showControls();
  });
  player.addEventListener("error", () => {
    if (!dialog.open || closing || !player.hasAttribute("src")) return;
    setLoading(false);
    error.hidden = false;
    screen.classList.add("has-error");
  });
  dialog.querySelector(".reel-player-retry").addEventListener("click", () => loadReel(active));
  dialog.addEventListener("keydown", (event) => {
    if (event.target.closest("input, button, a") || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === " " || event.key.toLowerCase() === "k") {
      event.preventDefault();
      togglePlayback();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (!Number.isFinite(player.duration)) return;
      event.preventDefault();
      player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + (event.key === "ArrowRight" ? 5 : -5)));
      updateTime();
      showControls();
    }
  });
  // Replace native chrome only after the accessible custom controls are ready.
  player.controls = false;

  return (card) => {
    const index = reels.findIndex((reel) => reel.url === card.href);
    if (index < 0) return;
    if (dialog.open) { selectReel(index); return; }
    launchCard = card;
    resumeSoundtrack = Boolean(soundtrack && !soundtrack.paused);
    soundtrack?.pause();
    closing = false;
    screen.classList.remove("is-switching");
    dialog.showModal();
    loadReel(index);
    // Paint the poster before easing the viewer into the top layer.
    revealFrame = requestAnimationFrame(() => {
      revealFrame = requestAnimationFrame(() => dialog.classList.add("is-visible"));
    });
  };
}
