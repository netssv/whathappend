export const MENU_HTML = `
    <!-- Core Actions -->
    <button class="logo-menu-item" id="menu-start" title="Run a full baseline analysis on the active tab">
        <span>▶</span> Analyze Active Tab
    </button>
    <button class="logo-menu-item" data-cmd="stack" title="Discover what technologies the site is built with">
        <span>🔍</span> Detect Tech Stack
    </button>
    
    <div class="logo-menu-sep"></div>
    
    <!-- Emulation Tools -->
    <div class="logo-menu-group-label">Emulation</div>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>🔀</span> User Agent <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" data-cmd="ua 1"><span></span>Chrome · Win</button>
            <button class="logo-menu-item" data-cmd="ua 2"><span></span>Chrome · Mac</button>
            <button class="logo-menu-item" data-cmd="ua 3"><span></span>Firefox · Win</button>
            <button class="logo-menu-item" data-cmd="ua 5"><span></span>Safari · Mac</button>
            <button class="logo-menu-item" data-cmd="ua 6"><span></span>Edge · Win</button>
            <button class="logo-menu-item" data-cmd="ua 7"><span></span>Googlebot</button>
            <div class="logo-menu-sep"></div>
            <button class="logo-menu-item logo-menu-disable" data-cmd="ua reset"><span>✕</span>Reset</button>
        </div>
    </div>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>📱</span> Mobile <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" data-cmd="mobile 1"><span></span>iPhone Safari</button>
            <button class="logo-menu-item" data-cmd="mobile 2"><span></span>iPhone Chrome</button>
            <button class="logo-menu-item" data-cmd="mobile 3"><span></span>Galaxy Chrome</button>
            <button class="logo-menu-item" data-cmd="mobile 4"><span></span>Pixel Chrome</button>
            <button class="logo-menu-item" data-cmd="mobile 5"><span></span>iPad Safari</button>
            <div class="logo-menu-sep"></div>
            <button class="logo-menu-item logo-menu-disable" data-cmd="mobile reset"><span>✕</span>Reset</button>
        </div>
    </div>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>⏱</span> Network Throttle <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" data-cmd="throttle 5g"><span></span>5G / Fiber</button>
            <button class="logo-menu-item" data-cmd="throttle 4g"><span></span>4G LTE</button>
            <button class="logo-menu-item" data-cmd="throttle fast3g"><span></span>Fast 3G</button>
            <button class="logo-menu-item" data-cmd="throttle slow3g"><span></span>Slow 3G</button>
            <button class="logo-menu-item" data-cmd="throttle edge"><span></span>2G / EDGE</button>
            <button class="logo-menu-item" data-cmd="throttle offline"><span></span>Offline</button>
            <div class="logo-menu-sep"></div>
            <button class="logo-menu-item logo-menu-disable" data-cmd="throttle reset"><span>✕</span>Reset</button>
        </div>
    </div>
    <div class="logo-menu-sub-wrap" id="menu-geo-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>📍</span> Location <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu" id="menu-geo-sub">
            <button class="logo-menu-item" data-cmd="geo london"><span></span>London</button>
            <button class="logo-menu-item" data-cmd="geo nyc"><span></span>New York</button>
            <button class="logo-menu-item" data-cmd="geo tokyo"><span></span>Tokyo</button>
            <button class="logo-menu-item" data-cmd="geo mexico"><span></span>Mexico</button>
            <button class="logo-menu-item" data-cmd="geo brazil"><span></span>Brazil</button>
            <button class="logo-menu-item" data-cmd="geo india"><span></span>India</button>
            <button class="logo-menu-item" data-cmd="geo italy"><span></span>Italy</button>
            <button class="logo-menu-item" data-cmd="geo philippines"><span></span>Philippines</button>
            <div id="menu-geo-custom"></div>
            <div class="logo-menu-sep"></div>
            <button class="logo-menu-item" id="menu-geo-add" title="Save a custom location"><span>＋</span>Add Location</button>
            <button class="logo-menu-item logo-menu-disable" data-cmd="geo reset"><span>✕</span>Reset</button>
        </div>
    </div>

    <div class="logo-menu-sep"></div>

    <!-- Browser Tools -->
    <div class="logo-menu-group-label">Browser Tools</div>
    <div class="logo-menu-sub-wrap" id="menu-tabs-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>▤</span> Browser Tabs <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu" id="menu-tabs-sub">
            <span class="logo-menu-group-label">Loading…</span>
        </div>
    </div>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>🧹</span> Flush Cache <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" data-cmd="flush:tab"><span></span>Active Tab</button>
            <button class="logo-menu-item" data-cmd="flush:target"><span></span>Target Domain</button>
        </div>
    </div>
    <button class="logo-menu-item" id="menu-reload-tab" title="Reload the active tab">
        <span>↻</span> Reload Tab
    </button>

    <div class="logo-menu-sep"></div>

    <!-- Terminal Tools -->
    <div class="logo-menu-group-label">Terminal Tools</div>
    <button class="logo-menu-item" id="menu-clear" title="Clear terminal screen">
        <span>⌧</span> Clear Terminal
    </button>
    <button class="logo-menu-item" id="menu-clip" title="Copy session to clipboard as Markdown">
        <span>📋</span> Copy Session
    </button>
    <button class="logo-menu-item" id="menu-export" title="Export full report as JSON">
        <span>💾</span> Export Data
    </button>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>☕</span> Break Timer <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" data-cmd="coffee 5"><span></span>5 min · Micro</button>
            <button class="logo-menu-item" data-cmd="coffee 10"><span></span>10 min · Short</button>
            <button class="logo-menu-item" data-cmd="coffee 15"><span></span>15 min · Medium</button>
            <button class="logo-menu-item" data-cmd="coffee 25"><span></span>25 min · Pomodoro</button>
            <button class="logo-menu-item" data-cmd="coffee 45"><span></span>45 min · Deep Focus</button>
        </div>
    </div>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>🎨</span> Theme <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" id="menu-theme-WhOS" data-cmd="theme:WhOS"><span>●</span>WhOS</button>
            <button class="logo-menu-item" id="menu-theme-amber" data-cmd="theme:amber"><span>●</span>Classic Amber</button>
            <button class="logo-menu-item" id="menu-theme-matrix" data-cmd="theme:matrix"><span>●</span>Matrix</button>
            <button class="logo-menu-item" id="menu-theme-modern" data-cmd="theme:modern"><span>●</span>Modern UI</button>
        </div>
    </div>

    <div class="logo-menu-sep"></div>

    <!-- System & Settings -->
    <div class="logo-menu-group-label">System</div>
    <button class="logo-menu-item" data-cmd="info" title="System diagnostics and telemetry">
        <span>📊</span> App Diagnostics
    </button>
    <div class="logo-menu-sub-wrap">
        <button class="logo-menu-item logo-menu-has-sub">
            <span>⚙️</span> Header Settings <span class="logo-menu-sub-arrow">▸</span>
        </button>
        <div class="logo-menu-submenu">
            <button class="logo-menu-item" id="menu-toggle-header" title="Auto-hide the infrastructure triage badges">
                <span>◫</span> Auto-Hide Triage
            </button>
            <button class="logo-menu-item" id="menu-toggle-blocker" title="Auto-hide the content blocker panel">
                <span>🛡</span> Auto-Hide Blocker
            </button>
        </div>
    </div>
    <button class="logo-menu-item" id="menu-reload-ext" title="Reload this extension (Ctrl+Shift+,)">
        <span>⟳</span> Reboot Extension <span class="logo-menu-shortcut">Ctrl+⇧+,</span>
    </button>
    <button class="logo-menu-item" id="menu-about" title="About WhatHappened">
        <span>ℹ</span> About
    </button>

    <div class="logo-menu-sep"></div>
    <div class="logo-menu-group-label">Shortcuts: Ctrl+⇧+. Panel · Ctrl+⇧+, Reload</div>
`;
