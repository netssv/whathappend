/**
 * @module modules/commands/util/games/core/signal-ui.js
 * @description OOP Rendering Engine for Signal Interception minigame.
 */

import { DM, RS, LOCK_NEED } from "./signal-game.js";

const TC  = "\x1b[38;2;0;230;180m";   // Teal
const PC  = "\x1b[38;2;255;200;50m";  // Yellow
const LC  = "\x1b[38;2;100;210;255m"; // Blue
const GN  = "\x1b[38;2;0;255;100m";   // Green
const RD  = "\x1b[38;2;255;80;80m";   // Red
const BDR = "\x1b[38;2;20;90;65m";    // Border

function wChar(n) {
    if (n >  0.65) return "^";
    if (n < -0.65) return "v";
    if (Math.abs(n) > 0.20) return "~";
    return "-";
}

export class SignalUI {
    constructor(term, game) {
        this.term = term;
        this.g = game;
        this.grid = [];
        this.colorGrid = [];
    }

    resetGrid() {
        for (let r = 0; r < this.g.rows; r++) {
            this.grid[r] = new Array(this.g.cols).fill(" ");
            this.colorGrid[r] = new Array(this.g.cols).fill("");
        }
    }

    put(r, c, ch, col = "") {
        if (r < 0 || r >= this.g.rows || c < 0 || c >= this.g.cols) return;
        this.grid[r][c] = ch;
        this.colorGrid[r][c] = col;
    }

    putStr(r, c, s, col = "") {
        for (let i = 0; i < s.length; i++) this.put(r, c + i, s[i], col);
    }

    drawWave(panelTop, amp, freq, color, isTarget) {
        const center = panelTop + Math.floor(this.g.panelH / 2);
        for (let c = this.g.fL; c <= this.g.fR; c++) this.put(center, c, "·", DM);

        for (let i = 0; i < this.g.fW; i++) {
            const c = this.g.fL + i;
            const noise = (isTarget && this.g.levelConfig.noise) ? (Math.random() * this.g.levelConfig.noise * 2 - this.g.levelConfig.noise) : 0;
            const y = amp * Math.sin(freq * i - this.g.phase) + noise;
            const row = Math.max(panelTop, Math.min(panelTop + this.g.panelH - 1, center - Math.round(y)));
            const norm = y / (amp || 1);
            this.put(row, c, wChar(norm), color);
        }
    }

    drawBox(top, h) {
        for (let c = this.g.fL; c <= this.g.fR; c++) {
            this.put(top, c, "─", BDR);
            this.put(top + h + 1, c, "─", BDR);
        }
        for (let r = top; r <= top + h + 1; r++) {
            this.put(r, this.g.fL, "│", BDR);
            this.put(r, this.g.fR, "│", BDR);
        }
        this.put(top, this.g.fL, "┌", BDR); this.put(top, this.g.fR, "┐", BDR);
        this.put(top + h + 1, this.g.fL, "└", BDR); this.put(top + h + 1, this.g.fR, "┘", BDR);
    }

    flush() {
        this.term.write("\x1b[H");
        for (let r = 0; r < this.g.rows; r++) {
            let line = "", prev = null;
            for (let c = 0; c < this.g.cols; c++) {
                const col = this.colorGrid[r][c];
                if (col !== prev) { line += col || RS; prev = col; }
                line += this.grid[r][c];
            }
            line += RS;
            r < this.g.rows - 1 ? this.term.writeln(line) : this.term.write(line);
        }
    }

    render() {
        this.resetGrid();

        const title = ` SIGNAL INTERCEPTION — ${this.g.levelConfig.name} `;
        this.putStr(0, Math.floor((this.g.cols - title.length) / 2), title, LC);

        this.putStr(this.g.tTop - 1, this.g.fL + 1, "TARGET SIGNAL", TC);
        this.putStr(this.g.sep + 1, this.g.fL + 1, `INTERCEPT  AMP:${this.g.pAmp.toFixed(1).padStart(4)}  FREQ:${this.g.pFreq.toFixed(3)}`, PC);

        this.drawBox(this.g.tTop - 1, this.g.panelH);
        this.drawBox(this.g.sep + 1, this.g.panelH);

        this.drawWave(this.g.tTop, this.g.tAmp, this.g.tFreq, TC, true);
        this.drawWave(this.g.pTop, this.g.pAmp, this.g.pFreq, (this.g.levelWon || this.g.gameWon) ? GN : PC, false);

        const barW = Math.max(10, this.g.fW - 22);
        const filled = Math.round((this.g.matchPct / 100) * barW);
        const barCol = this.g.matchPct >= this.g.levelConfig.winPct ? GN : this.g.matchPct > 60 ? PC : RD;
        const bar = "█".repeat(filled) + "░".repeat(barW - filled);
        const lockBar = this.g.lockTicks > 0
            ? ` [${"=".repeat(Math.round((this.g.lockTicks / LOCK_NEED) * 10)).padEnd(10)}]`
            : "";
        this.putStr(this.g.hudRow, this.g.fL + 1, `MATCH: ${bar} ${String(this.g.matchPct).padStart(3)}%${lockBar}`, barCol);

        let leg = "Q Quit  |  Controls:";
        if (!this.g.levelConfig.ampLock) leg += " ↑↓ Amplitude";
        if (!this.g.levelConfig.freqLock) leg += " ←→ Frequency";
        this.putStr(this.g.legRow, Math.floor((this.g.cols - leg.length) / 2), leg, DM);

        if (this.g.gameWon) {
            const mid = Math.floor((this.g.fL + this.g.fR) / 2);
            const w1 = "▓▓ FULL SIGNAL SYNC ▓▓";
            const w2 = "200 OK — ALL LEVELS SECURED";
            const w3 = "[Q] EXIT";
            const r = this.g.pTop + Math.floor(this.g.panelH / 2);
            this.putStr(r - 1, mid - Math.floor(w1.length / 2), w1, GN);
            this.putStr(r, mid - Math.floor(w2.length / 2), w2, LC);
            this.putStr(r + 1, mid - Math.floor(w3.length / 2), w3, DM);
        } else if (this.g.levelWon) {
            const mid = Math.floor((this.g.fL + this.g.fR) / 2);
            const w1 = "▓▓ SIGNAL LOCKED ▓▓";
            const w2 = "[SPACE] PROCEED TO NEXT LEVEL";
            const r = this.g.pTop + Math.floor(this.g.panelH / 2);
            this.putStr(r, mid - Math.floor(w1.length / 2), w1, GN);
            this.putStr(r + 1, mid - Math.floor(w2.length / 2), w2, LC);
        }

        this.flush();
    }
}
