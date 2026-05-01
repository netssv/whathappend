/**
 * @module modules/data/signal-data.js
 * @description Difficulty progression configurations for the Signal game.
 */

export const SIGNAL_LEVELS = [
    { name: "LEVEL 1: AMPLITUDE MATCH", amp: "rand", freq: 0.15,   ampLock: false, freqLock: true,  winPct: 88, noise: 0 },
    { name: "LEVEL 2: FREQUENCY SYNC",  amp: 4,      freq: "rand", ampLock: true,  freqLock: false, winPct: 88, noise: 0 },
    { name: "LEVEL 3: DUAL CALIBRATION",amp: "rand", freq: "rand", ampLock: false, freqLock: false, winPct: 88, noise: 0 },
    { name: "LEVEL 4: HIGH PRECISION",  amp: "rand", freq: "rand", ampLock: false, freqLock: false, winPct: 94, noise: 0 },
    { name: "LEVEL 5: NOISY SIGNAL",    amp: "rand", freq: "rand", ampLock: false, freqLock: false, winPct: 88, noise: 1.5 }
];
