// Stale-chunk recovery for the Vite SPA.
//
// When a new build is deployed while a user has the site open, the old
// hashed JS chunks (referenced by the already-loaded index.html) no longer
// exist on the server. The next lazy route the user navigates to fails to
// load — the server returns index.html (text/html) in place of the missing
// chunk, producing "Failed to load module script... MIME type text/html" /
// "Failed to fetch dynamically imported module". With no error boundary
// around the route <Suspense>, that surfaces as a blank/broken view.
//
// Mitigation: detect that specific failure and do exactly ONE automatic full
// reload, which fetches the current index.html + current chunk hashes and
// just works. Guarded against an infinite reload loop via a short cooldown
// persisted in sessionStorage — if a reload doesn't resolve it (e.g. a real
// outage, not a stale deploy), we stop instead of hammering reload.

const RELOAD_TS_KEY = "orbitrio:chunk-reloaded-at";

// If we already auto-reloaded within this window and hit another chunk error,
// the reload clearly didn't fix it — stop, to avoid a reload loop. A genuinely
// new incident later in the same tab session (a second deploy) is outside the
// window and is allowed to reload again.
const RELOAD_COOLDOWN_MS = 10_000;

// Matched case-insensitively against the error message. These are the
// cross-browser phrasings for a failed dynamic import / module script load.
const CHUNK_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module", // Chrome/Edge
  "error loading dynamically imported module",   // Firefox
  "failed to load module script",                // Chrome (MIME mismatch)
  "importing a module script failed",            // Safari
  "expected a javascript module script",         // strict MIME rejection
  "'text/html' is not a valid javascript mime",  // explicit MIME text
];

const looksLikeChunkError = (message: unknown): boolean => {
  if (typeof message !== "string" || !message) return false;
  const m = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => m.includes(pattern));
};

// In-memory guard so a burst of events in the same page instance can't call
// reload() more than once before navigation actually happens. sessionStorage
// is the cross-reload guard; this is the within-instance one.
let reloadTriggered = false;

const triggerReloadOnce = (): void => {
  if (reloadTriggered) return;

  const now = Date.now();
  let lastReloadAt = 0;
  try {
    lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_TS_KEY)) || 0;
  } catch {
    // sessionStorage unreadable (rare: hardened privacy modes). Fall through;
    // the in-memory guard still prevents a same-instance double reload.
  }

  if (now - lastReloadAt < RELOAD_COOLDOWN_MS) {
    // We just reloaded and it's still failing — do not loop. Surface it so the
    // user/monitoring sees a real, persistent problem rather than a silent spin.
    console.error(
      "[chunkReload] Chunk load still failing after a recent auto-reload; not reloading again to avoid a loop.",
    );
    return;
  }

  reloadTriggered = true;
  try {
    window.sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  } catch {
    // Best effort — proceed with the reload regardless.
  }

  // Full document reload: pulls the fresh index.html and current chunk hashes.
  window.location.reload();
};

/**
 * Installs global listeners that auto-recover from stale-chunk load failures
 * after a redeploy. Call once, as early as possible, before the app renders.
 */
export const installChunkReloadHandler = (): void => {
  if (typeof window === "undefined") return;

  // Primary: Vite's own signal. The __vitePreload helper (used by every
  // code-split dynamic import, including React.lazy routes) dispatches this
  // when a chunk preload fails. preventDefault() stops Vite from re-throwing
  // it as an uncaught error; we handle recovery ourselves.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    triggerReloadOnce();
  });

  // Fallback: a rejected dynamic import that isn't routed through the Vite
  // preload helper (or where the event didn't fire) bubbles up here.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { message?: unknown } | string | undefined;
    const message = typeof reason === "string" ? reason : reason?.message;
    if (looksLikeChunkError(message)) triggerReloadOnce();
  });

  // Fallback: a module <script> element failing to load fires a window error
  // event. (Element-target load failures have no .message, so this only trips
  // on thrown Errors whose message matches — which is what we want.)
  window.addEventListener("error", (event) => {
    if (looksLikeChunkError(event.message)) triggerReloadOnce();
  });
};

// Exported for unit testing the matching logic without a live browser.
export const __test = { looksLikeChunkError, CHUNK_ERROR_PATTERNS, RELOAD_COOLDOWN_MS };
