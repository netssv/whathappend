/**
 * @module modules/commands/util/sudo.js
 * @description Joke command for sudo.
 */
import { ANSI } from "../../formatter.js";

export function cmdSudo() {
    return `\n  ${ANSI.red}${ANSI.bold}[SECURITY INCIDENT]${ANSI.reset} \n Administrative privileges denied.\n  ${ANSI.dim}This incident will be reported... just kidding, you're in a browser.${ANSI.reset}\n`;
}
