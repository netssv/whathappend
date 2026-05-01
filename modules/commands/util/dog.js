/**
 * @module modules/commands/util/dog.js
 * @description ASCII dog animation with a human touch reminder.
 */

import { ANSI } from "../../formatter.js";
import { term, writePrompt } from "../../terminal/terminal-ui.js";

let _intervalId = null;

const DOG_RUN_R_1 = [
    `  __      _  `,
    `o'')}____// `,
    ` \`_/      ) `,
    ` (_(_/-(_/   `
];
const DOG_RUN_R_2 = [
    `  __      _  `,
    `o'')}____// `,
    ` \`_/      ) `,
    `  / /---/ /  `
];

const DOG_RUN_L_1 = [
    `  _      __  `,
    ` \\\\____{('o `,
    ` (      \\_\` `,
    `  \\_)-)_)_)  `
];
const DOG_RUN_L_2 = [
    `  _      __  `,
    ` \\\\____{('o `,
    ` (      \\_\` `,
    `  \\ \\---\\ \\  `
];

export function cmdDog() {
    return {
        __watch: true,
        watcher: {
            intervalId: null,
            start: function(term, doneCallback) {
                term.write('\x1b[2J\x1b[H'); // Clear terminal completely
                let step = 0;
                
                const draw = () => {
                    const cols = term.cols || 80;
                    term.write('\x1b[H'); // cursor to top
                    
                    let maxPos = cols - 20;
                    if (maxPos < 10) maxPos = 10;
                    
                    // Dog 1 positioning
                    let p1 = (step * 2) % (maxPos * 2);
                    let dir1 = p1 < maxPos ? 1 : -1;
                    let position1 = p1 < maxPos ? p1 : (maxPos * 2) - p1;
                    
                    // Dog 2 positioning
                    let p2 = ((step * 3) + 15) % (maxPos * 2);
                    let dir2 = p2 < maxPos ? 1 : -1;
                    let position2 = p2 < maxPos ? p2 : (maxPos * 2) - p2;

                    const frameR = step % 2 === 0 ? DOG_RUN_R_1 : DOG_RUN_R_2;
                    const frameL = step % 2 === 0 ? DOG_RUN_L_1 : DOG_RUN_L_2;
                    
                    const d1_frame = dir1 === 1 ? frameR : frameL;
                    const d2_frame = dir2 === 1 ? frameR : frameL;
                    
                    let out = `\n\n\n`;
                    out += `    ${ANSI.bold}${ANSI.cyan}Woof woof! (Press Ctrl+C to stop)${ANSI.reset}\n\n\n`;
                    
                    for (let i = 0; i < 4; i++) {
                        let canvas = " ".repeat(cols + 50); 
                        let d1 = d1_frame[i];
                        let d2 = d2_frame[i];
                        
                        // Draw dog 1
                        canvas = canvas.substring(0, position1) + d1 + canvas.substring(position1 + d1.length);
                        
                        // Draw dog 2 (overwrites if overlapping)
                        let before = canvas.substring(0, position2);
                        let after = canvas.substring(position2 + d2.length);
                        canvas = before + d2 + after;
                        
                        out += `${ANSI.yellow}${canvas.substring(0, cols)}${ANSI.reset}\n`;
                    }
                    
                    out += `\n\n    ${ANSI.dim}Human reminder: Have you played with your pet today?${ANSI.reset}\n`;
                    out += `    ${ANSI.dim}Take a walk, stretch your legs, and get some fresh air.${ANSI.reset}\n`;
                    
                    term.write(out);
                    step++;
                };

                draw();
                this.intervalId = setInterval(draw, 150);
            },
            stop: function() {
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                term.write(`\n\n  ${ANSI.dim}[Dog animation stopped. Time to work!]${ANSI.reset}\n`);
            }
        }
    };
}
