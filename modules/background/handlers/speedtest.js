// Speedtest Handler — Measures local download bandwidth using Cloudflare's speed API
import { createAbort, getNextAbortSeq } from "../abort.js";

const SPEEDTEST_TIMEOUT = 15000; // 15 seconds

export async function handleSpeedtest({ abortId, mb = 10 } = {}) {
    // Increase timeout proportionally for larger files (base 15s + 1s per MB)
    const timeoutMs = SPEEDTEST_TIMEOUT + (mb * 1000);
    const signal = createAbort(abortId || `speedtest-${getNextAbortSeq()}`, timeoutMs + 2000);

    try {
        const payloadSize = mb * 1024 * 1024;
        const url = `https://speed.cloudflare.com/__down?bytes=${payloadSize}`;

        const start = performance.now();
        const ctrl = new AbortController();
        const onAbort = () => ctrl.abort();
        signal.addEventListener("abort", onAbort);

        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                signal: ctrl.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const city = response.headers.get("city") || "Unknown";
            const country = response.headers.get("country") || "Unknown";
            const colo = response.headers.get("colo") || "Unknown";
            const ip = response.headers.get("cf-meta-ip") || "Unknown";

            const buffer = await response.arrayBuffer();
            const end = performance.now();
            clearTimeout(timer);

            const durationMs = Math.round(end - start);
            const durationSec = durationMs / 1000;

            const bits = buffer.byteLength * 8;
            const mbps = (bits / durationSec / 1000000).toFixed(2);

            return {
                success: true,
                data: {
                    mbps: parseFloat(mbps),
                    durationMs,
                    bytes: buffer.byteLength,
                    location: `${city}, ${country} (${colo})`,
                    ip
                }
            };
        } catch (err) {
            clearTimeout(timer);
            if (err.name === "AbortError") {
                return { error: `Speedtest timed out after ${Math.round(timeoutMs/1000)}s.` };
            }
            throw err;
        } finally {
            signal.removeEventListener("abort", onAbort);
        }

    } catch (err) {
        return { error: `Speedtest failed: ${err.message}` };
    }
}
