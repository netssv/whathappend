/**
 * Handles all network requests from the side panel terminal to avoid CORS
 * restrictions. Routes messages to the appropriate fetch handler and returns
 * raw response data.
 *
 * All requests use AbortController with timeouts to prevent hanging.
 * Supports abort-id for Ctrl+C cancellation from the terminal.
 *
 * Includes Active Tab Tracking for context-aware domain detection.
 */

import { setupTabTracker } from "./modules/background/tab-tracker.js";
import { setupRouter } from "./modules/background/router.js";

// ---------------------------------------------------------------------------
// Side Panel Registration
// ---------------------------------------------------------------------------

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

setupTabTracker();
setupRouter();
