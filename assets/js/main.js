import { initNavigation } from "./navigation.js";
import { initServices } from "./services.js";
import { initWork } from "./work.js?v=reel-continuity-4";
import { initAudio } from "./audio.js";
import { initProcess } from "./process.js";
import { initMotion } from "./motion.js?v=closing-motion-1";
import { initProof } from "./proof.js";
import { initSmoothScroll } from "./smooth-scroll.js";

// Audio opens the entry dialog before motion waits for the dialog to close.
initNavigation();
initProof();
initWork();
initServices();
initAudio();
initSmoothScroll();
initProcess();
initMotion();

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
