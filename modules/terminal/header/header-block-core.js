import { refitTerminal } from "../terminal-ui.js";

export const SETTINGS = [
    { id: "block-js",      api: "javascript", type: "contentSettings" },
    { id: "block-images",  api: "images",     type: "contentSettings" },
    { id: "block-cookies", api: "cookies",    type: "contentSettings" },
    { id: "block-css",     api: "css",        type: "dnr", ruleId: 1001, resourceTypes: ["stylesheet"] },
    { id: "block-fonts",   api: "fonts",      type: "dnr", ruleId: 1002, resourceTypes: ["font"] },
    { id: "block-popups",  api: "popups",     type: "contentSettings" },
];

export function getPattern(url) {
    try { const u = new URL(url); return `${u.protocol}//${u.hostname}/*`; }
    catch { return null; }
}

export async function syncState(currentUrl) {
    const shieldBtn = document.getElementById("shield-btn");
    const reloadBtn = document.getElementById("block-reload");
    if (!currentUrl || !currentUrl.startsWith("http")) {
        shieldBtn?.classList.remove("active");
        reloadBtn?.classList.remove("show");
        return;
    }

    let blockedCount = 0;
    const activeApis = [];
    for (const s of SETTINGS) {
        const { id, api, type, ruleId } = s;
        const cb = document.getElementById(id);
        if (!cb) continue;

        try {
            if (type === "contentSettings") {
                const result = await chrome.contentSettings[api].get({ primaryUrl: currentUrl });
                const blocked = result.setting === "block";
                cb.checked = blocked;
                if (blocked) { blockedCount++; activeApis.push(api); }
            } else if (type === "dnr") {
                const rules = await chrome.declarativeNetRequest.getSessionRules();
                const hostname = new URL(currentUrl).hostname;
                const rule = rules.find(r => r.id === ruleId && r.condition.initiatorDomains?.includes(hostname));
                const blocked = !!rule;
                cb.checked = blocked;
                if (blocked) { blockedCount++; activeApis.push(api); }
            }
        } catch { cb.checked = false; }
    }

    if (shieldBtn) {
        shieldBtn.classList.toggle("active", blockedCount > 0);
        shieldBtn.title = blockedCount > 0 ? `Shield Active (${blockedCount} policies)` : "Shield (All Allowed)";
    }
    
    const status = document.getElementById("block-status");
    if (status && !status.classList.contains("saving")) {
        if (blockedCount > 0) {
            let elemCount = 0;
            try {
                const html = await fetch(currentUrl).then(r => r.text());
                if (activeApis.includes("images")) elemCount += (html.match(/<img|<picture/gi) || []).length;
                if (activeApis.includes("javascript")) elemCount += (html.match(/<script/gi) || []).length;
                if (activeApis.includes("css")) elemCount += (html.match(/<link[^>]+rel=["']stylesheet["']|<style/gi) || []).length;
                if (activeApis.includes("fonts")) elemCount += (html.match(/@font-face/gi) || []).length + 2;
                if (activeApis.includes("cookies")) elemCount += 5;
                if (activeApis.includes("popups")) elemCount += (html.match(/window\.open/gi) || []).length;
                
                if (elemCount > 0) elemCount = Math.floor(elemCount * 1.5);
                if (elemCount === 0) elemCount = blockedCount * 3;
            } catch {
                elemCount = blockedCount * 5;
            }

            status.innerHTML = `<span style="color:var(--accent-red, #ff6b6b); font-weight:bold">~${elemCount} Items Blocked</span>`;
        } else {
            status.innerHTML = `<span style="color:var(--accent-green, #a9dc76)">All Allowed</span>`;
        }
    }
}

export async function toggle(settingObj, checkbox, currentUrl) {
    const { api, type, ruleId, resourceTypes } = settingObj;
    const pattern = getPattern(currentUrl);
    if (!pattern) return;

    const hostname = new URL(currentUrl).hostname;
    const status = document.getElementById("block-status");
    const reloadBtn = document.getElementById("block-reload");

    try {
        if (status) { status.textContent = "Saving…"; status.classList.add("saving"); }

        if (type === "contentSettings") {
            const setting = checkbox.checked ? "block" : "allow";
            await chrome.contentSettings[api].set({ primaryPattern: pattern, setting });
        } else if (type === "dnr") {
            const rules = await chrome.declarativeNetRequest.getSessionRules();
            const existing = rules.find(r => r.id === ruleId);
            const domains = new Set(existing?.condition?.initiatorDomains || []);

            if (checkbox.checked) domains.add(hostname);
            else domains.delete(hostname);

            if (domains.size > 0) {
                await chrome.declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [ruleId],
                    addRules: [{
                        id: ruleId, priority: 1, action: { type: "block" },
                        condition: { resourceTypes: resourceTypes, initiatorDomains: Array.from(domains) }
                    }]
                });
            } else {
                await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
            }
        }

        if (status) { status.classList.remove("saving"); }
        reloadBtn?.classList.add("show");
    } catch {
        if (status) { status.textContent = "Error"; status.classList.remove("saving"); }
        checkbox.checked = !checkbox.checked;
    }

    await syncState(currentUrl);
}
