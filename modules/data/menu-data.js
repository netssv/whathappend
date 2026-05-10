/**
 * @module modules/data/menu-data.js
 * @description Static definitions for the interactive Platform Navigator menu.
 */

import { HELP_SECTIONS } from "./help-data.js";

export const CATEGORIES = HELP_SECTIONS.map(section => {
    let name = section.title;
    let desc = "";
    
    switch (section.title) {
        case "AUDIT SUITE": 
            name = "🌐 " + name; 
            desc = "Deep scans and comprehensive core checks."; 
            break;
        case "SECURITY": 
            name = "🛡️ " + name; 
            desc = "WAF, headers, CSP, and footprinting."; 
            break;
        case "DNS": 
            name = "📡 " + name; 
            desc = "Domain Name System resolution and routing."; 
            break;
        case "EMAIL": 
            name = "✉️ " + name; 
            desc = "Mail server configuration and deliverability."; 
            break;
        case "WEB CORE": 
            name = "⚡ " + name; 
            desc = "HTTP, SSL, robots, and foundational web telemetry."; 
            break;
        case "PERF & UI": 
            name = "🎨 " + name; 
            desc = "Performance, Web Vitals, and typography."; 
            break;
        case "NETWORK": 
            name = "🔌 " + name; 
            desc = "Infrastructure routing and connectivity."; 
            break;
        case "EXTERNAL": 
            name = "🔗 " + name; 
            desc = "External third-party analysis tools."; 
            break;
        case "SESSION & TABS": 
            name = "🗂️ " + name; 
            desc = "Manage targets, sessions, and active tabs."; 
            break;
        case "BROWSER": 
            name = "🌍 " + name; 
            desc = "Browser environment spoofing and network throttling."; 
            break;
        case "SYSTEM": 
            name = "💻 " + name; 
            desc = "Internal settings, utilities, and fun commands."; 
            break;
        default:
            name = "🔹 " + name;
            desc = "General commands and utilities.";
    }
    
    return {
        name,
        desc,
        commands: section.cmds.map(cmdArray => ({
            cmd: cmdArray[0],
            desc: cmdArray[1],
            aliases: cmdArray[2] || ""
        }))
    };
});
