# Grethiel — Portfolio

A static portfolio website using HTML, CSS, and browser JavaScript modules. No build step is required.

## Files

- `index.html` — page content, project links, and footer contact link.
- `assets/css/styles.css` — shared typography, variables, navigation, and layout utilities.
- `assets/css/sections.css` — work gallery and media interactions.
- `assets/css/services.css` — service cards and their animated compositions.
- `assets/css/hero.css`, `process.css`, `about.css` — section-specific styling.
- `assets/js/reels.js` — five-card carousel with portrait 9:16 cards layered behind a larger active center reel. The third reel starts in the center; dragging, side-card selection, dots, and arrow keys loop through the work with a 720ms ease-in/out slide. Cards retain their DOM nodes as they settle; movement, scale, depth, and active styling follow the same animation progress. Cards stay visually still on hover. Phones retain a larger swipeable center card.
- `assets/js/reel-player.js`, `assets/css/reel-player.css` — animated client reel viewer with a portrait player, project panel, thumbnail switching, accessible playback/seek/sound/fullscreen controls, and a compact phone layout. Closing returns focus to the selected carousel card; the soundtrack pauses during viewing and resumes only if it was already playing. Motion follows the visitor's reduced-motion preference.
- `assets/videos/` — web-ready MP4 copies of the client voiceover and fashion reels; their poster frames are in `assets/images/`.
- `assets/images/instagram-*-thumbnail.jpg` — clean, local cover images from the three supplied Ibrahim Ansari Instagram reels. The Dreams cover is framed to remove black bars; Enjoy Life uses its wide image in a portrait cover layout so both subjects stay visible. The active Instagram cards open the original reels in a new tab.
- `assets/css/proof.css`, `assets/js/proof.js` — published-work proof section, layered carousel, keyboard/swipe controls, and counts from the work gallery.
- `assets/css/footer.css` — closing call to action with the original office photo, gold email button, and responsive layout. The `#contact` anchor leads to the footer; its button opens an email to `grethieljoyc@gmail.com`.
- `assets/css/audio.css` — soundtrack controls and entry dialog.
- `assets/css/motion.css` — scroll reveals and motion preferences.
- `assets/js/smooth-scroll.js` — starts directly from an async module in the page head, independently of the other portfolio modules. Desktop wheel scrolling has a 220ms response time for a noticeable glide. Touch, keyboard navigation, nested scroll areas, open dialogs, and reduced-motion preferences keep native behavior. Adjust `easeTime` to change the ease-out (higher values glide longer).
- `assets/js/main.js` — initializes the feature modules beside it.
- `assets/images/`, `assets/audio/` — files used by the website.
- `assets/images/grethiel-circle-favicon.svg` — outlined gold G on a white circle with transparent corners, with 16px, 32px, and 512px PNG exports and a 180px Apple touch icon beside it. The tab uses PNGs for compatibility with Live Server; `favicon.ico` provides the standard 16/32/48px fallback.
- `archive/original-assets/` — unused originals and earlier exports retained for future editing.
- `scripts/check.mjs` — checks local references, HTML anchors, and JavaScript syntax.

## Preview

Run this from the project folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765` in a browser. Use a local server so the JavaScript modules load correctly.

## Check and format

```sh
node scripts/check.mjs
npx prettier --write index.html 'assets/css/*.css' 'assets/js/*.js' 'scripts/*.mjs'
```

Formatting settings are stored in `.prettierrc.json`.

## Editing and deployment

Edit page text and project links in `index.html`. Adjust a section's appearance in its stylesheet and its interactions in the corresponding JavaScript module.

To add a reel, duplicate one `.reel-card` inside `.reels-carousel .reels-grid` in `index.html`. Update its URL, poster path, image alt text, and accessible label. Use `data-reel-video` for a local MP4 that should open in the video dialog. The carousel automatically builds its count and navigation dots. Its center card plays the client video or opens the original Facebook or Instagram reel; selecting any side card brings that reel directly into focus. Keep at least five source cards for the five-card desktop layout, and update the filter totals in the HTML when adding work.

Section 05 (`#proof`) highlights published edits. Its counts describe the unique projects in the work gallery, rather than client results or lifetime totals. Add or edit `.proof-card` links in `index.html` to change its carousel. Controls and the carousel count update automatically. Client feedback can replace or supplement these cards once real feedback is available. The closing footer follows Proof.

Deploy `index.html`, `favicon.ico`, and the entire `assets/` folder together. The archive and development files are not needed for hosting. Google Fonts and two YouTube thumbnails load from external services. Footer inquiries use the visitor’s email application; soundtrack playback begins after a visitor chooses to play it.
