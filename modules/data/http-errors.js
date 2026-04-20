/**
 * WhatHappened — HTTP Error Mapping (ITIL-Style)
 *
 * Lookup table for common HTTP/Server status codes with
 * actionable "HostPapa-level" support insights.
 * Used by curl, web, sec commands for rich error diagnostics.
 */

export const HTTP_ERROR_MAP = {
    // ── 4xx Client Errors ──
    400: {
        label: "Bad Request",
        insight: "Malformed request syntax. Check URL encoding, query parameters, or request body format.",
        level: "WARN",
    },
    401: {
        label: "Unauthorized",
        insight: "Authentication required. Check API keys, login credentials, or expired session tokens.",
        level: "WARN",
    },
    403: {
        label: "Forbidden",
        insight: "Permission issue or IP block. Check folder permissions (755/644), .htaccess rules, or ModSecurity/WAF logs.",
        level: "CRIT",
    },
    404: {
        label: "Not Found",
        insight: "Broken link or missing file. Check .htaccess rewrite rules, CMS permalinks, or recently deleted pages. External Triage: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404",
        level: "WARN",
    },
    405: {
        label: "Method Not Allowed",
        insight: "HTTP method not supported by this endpoint. Check if POST is expected instead of GET, or vice versa.",
        level: "WARN",
    },
    408: {
        label: "Request Timeout",
        insight: "Server took too long to receive the full request. Check backend performance or database query speed.",
        level: "WARN",
    },
    410: {
        label: "Gone",
        insight: "Resource permanently removed. Update or remove any links pointing to this URL. Good for SEO cleanup.",
        level: "INFO",
    },
    429: {
        label: "Too Many Requests",
        insight: "Rate limited. Reduce request frequency, implement backoff, or check API quota limits.",
        level: "WARN",
    },
    451: {
        label: "Unavailable For Legal Reasons",
        insight: "Content blocked due to legal order (DMCA, GDPR, government censorship).",
        level: "INFO",
    },

    // ── 5xx Server Errors ──
    500: {
        label: "Internal Server Error",
        insight: "Server-side crash. Check application error logs, PHP error_log, or framework stack trace. Common causes: syntax errors, memory limits, unhandled exceptions.",
        level: "CRIT",
    },
    502: {
        label: "Bad Gateway",
        insight: "Upstream server error. Reverse proxy (Nginx/Apache) couldn't reach the backend application (PHP-FPM, Node, Gunicorn). Check if the backend process is running.",
        level: "CRIT",
    },
    503: {
        label: "Service Unavailable",
        insight: "Server overload or maintenance mode. Check CPU/RAM limits, worker process count, or if a maintenance flag is active.",
        level: "CRIT",
    },
    504: {
        label: "Gateway Timeout",
        insight: "Backend timeout. Increase proxy_read_timeout (Nginx) or ProxyTimeout (Apache). May indicate slow database queries or external API calls.",
        level: "CRIT",
    },

    // ── Cloudflare-Specific (5xx) ──
    520: {
        label: "Unknown Error (Cloudflare)",
        insight: "Origin server returned something unexpected. Usually a PHP crash, 0-byte response, or resource limit hit on the hosting. Check origin server error logs. External Triage: https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/",
        level: "CRIT",
    },
    521: {
        label: "Web Server Down (Cloudflare)",
        insight: "Origin server refused the connection. Check if the web server process (Nginx/Apache/LiteSpeed) is running on the origin. External Triage: https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/",
        level: "CRIT",
    },
    522: {
        label: "Connection Timed Out (Cloudflare)",
        insight: "Cloudflare couldn't reach the origin server. Check firewall rules, origin IP whitelist in Cloudflare, or network routing issues.",
        level: "CRIT",
    },
    523: {
        label: "Origin Unreachable (Cloudflare)",
        insight: "DNS points to Cloudflare but origin is unreachable. Verify the origin IP address in Cloudflare dashboard DNS settings.",
        level: "CRIT",
    },
    524: {
        label: "Timeout Occurred (Cloudflare)",
        insight: "Origin responded but took >100 seconds. Optimize slow PHP scripts, database queries, or increase Cloudflare's timeout (Enterprise plan).",
        level: "CRIT",
    },
    525: {
        label: "SSL Handshake Failed (Cloudflare)",
        insight: "Cloudflare couldn't negotiate SSL with origin. Check that the origin SSL certificate is valid and matches the expected hostname.",
        level: "CRIT",
    },
    526: {
        label: "Invalid SSL Certificate (Cloudflare)",
        insight: "Origin SSL cert is invalid, expired, or self-signed. Install a valid certificate on the origin or set SSL mode to 'Flexible' in Cloudflare.",
        level: "CRIT",
    },
    530: {
        label: "Origin DNS Error (Cloudflare)",
        insight: "Cloudflare error 530 is usually paired with a 1xxx error. Check Cloudflare's error analytics for details.",
        level: "CRIT",
    },

    // ── Mail-Specific (used by email commands) ──
    550: {
        label: "Mailbox Unavailable",
        insight: "Recipient server rejected the mail. Likely causes: blacklisted sender IP, SPF/DMARC failure, non-existent mailbox, or full mailbox. External Triage: https://mxtoolbox.com/blacklists.aspx",
        level: "CRIT",
    },
    553: {
        label: "Mailbox Name Invalid",
        insight: "Email address syntax rejected by the receiving server. Check for typos or invalid characters in the address.",
        level: "WARN",
    },
};

/**
 * Get HTTP error insight for a given status code.
 * Returns null if no mapping exists.
 */
export function getHTTPErrorInsight(status) {
    return HTTP_ERROR_MAP[status] || null;
}
