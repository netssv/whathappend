/**
 * @module modules/data/menu-data.js
 * @description Static definitions for the interactive Platform Navigator menu.
 */

import { HELP_SECTIONS } from "./help-data.js";

export const CATEGORIES = HELP_SECTIONS.map(section => {
    let name = section.title;
    let desc = "";
    
    switch (section.title) {
        case "AUDIT TOOLS": 
            name = "🌐 " + name; 
            desc = "Deep scans and comprehensive core checks."; 
            break;
        case "DNS": 
            name = "📡 " + name; 
            desc = "Domain Name System resolution and routing."; 
            break;
        case "EMAIL": 
            name = "✉️ " + name; 
            desc = "Mail server configuration and deliverability."; 
            break;
        case "WEB TOOLS": 
            name = "⚡ " + name; 
            desc = "Performance, HTTP, SSL, and web telemetry."; 
            break;
        case "NETWORK": 
            name = "🔌 " + name; 
            desc = "Infrastructure routing and connectivity."; 
            break;
        case "EXTERNAL": 
            name = "🔗 " + name; 
            desc = "External third-party analysis tools."; 
            break;
        case "UTIL": 
            name = "💻 " + name; 
            desc = "System utilities and environment control."; 
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
