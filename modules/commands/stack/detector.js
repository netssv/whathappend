/**
 * @module modules/commands/stack/detector.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - CMS_SIGNATURES, FRAMEWORK_SIGNATURES, SERVER_SIGNATURES from './signatures.js'
 * - Exports: detectTechnologies
 * - Layer: Command Layer (Stack) - Tech stack identification.
 */

import { CMS_SIGNATURES, FRAMEWORK_SIGNATURES, SERVER_SIGNATURES } from "./signatures.js";

export function detectTechnologies(html, headers) {
    const foundCMS = [];
    const foundFrameworks = [];
    const foundServers = [];
    const headersLower = {};
    for (const [k, v] of Object.entries(headers)) {
        headersLower[k.toLowerCase()] = (v || "").toLowerCase();
    }

    if (html) {
        for (const sig of CMS_SIGNATURES) {
            if (sig.patterns.some(p => html.includes(p.toLowerCase()))) foundCMS.push(sig);
        }
        for (const sig of FRAMEWORK_SIGNATURES) {
            if (sig.patterns.some(p => html.includes(p.toLowerCase()))) foundFrameworks.push(sig);
        }
    }

    for (const sig of SERVER_SIGNATURES) {
        let found = false;
        if (sig.headerKey && headersLower[sig.headerKey]) {
            if (sig.patterns.some(p => headersLower[sig.headerKey].includes(p))) found = true;
        }
        if (!found && sig.altHeaders) {
            for (const altH of sig.altHeaders) {
                const matchHeader = Object.keys(headersLower).find(k => k.startsWith(altH));
                if (matchHeader) {
                    if (sig.altPatterns) {
                        if (sig.altPatterns.some(p => headersLower[matchHeader].includes(p))) found = true;
                    } else found = true;
                }
            }
        }
        if (found) foundServers.push(sig);
    }
    
    return { foundCMS, foundFrameworks, foundServers, headersLower };
}
