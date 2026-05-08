/**
 * @module modules/commands/util/hack-ui.js
 * @description UI renderers for the Hacker Trivia game, optimized for side panels.
 */

import { ANSI } from "../../formatter.js";

export function renderHeader(level, currentQ, totalQ, score, timerSeconds, timeLeft, state) {
    let out = `\n ${ANSI.bold}${ANSI.cyan}TRIVIA${ANSI.reset} | ${level.color}${level.icon} ${level.label}${ANSI.reset}\n`;
    out += ` ${ANSI.dim}Q ${currentQ + 1}/${totalQ} | Score: ${score}${ANSI.reset}\n`;

    if (timerSeconds > 0 && state === 'question') {
        const timeColor = timeLeft <= 5 ? ANSI.red : (timeLeft <= 10 ? ANSI.yellow : ANSI.green);
        out += `\n ${ANSI.bold}${timeColor}⏱  TIME: ${timeLeft}s${ANSI.reset}\n`;
    } else {
        out += `\n`;
    }
    return out;
}

export function renderQuestion(q) {
    let out = ` ${ANSI.bold}${q.q}${ANSI.reset}\n\n`;
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < q.opts.length; i++) {
        out += `  ${ANSI.bold}${ANSI.yellow}[${labels[i]}]${ANSI.reset} ${q.opts[i]}\n`;
    }
    out += `\n ${ANSI.dim}A/B/C/D answer | Q quit${ANSI.reset}\n`;
    return out;
}

export function renderFeedback(q, isCorrect, timeoutOccurred, currentQ, totalQ) {
    let out = ` ${ANSI.bold}${q.q}${ANSI.reset}\n\n`;

    if (timeoutOccurred) {
        out += ` ${ANSI.bold}${ANSI.red}>> TIME'S UP!${ANSI.reset}\n`;
    } else if (isCorrect) {
        out += ` ${ANSI.bold}${ANSI.green}>> CORRECT!${ANSI.reset}\n`;
    } else {
        out += ` ${ANSI.bold}${ANSI.red}>> INCORRECT.${ANSI.reset}\n`;
    }

    if (!isCorrect || timeoutOccurred) {
        const labels = ['A', 'B', 'C', 'D'];
        out += ` ${ANSI.dim}Ans: [${labels[q.ans]}] ${q.opts[q.ans]}${ANSI.reset}\n`;
    }

    out += `\n ${ANSI.cyan}INFO:${ANSI.reset} ${q.exp}\n`;

    if (currentQ < totalQ - 1) {
        out += `\n ${ANSI.dim}Press ANY KEY to continue...${ANSI.reset}\n`;
    } else {
        out += `\n ${ANSI.dim}Press ANY KEY for results...${ANSI.reset}\n`;
    }
    return out;
}

export function renderEndScreen(score, total, level) {
    const pct = Math.round((score / total) * 100);
    let out = ` ${ANSI.bold}COMPLETE.${ANSI.reset}\n\n`;
    out += ` Lvl: ${level.color}${level.icon} ${level.label}${ANSI.reset}\n`;
    out += ` Score: ${ANSI.yellow}${score}/${total}${ANSI.reset} (${pct}%)\n\n`;

    if (pct === 100) {
        out += ` ${ANSI.green}Rank: ★ ELITE SYSADMIN${ANSI.reset}\n`;
    } else if (pct >= 80) {
        out += ` ${ANSI.green}Rank: SENIOR ENGINEER${ANSI.reset}\n`;
    } else if (pct >= 60) {
        out += ` ${ANSI.yellow}Rank: MID-LEVEL${ANSI.reset}\n`;
    } else if (pct >= 40) {
        out += ` ${ANSI.yellow}Rank: JUNIOR DEV${ANSI.reset}\n`;
    } else {
        out += ` ${ANSI.red}Rank: SCRIPT KIDDIE${ANSI.reset}\n`;
    }

    out += `\n ${ANSI.dim}'R' to replay | 'Q' to exit.${ANSI.reset}\n`;
    return out;
}
