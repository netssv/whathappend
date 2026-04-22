import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  pixels — Ad & Tracking Pixel Detection
// ===================================================================

export const PIXEL_SIGNATURES = [
    // Meta / Facebook
    { id: "facebook-pixel",   name: "Meta Pixel (Facebook)",   patterns: ["fbq(", "window.fbq", "facebook.com/tr", "connect.facebook.net/en_US/fbevents"] },
    // Google
    { id: "google-analytics", name: "Google Analytics (GA4)",   patterns: ["gtag(", "dataLayer", "googletagmanager.com/gtag", "google-analytics.com/analytics", "google-analytics.com/ga.js"] },
    { id: "google-gtm",       name: "Google Tag Manager",       patterns: ["googletagmanager.com/gtm.js", "GTM-", "dataLayer"] },
    { id: "google-ads",       name: "Google Ads Conversion",    patterns: ["googleadservices.com/pagead", "gtag('event','conversion'", "google_conversion_id"] },
    { id: "google-adsense",   name: "Google AdSense",           patterns: ["pagead2.googlesyndication.com", "adsbygoogle"] },
    // LinkedIn
    { id: "linkedin-insight",  name: "LinkedIn Insight Tag",     patterns: ["snap.licdn.com/li.lms-analytics", "linkedin.com/px", "_linkedin_partner_id"] },
    // TikTok
    { id: "tiktok-pixel",     name: "TikTok Pixel",             patterns: ["analytics.tiktok.com", "ttq.load"] },
    // Pinterest
    { id: "pinterest-tag",    name: "Pinterest Tag",             patterns: ["pintrk(", "s.pinimg.com/ct/core.js", "pinterest.com/ct/"] },
    // Twitter/X
    { id: "twitter-pixel",    name: "X (Twitter) Pixel",         patterns: ["static.ads-twitter.com/uwt.js", "twq(", "t.co/i/adsct"] },
    // Snapchat
    { id: "snapchat-pixel",   name: "Snapchat Pixel",            patterns: ["sc-static.net/scevent.min.js", "snaptr("] },
    // Microsoft/Bing
    { id: "bing-uet",         name: "Microsoft UET (Bing Ads)",  patterns: ["bat.bing.com/bat.js", "uetq"] },
    // HubSpot
    { id: "hubspot",          name: "HubSpot Analytics",         patterns: ["js.hs-scripts.com", "js.hs-analytics.net", "hs-analytics"] },
    // Hotjar
    { id: "hotjar",           name: "Hotjar",                    patterns: ["static.hotjar.com", "hj(", "hjSiteSettings"] },
    // Clarity
    { id: "clarity",          name: "Microsoft Clarity",         patterns: ["clarity.ms/tag", "clarity("] },
    // Segment
    { id: "segment",          name: "Segment",                   patterns: ["cdn.segment.com/analytics.js", "analytics.identify"] },
    // Intercom
    { id: "intercom",         name: "Intercom",                  patterns: ["widget.intercom.io", "Intercom(", "intercomSettings"] },
    // Drift
    { id: "drift",            name: "Drift Chat",                patterns: ["js.driftt.com", "drift.load"] },
    // Shopify
    { id: "shopify-analytics",name: "Shopify Analytics",         patterns: ["cdn.shopify.com/s/trekkie", "ShopifyAnalytics", "monorail-edge.shopifysvc.com"] },
    // Cloudflare
    { id: "cf-analytics",     name: "Cloudflare Web Analytics",  patterns: ["static.cloudflareinsights.com/beacon", "cloudflareinsights"] },
    // Mixpanel
    { id: "mixpanel",         name: "Mixpanel",                  patterns: ["cdn.mxpnl.com", "mixpanel.init"] },
    // Amplitude
    { id: "amplitude",        name: "Amplitude",                 patterns: ["cdn.amplitude.com", "amplitude.getInstance"] },
];

export async function cmdPixels(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("pixels", "<domain>");

    let o = `> pixels ${domain}\n`;
    
    let html = "";
    let fetchMethod = "";

    try {
        o += `${ANSI.dim}Waiting 2s for scripts to load...${ANSI.reset}\n`;
        await new Promise(r => setTimeout(r, 2000));
        
        let livePixels = [];
        try {
            const [domResp, liveResp] = await Promise.all([
                chrome.runtime.sendMessage({ command: "get-page-html" }),
                chrome.runtime.sendMessage({ command: "detect-live-pixels" })
            ]);
            
            if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
                html = domResp.data.html.toLowerCase();
                fetchMethod = "Live DOM scan (active tab)";
                o += `${ANSI.dim}Scanning Live Rendered DOM for tracking pixels & scripts...${ANSI.reset}\n\n`;
            }
            if (liveResp?.success && liveResp.data) {
                livePixels = liveResp.data;
            }
        } catch (_) {}

        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.", `https://builtwith.com/${encodeURIComponent(domain)}`);
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            html = html.toLowerCase();
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for tracking pixels & scripts...${ANSI.reset}\n\n`;
        }
        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        const found = [];
        for (const sig of PIXEL_SIGNATURES) {
            const match = sig.patterns.some(p => html.includes(p.toLowerCase()));
            const isLive = livePixels.includes(sig.id);
            if (match || isLive) found.push({ ...sig, isLiveOnly: isLive && !match });
        }

        if (found.length > 0) {
            o += `${ANSI.white}${ANSI.bold}  DETECTED (${found.length})${ANSI.reset}\n`;
            for (const sig of found) {
                const badge = sig.isLiveOnly ? ` ${ANSI.yellow}[LIVE]${ANSI.reset}` : "";
                o += `  ${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${sig.name}${ANSI.reset}${badge}\n`;
            }
        } else {
            o += `${ANSI.dim}  No tracking pixels detected in ${fetchMethod.toLowerCase()}.${ANSI.reset}\n`;
        }

        const isStatic = fetchMethod === "Static HTML source scan";
        const isSPA = isStatic && (html.includes('id="__next"') || html.includes('id="root"') || html.includes('__react') || html.includes('nuxt-'));
        const isBlocked = isStatic && (html.includes('cloudflare-nginx') || html.includes('enable cookies') || html.includes('security check'));

        o += `\n${ANSI.dim}Executed: ${fetchMethod} (${PIXEL_SIGNATURES.length} signatures)${ANSI.reset}`;

        const ins = [];
        if (found.length === 0) {
            if (isSPA) ins.push({level:"WARN",text:"Site is a Single Page App (React/Vue). Trackers load via JS."});
            else if (isBlocked) ins.push({level:"WARN",text:"Fetch blocked by WAF (Cloudflare, etc). Static scan failed."});
            else ins.push({level:"INFO",text:"No client-side trackers found. Could use server-side tracking."});
        } else {
            ins.push({level:"INFO",text:`${found.length} tracker(s) detected.`});
            if (found.some(s => s.isLiveOnly)) ins.push({level:"INFO", text:"Dynamic Pixel injection detected (GTM/Async)."});
        }

        // Category insights
        const hasMeta = found.some(s => s.id === "facebook-pixel");
        const hasGA = found.some(s => s.id === "google-analytics");
        const hasGTM = found.some(s => s.id === "google-gtm");
        const hasAds = found.some(s => s.id.includes("google-ads"));

        if (hasMeta) ins.push({level:"INFO",text:"Meta Pixel active — Facebook/Instagram retargeting enabled."});
        if (hasGA) ins.push({level:"PASS",text:"Google Analytics active — traffic monitoring in place."});
        if (hasGTM) ins.push({level:"PASS",text:"GTM found — centralized tag management."});
        if (hasAds) ins.push({level:"INFO",text:"Google Ads conversion tracking active."});
        if (found.length > 5) ins.push({level:"WARN",text:"High tracker count may impact page load speed."});
        if (found.length > 0 && !found.some(s => s.id === "google-gtm")) {
            ins.push({level:"INFO",text:"Consider Google Tag Manager to consolidate tags."});
        }
        
        ins.push({level:"INFO",text:`Test Trackers: https://builtwith.com/${encodeURIComponent(domain)}`});

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("FETCH_FAILURE", err.message, "The page may block external requests.");
    }
}
