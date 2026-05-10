export function showBootstrapError(err) {
    const termC = document.getElementById("terminal-container");
    if (termC) {
        termC.replaceChildren();

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "padding: 20px; font-family: monospace;";

        const h3 = document.createElement("h3");
        h3.style.cssText = "color:#ff3366;margin-top:0";
        h3.textContent = "⚠️ Terminal Core Failure";
        wrapper.appendChild(h3);

        const desc = document.createElement("p");
        desc.style.cssText = "color:#aaa;margin:0 0 8px";
        desc.textContent = "The terminal could not initialize. This is usually caused by a corrupt extension state or a failed module import.";
        wrapper.appendChild(desc);

        const pre = document.createElement("pre");
        pre.style.cssText = "color:#ff6b6b;background:#0f0f23;padding:12px;border-radius:6px;overflow:auto;max-height:120px;font-size:12px";
        pre.textContent = `${err?.message || "Unknown error"}\n${err?.stack || ""}`;
        wrapper.appendChild(pre);

        const fixTitle = document.createElement("p");
        fixTitle.style.cssText = "color:#888;margin:16px 0 8px";
        fixTitle.textContent = "Try one of these fixes:";
        wrapper.appendChild(fixTitle);

        const ol = document.createElement("ol");
        ol.style.cssText = "color:#ccc;padding-left:20px;line-height:1.8";
        const fixes = [
            "Close and reopen the Side Panel",
            "Go to chrome://extensions → click Reload on WhatHappened",
            "If the issue persists, clear extension storage via DevTools"
        ];
        for (const fix of fixes) {
            const li = document.createElement("li");
            li.textContent = fix;
            ol.appendChild(li);
        }
        wrapper.appendChild(ol);

        termC.appendChild(wrapper);
    }
}
