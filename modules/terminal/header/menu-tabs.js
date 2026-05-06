/**
 * @module modules/terminal/header/menu-tabs.js
 * @description Handles dynamic population of the tabs submenu in the logo menu.
 */

export function initTabsSubmenu(menu) {
    const tabsWrap = document.getElementById("menu-tabs-wrap");
    const tabsSub  = document.getElementById("menu-tabs-sub");
    if (!tabsWrap || !tabsSub) return;

    tabsWrap.addEventListener("mouseenter", async () => {
        try {
            const tabs = await chrome.tabs.query({});
            tabsSub.innerHTML = "";

            if (tabs.length === 0) {
                tabsSub.innerHTML = `<span class="logo-menu-group-label">No tabs</span>`;
                return;
            }

            for (const tab of tabs) {
                let host = "";
                try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                let title = tab.title || host || "Untitled";
                if (title.length > 28) title = title.substring(0, 27) + "…";

                const btn = document.createElement("button");
                btn.className = "logo-menu-item";
                if (tab.active) btn.classList.add("active-theme");
                btn.dataset.cmd = `tab_menu:${tab.id}:${host}`;
                const icon = document.createElement("span");
                icon.textContent = tab.active ? "●" : " ";
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(title));
                btn.title = tab.url;
                tabsSub.appendChild(btn);
            }

            // Footer
            const sep = document.createElement("div");
            sep.className = "logo-menu-sep";
            tabsSub.appendChild(sep);

            const allBtn = document.createElement("button");
            allBtn.className = "logo-menu-item";
            allBtn.dataset.cmd = "tabs";
            const allIcon = document.createElement("span");
            allIcon.textContent = "⋯";
            allBtn.appendChild(allIcon);
            allBtn.appendChild(document.createTextNode("Full tab manager"));
            tabsSub.appendChild(allBtn);
        } catch {
            tabsSub.innerHTML = `<span class="logo-menu-group-label">Error loading tabs</span>`;
        }
    });
}
