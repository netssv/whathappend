/**
 * @module modules/background/handlers/spoof.js
 * @description IP Header Spoofing via declarativeNetRequest
 */
export async function handleSetIPSpoof({ ip }) {
    const RULE_IDS = [1001, 1002, 1003, 1004];
    
    // Always clear existing rules first
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULE_IDS
    });

    if (!ip) {
        return { ok: true, cleared: true };
    }

    const headers = [
        { header: "X-Forwarded-For", operation: "set", value: ip },
        { header: "Client-IP", operation: "set", value: ip },
        { header: "True-Client-IP", operation: "set", value: ip },
        { header: "X-Real-IP", operation: "set", value: ip }
    ];

    const rule = {
        id: RULE_IDS[0],
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: headers
        },
        condition: {
            urlFilter: "*",
            resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "ping", "script", "image", "stylesheet", "other"]
        }
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [rule]
    });

    return { ok: true, ip };
}
