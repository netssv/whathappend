/**
 * @module modules/commands/util/tabs-list.js
 * @description Renders the grouped tab list output for `tabs list`.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', icon/truncate from './tabs-utils.js'
 * - Exports: tabList
 * - Layer: Command Layer (Util) — pure UI renderer, no state mutations.
 */

import { ANSI, getSeparator } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { icon, truncate } from "./tabs-utils.js";
import { buildIndexMap } from "./tabs-resolver.js";

/**
 * Queries all tabs, builds the index map, and returns a formatted flat table list.
 * @returns {Promise<string>}
 */
export async function tabList() {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
            if (!tabs?.length) {
                resolve(`${ANSI.red}[ERROR] No tabs found.${ANSI.reset}`);
                return;
            }

            // Rebuild index map
            buildIndexMap();
            let idx = 1;
            
            const cols = getTermCols();
            // Calculate column widths
            const idW = 3;
            const statW = 2;
            const hostW = Math.min(25, Math.floor(cols * 0.3));
            const remainW = Math.max(10, cols - idW - statW - hostW - 9); // padding and spacing

            let o = `\n${ANSI.cyan}${ANSI.bold}  Tabs${ANSI.reset} ${ANSI.dim}${tabs.length} open${ANSI.reset}\n`;
            
            o += `  ${ANSI.dim}${"ID".padEnd(idW)} ${"S".padEnd(statW)} ${"Host".padEnd(hostW)} Title${ANSI.reset}\n`;
            o += `  ${getSeparator()}\n`;

            for (const tab of tabs) {
                tab._idx = idx++;
                let host = "";
                try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                
                // Truncate logic
                if (host.length > hostW - 2) host = host.substring(0, hostW - 4) + "..";
                const titleStr = truncate(tab.title || "Untitled", remainW);
                const num = String(tab._idx).padEnd(idW);
                const statIcon = icon(tab).padEnd(statW);
                
                o += `  ${ANSI.dim}${num}${ANSI.reset} ${statIcon} ${ANSI.cyan}${host.padEnd(hostW)}${ANSI.reset} ${ANSI.white}${titleStr}${ANSI.reset}\n`;
            }

            o += `\n${ANSI.dim}  ${ANSI.green}●${ANSI.dim}active ${ANSI.reset}${ANSI.dim}Z${ANSI.dim}idle ${ANSI.yellow}z${ANSI.dim}sleep ${ANSI.green}♪${ANSI.dim}audio ${ANSI.cyan}◌${ANSI.dim}loading${ANSI.reset}\n`;
            o += `${ANSI.dim}  close · info · diag · watch · block · sleep · focus${ANSI.reset}\n`;
            resolve(o);
        });
    });
}
