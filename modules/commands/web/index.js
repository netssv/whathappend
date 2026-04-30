/**
 * @module modules/commands/web/index.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: cmdCurl, cmdOpenSSL, cmdWhois, cmdPing, cmdTrace, cmdRobots, cmdSec, cmdPixels, cmdWeb, cmdLoad, cmdRegistrar, cmdHosting, cmdHistory, cmdLinks, cmdWayback, cmdGreen, cmdCookies, cmdIsUp, cmdSpeed, cmdSpeedtest, cmdIP, cmdSecurityTxt, cmdVitals, cmdFlush, cmdSocials, cmdRank, cmdSeo, cmdOg, cmdAlt, cmdCsp, cmdWaf, cmdHsts, cmdMinify, cmdSchema, cmdDiff, cmdHeadersCheck
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

export { cmdCurl } from "./curl.js";
export { cmdOpenSSL } from "./openssl.js";
export { cmdWhois } from "./whois.js";
export { cmdPing } from "./ping.js";
export { cmdTrace } from "./trace.js";
export { cmdRobots } from "./robots.js";
export { cmdSec } from "./sec.js";
export { cmdPixels } from "./pixels.js";
export { cmdWeb } from "./web.js";
export { cmdLoad } from "./load.js";
export { cmdRegistrar } from "./registrar.js";
export { cmdHosting } from "./hosting.js";
export { cmdHistory } from "./history.js";
export { cmdLinks } from "./links.js";
export { cmdWayback } from "./wayback.js";
export { cmdGreen } from "./green.js";
export { cmdCookies } from "./cookies.js";
export { cmdIsUp } from "./isup.js";
export { cmdSpeed } from "./speed.js";
export { cmdSpeedtest } from "./speedtest.js";
export { cmdIP } from "./ip.js";
export { cmdSecurityTxt } from "./security-txt.js";
export { cmdVitals } from "./vitals.js";
export { cmdFlush } from "./flush.js";
export { cmdSocials } from "./socials.js";
export { cmdRank } from "./rank.js";
export { cmdSeo } from "./seo.js";
export { cmdOg } from "./og.js";
export { cmdAlt } from "./alt.js";
export { cmdCsp } from "./csp.js";
export { cmdWaf } from "./waf.js";
export { cmdHsts } from "./hsts.js";
export { cmdMinify } from "./minify.js";
export { cmdSchema } from "./schema.js";
export { cmdDiff } from "./diff.js";
export { cmdHeadersCheck } from "./headers-check.js";
