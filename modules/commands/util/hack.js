/**
 * @module modules/commands/util/hack.js
 * @description Technical trivia game covering DNS, SEO, and Web Security.
 */

import { ANSI } from "../../formatter.js";
import { TRIVIA_QUESTIONS } from "../../data/trivia-data.js";

export function cmdHack() {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            start: function(term, doneCallback) {
                term.write('\x1b[2J\x1b[H'); // Clear
                
                // Shuffle and pick 10
                let questions = [...TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10);
                let currentQ = 0;
                let score = 0;
                
                // States: 'question', 'feedback', 'end'
                let state = 'question'; 
                
                const draw = () => {
                    term.write('\x1b[2J\x1b[H'); // Clear
                    
                    let out = `\n  ${ANSI.bold}${ANSI.cyan}/// TERMINAL HACKER TRIVIA ///${ANSI.reset}\n`;
                    out += `  ${ANSI.dim}Question ${currentQ + 1} of 10  |  Score: ${score}${ANSI.reset}\n\n`;
                    
                    if (state === 'end') {
                        out += `  ${ANSI.bold}SIMULATION COMPLETE.${ANSI.reset}\n\n`;
                        out += `  Final Score: ${ANSI.yellow}${score} / 10${ANSI.reset}\n\n`;
                        
                        if (score === 10) out += `  ${ANSI.green}Rank: ELITE SYSADMIN. Flawless execution.${ANSI.reset}\n`;
                        else if (score >= 7) out += `  ${ANSI.green}Rank: SENIOR ENGINEER. Solid knowledge base.${ANSI.reset}\n`;
                        else if (score >= 4) out += `  ${ANSI.yellow}Rank: JUNIOR DEV. Keep studying the RFCs.${ANSI.reset}\n`;
                        else out += `  ${ANSI.red}Rank: SCRIPT KIDDIE. Access denied.${ANSI.reset}\n`;
                        
                        out += `\n  ${ANSI.dim}Press 'Q' or 'Enter' to exit.${ANSI.reset}\n`;
                        term.write(out);
                        return;
                    }
                    
                    const q = questions[currentQ];
                    
                    if (state === 'question') {
                        out += `  ${ANSI.bold}${q.q}${ANSI.reset}\n\n`;
                        
                        const labels = ['A', 'B', 'C', 'D'];
                        for (let i = 0; i < 4; i++) {
                            out += `    ${ANSI.bold}${ANSI.yellow}[${labels[i]}]${ANSI.reset} ${q.opts[i]}\n`;
                        }
                        
                        out += `\n  ${ANSI.dim}Press A, B, C, or D to answer. (Q to quit)${ANSI.reset}\n`;
                    } else if (state === 'feedback') {
                        out += `  ${ANSI.bold}${q.q}${ANSI.reset}\n\n`;
                        
                        if (this.lastCorrect) {
                            out += `  ${ANSI.bold}${ANSI.green}>> CORRECT!${ANSI.reset}\n`;
                        } else {
                            out += `  ${ANSI.bold}${ANSI.red}>> INCORRECT.${ANSI.reset}\n`;
                            const labels = ['A', 'B', 'C', 'D'];
                            out += `  ${ANSI.dim}The correct answer was: [${labels[q.ans]}] ${q.opts[q.ans]}${ANSI.reset}\n`;
                        }
                        
                        out += `\n  ${ANSI.cyan}EXPLANATION:${ANSI.reset} ${q.exp}\n`;
                        
                        if (currentQ < 9) {
                            out += `\n  ${ANSI.dim}Press ANY KEY for the next question...${ANSI.reset}\n`;
                        } else {
                            out += `\n  ${ANSI.dim}Press ANY KEY to see final results...${ANSI.reset}\n`;
                        }
                    }
                    
                    term.write(out);
                };
                
                this.onDataDisposable = term.onData(e => {
                    e = e.toLowerCase();
                    
                    if (e === 'q' || e === '\x03') { // q or Ctrl+C
                        doneCallback();
                        return;
                    }
                    
                    if (state === 'end') {
                        if (e === '\r' || e === 'q' || e === '\n') {
                            doneCallback();
                        }
                        return;
                    }
                    
                    if (state === 'feedback') {
                        currentQ++;
                        if (currentQ >= 10) {
                            state = 'end';
                        } else {
                            state = 'question';
                        }
                        draw();
                        return;
                    }
                    
                    if (state === 'question') {
                        const map = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                        if (map[e] !== undefined) {
                            const isCorrect = (map[e] === questions[currentQ].ans);
                            this.lastCorrect = isCorrect;
                            if (isCorrect) score++;
                            state = 'feedback';
                            draw();
                        }
                    }
                });
                
                draw();
            },
            stop: function(term) {
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
                if (term) term.write(`\n\n  ${ANSI.dim}[Trivia session ended]${ANSI.reset}\n`);
            }
        }
    };
}
