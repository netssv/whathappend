/**
 * @module modules/commands/util/tabs-list.js
 * @description Renders the grouped tab list output for `tabs list`.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', icon/truncate from './tabs-utils.js'
 * - Exports: tabList
 * - Layer: Command Layer (Util) — pure UI renderer, no state mutations.
 */

import { ANSI } from "../../formatter.js";
import { icon, truncate } from "./tabs-utils.js";
import { buildIndexMap } from "./tabs-resolver.js";

/**
 * Queries all tabs, builds the index map, and returns a formatted grouped list.
 * @returns {Promise<string>}
 */
export async function tabList() {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => {
            if (!tabs?.length) {
                resolve(`${ANSI.red}[ERROR] No tabs found.${ANSI.reset}`);
                return;
            }

            // Rebuild index map and group tabs by hostname
            buildIndexMap();
            const groups = new Map();
            let idx = 1;

            for (const tab of tabs) {
                tab._idx = idx++;
                let host = "";
                try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                if (!groups.has(host)) groups.set(host, []);
                groups.get(host).push(tab);
            }

            let o = `\n${ANSI.cyan}${ANSI.bold}  Tabs${ANSI.reset} ${ANSI.dim}${tabs.length} open · ${groups.size} sites${ANSI.reset}\n`;

            for (const [host, hostTabs] of groups) {
                const count = hostTabs.length > 1 ? ` ${ANSI.dim}(${hostTabs.length})${ANSI.reset}` : "";
                o += `\n  ${ANSI.cyan}${host}${ANSI.reset}${count}\n`;

                for (const tab of hostTabs) {
                    const num = `${ANSI.dim}${String(tab._idx).padStart(2)}${ANSI.reset}`;
                    o += `  ${num} ${icon(tab)} ${truncate(tab.title, 28)}\n`;
                }
            }

            o += `\n${ANSI.dim}  ${ANSI.green}●${ANSI.dim}active ${ANSI.reset}${ANSI.dim}Z${ANSI.dim}idle ${ANSI.yellow}z${ANSI.dim}sleep ${ANSI.green}♪${ANSI.dim}audio ${ANSI.cyan}◌${ANSI.dim}loading${ANSI.reset}\n`;
            o += `${ANSI.dim}  close · info · diag · watch · block · sleep · focus${ANSI.reset}\n`;
            resolve(o);
        });
    });
}
