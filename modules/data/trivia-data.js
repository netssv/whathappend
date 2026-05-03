/**
 * @module modules/data/trivia-data.js
 * @description Barrel export for the modular trivia question bank.
 *              Questions are split by difficulty level for the 'hack' trivia command.
 * 
 * Levels:
 *   - Junior  (30 questions) — Fundamentals of DNS, HTTP, SEO, and Security.
 *   - Mid     (35 questions) — Intermediate protocols, email auth, headers, and tools.
 *   - Senior  (30 questions) — Advanced attacks, hardening, forensics, and deep recon.
 */

import { JUNIOR_QUESTIONS } from "./trivia/junior.js";
import { MID_QUESTIONS } from "./trivia/mid.js";
import { SENIOR_QUESTIONS } from "./trivia/senior.js";

export { JUNIOR_QUESTIONS, MID_QUESTIONS, SENIOR_QUESTIONS };

/** Legacy flat export — all questions combined (used by old callers if any) */
export const TRIVIA_QUESTIONS = [...JUNIOR_QUESTIONS, ...MID_QUESTIONS, ...SENIOR_QUESTIONS];

/** Map level names to question pools */
export const TRIVIA_LEVELS = {
    junior: { label: "JUNIOR", questions: JUNIOR_QUESTIONS, color: "\x1b[32m", icon: "🟢" },
    mid:    { label: "MID",    questions: MID_QUESTIONS,    color: "\x1b[33m", icon: "🟡" },
    senior: { label: "SENIOR", questions: SENIOR_QUESTIONS, color: "\x1b[31m", icon: "🔴" },
    random: { label: "RANDOM", questions: TRIVIA_QUESTIONS, color: "\x1b[35m", icon: "🎲" },
};
