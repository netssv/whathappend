/**
 * @module modules/commands/util/hack-engine.js
 * @description Core game engine and level picker for the Hacker Trivia game.
 */

import { ANSI } from "../../formatter.js";
import { TRIVIA_LEVELS } from "../../data/trivia-data.js";
import { GameTimer } from "./hack-timer.js";
import { renderHeader, renderQuestion, renderFeedback, renderEndScreen } from "./hack-ui.js";

const QUESTIONS_PER_ROUND = 10;

// ═══════════════════════════════════════════════════════════════════
// Level Picker — Interactive difficulty selection screen
// ═══════════════════════════════════════════════════════════════════

export function buildLevelPicker(initialTimerSeconds) {
    let timerSeconds = initialTimerSeconds;
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            start: function(term, doneCallback) {
                const drawPicker = () => {
                    term.write('\x1b[2J\x1b[H');
                    let out = `\n ${ANSI.bold}${ANSI.cyan}HACKER TRIVIA${ANSI.reset}\n\n`;

                    out += `  ${ANSI.bold}${ANSI.green}[1]${ANSI.reset} 🟢 JUNIOR\n`;
                    out += `  ${ANSI.bold}${ANSI.yellow}[2]${ANSI.reset} 🟡 MID\n`;
                    out += `  ${ANSI.bold}${ANSI.red}[3]${ANSI.reset} 🔴 SENIOR\n`;
                    out += `  ${ANSI.bold}${ANSI.magenta}[4]${ANSI.reset} 🎲 RANDOM\n\n`;

                    const tStat = timerSeconds === 0 ? `${ANSI.dim}OFF${ANSI.reset}` : `${ANSI.green}${timerSeconds}s${ANSI.reset}`;
                    out += `  ${ANSI.bold}${ANSI.cyan}[T]${ANSI.reset} Timer: ${tStat}\n\n`;

                    out += ` ${ANSI.dim}Press 1-4 to start. (Q quit)${ANSI.reset}\n`;
                    term.write(out);
                };

                this.onDataDisposable = term.onData(e => {
                    e = e.toLowerCase();
                    if (e === 'q' || e === '\x03') {
                        doneCallback();
                        return;
                    }
                    if (e === 't') {
                        // Cycle timer settings
                        if (timerSeconds === 0) timerSeconds = 10;
                        else if (timerSeconds === 10) timerSeconds = 15;
                        else if (timerSeconds === 15) timerSeconds = 30;
                        else timerSeconds = 0;
                        drawPicker();
                        return;
                    }
                    const levelMap = { '1': 'junior', '2': 'mid', '3': 'senior', '4': 'random' };
                    if (levelMap[e]) {
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                        
                        const gameWatcher = buildTriviaWatcher(levelMap[e], timerSeconds);
                        gameWatcher.watcher.start(term, doneCallback);
                        this._activeGame = gameWatcher.watcher;
                    }
                });

                drawPicker();
            },
            stop: function(term) {
                if (this._activeGame) {
                    this._activeGame.stop(term);
                    this._activeGame = null;
                }
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
                if (term) term.write(`\n\n ${ANSI.dim}[Trivia session ended]${ANSI.reset}\n`);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════
// Trivia Game — Core quiz engine for a specific difficulty level
// ═══════════════════════════════════════════════════════════════════

export function buildTriviaWatcher(levelKey, timerSeconds) {
    const level = TRIVIA_LEVELS[levelKey];

    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            timer: null,
            start: function(term, doneCallback) {
                let pool = [...level.questions].sort(() => 0.5 - Math.random());
                let questions = pool.slice(0, Math.min(QUESTIONS_PER_ROUND, pool.length));
                let totalQ = questions.length;
                let currentQ = 0;
                let score = 0;
                let state = 'question'; // 'question' | 'feedback' | 'end'
                let lastCorrect = false;

                const draw = () => {
                    term.write('\x1b[2J\x1b[H');
                    let out = renderHeader(level, currentQ, totalQ, score, timerSeconds, this.timer ? this.timer.timeLeft : timerSeconds, state);

                    if (state === 'end') {
                        out += renderEndScreen(score, totalQ, level);
                    } else if (state === 'question') {
                        out += renderQuestion(questions[currentQ]);
                    } else if (state === 'feedback') {
                        out += renderFeedback(questions[currentQ], lastCorrect, this.timer ? this.timer.timeoutOccurred : false, currentQ, totalQ);
                    }

                    term.write(out);
                };

                if (timerSeconds > 0) {
                    this.timer = new GameTimer(
                        timerSeconds, 
                        () => draw(), 
                        () => {
                            lastCorrect = false;
                            state = 'feedback';
                            draw();
                        }
                    );
                }

                const restartGame = () => {
                    currentQ = 0;
                    score = 0;
                    state = 'question';
                    pool = [...level.questions].sort(() => 0.5 - Math.random());
                    questions = pool.slice(0, Math.min(QUESTIONS_PER_ROUND, pool.length));
                    draw();
                    if (this.timer) this.timer.start();
                };

                this.onDataDisposable = term.onData(e => {
                    e = e.toLowerCase();

                    if (e === 'q' || e === '\x03') {
                        doneCallback();
                        return;
                    }

                    if (state === 'end') {
                        if (e === '\r' || e === 'q' || e === '\n') {
                            doneCallback();
                        } else if (e === 'r') {
                            restartGame();
                        }
                        return;
                    }

                    if (state === 'feedback') {
                        currentQ++;
                        if (currentQ >= totalQ) {
                            state = 'end';
                        } else {
                            state = 'question';
                            if (this.timer) this.timer.start();
                        }
                        draw();
                        return;
                    }

                    if (state === 'question') {
                        const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                        if (map[e] !== undefined) {
                            if (this.timer) this.timer.stop();
                            lastCorrect = (map[e] === questions[currentQ].ans);
                            if (lastCorrect) score++;
                            state = 'feedback';
                            draw();
                        }
                    }
                });

                draw();
                if (state === 'question' && this.timer) {
                    this.timer.start();
                }
            },
            stop: function(term) {
                if (this.timer) {
                    this.timer.stop();
                }
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
                if (term) term.write(`\n\n ${ANSI.dim}[Trivia session ended]${ANSI.reset}\n`);
            }
        }
    };
}
