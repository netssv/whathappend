/**
 * @module modules/terminal/header/menu-keyboard.js
 * @description Provides keyboard navigation (arrows, escape, enter) for the logo menu.
 */

export function initMenuKeyboard(menu, logo) {
    document.addEventListener("keydown", (e) => {
        if (!menu.classList.contains("open")) return;
        
        if (e.key === "Escape") {
            e.preventDefault();
            menu.classList.remove("open");
            logo.classList.remove("menu-active");
            return;
        }

        const activeEl = document.activeElement;
        
        if (e.key === "ArrowRight") {
            // Open submenu if on a .logo-menu-has-sub
            if (activeEl?.classList.contains("logo-menu-has-sub")) {
                e.preventDefault();
                // We just trigger click to expand/open it (for inline mode)
                // For flyout mode, it's hover-based, but we can fake it by adding a class, 
                // but actually inline mode handles click. Let's just click it.
                activeEl.click();
                
                // Focus the first item inside its submenu after a brief delay
                setTimeout(() => {
                    const subMenu = activeEl.closest(".logo-menu-sub-wrap")?.querySelector(".logo-menu-submenu");
                    if (subMenu) {
                        const firstItem = subMenu.querySelector(".logo-menu-item");
                        if (firstItem) firstItem.focus();
                    }
                }, 50);
            }
            return;
        }

        if (e.key === "ArrowLeft") {
            // Close submenu if inside one
            const subMenu = activeEl?.closest(".logo-menu-submenu");
            if (subMenu) {
                e.preventDefault();
                const parentWrap = subMenu.closest(".logo-menu-sub-wrap");
                if (parentWrap) {
                    const parentBtn = parentWrap.querySelector(".logo-menu-has-sub");
                    if (parentBtn) {
                        parentBtn.focus();
                        if (menu.classList.contains("submenu-inline")) {
                            parentWrap.classList.remove("sub-expanded");
                        }
                    }
                }
            }
            return;
        }

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const items = Array.from(menu.querySelectorAll(".logo-menu-item")).filter(el => {
                if (!el.offsetParent) return false;
                const submenu = el.closest(".logo-menu-submenu");
                if (submenu) {
                    if (menu.classList.contains("submenu-inline")) {
                        const wrap = submenu.closest(".logo-menu-sub-wrap");
                        if (!wrap || !wrap.classList.contains("sub-expanded")) return false;
                    } else {
                        const style = window.getComputedStyle(submenu);
                        if (style.opacity === "0" || style.visibility === "hidden") return false;
                    }
                }
                return true;
            });
            if (items.length === 0) return;
            const index = items.indexOf(activeEl);
            let nextIndex = 0;
            if (e.key === "ArrowDown") {
                nextIndex = index < 0 ? 0 : (index + 1) % items.length;
            } else {
                nextIndex = index <= 0 ? items.length - 1 : index - 1;
            }
            items[nextIndex].focus();
        }
    });
}
