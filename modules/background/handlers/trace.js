import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { ensureProtocol } from "../../utils.js";
import { classifyFetchError } from "./http.js";

// ===================================================================
// Redirect Trace Handler — Follow HTTP Redirect Chain
// ===================================================================

export async function handleRedirectTrace({ url, abortId }) {
    const signal = createAbort(abortId || `trace-${getNextAbortSeq()}`, 15000);
    try {
        const hops = [];
        let currentUrl = ensureProtocol(url);

        let maxRedirects = 10;
        while (maxRedirects-- > 0) {
            if (signal.aborted) return { error: "Command cancelled." };
            try {
                const resp = await fetch(currentUrl, { method: "HEAD", redirect: "manual", signal });
                const location = resp.headers.get("location");
                hops.push({
                    url: currentUrl,
                    status: resp.status,
                    statusText: resp.statusText,
                    location: location,
                });

                if (resp.status >= 300 && resp.status < 400 && location) {
                    currentUrl = new URL(location, currentUrl).href;
                } else {
                    break;
                }
            } catch (err) {
                if (err.name === "AbortError") return { error: "Command cancelled." };
                const classified = await classifyFetchError(err, currentUrl);
                hops.push({ url: currentUrl, error: classified.error });
                break;
            }
        }

        completeAbort(abortId);
        return { success: true, data: { hops } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `Redirect trace failed: ${err.message}` };
    }
}
