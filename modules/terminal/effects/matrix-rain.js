/**
 * @module modules/terminal/effects/matrix-rain.js
 * @description Canvas-based "Matrix code rain" visual effect overlay.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: startMatrixRain
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

// ===================================================================
// Matrix Rain — Falling code effect overlay
//
// Creates a temporary <canvas> over the terminal container,
// draws cascading green glyphs for a set duration, then fades out.
// ===================================================================

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[]=/\\*+~^";
const DURATION = 6000;      // Total effect duration (ms)
const FADE_START = 4500;    // Start fading out at this point
const FONT_SIZE = 14;

let _running = false;

/**
 * Start the matrix rain effect on the terminal container.
 * @param {string} [accentColor="#00ff00"] - The primary glyph color
 */
export function startMatrixRain(accentColor = "#00ff00") {
    if (_running) return; // Prevent stacking
    _running = true;

    const container = document.getElementById("terminal-container");
    if (!container) { _running = false; return; }

    // Create overlay canvas
    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 50; pointer-events: none;
        transition: opacity 0.8s ease;
    `;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Size canvas to container
    function resize() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    resize();

    const columns = Math.floor(canvas.width / FONT_SIZE);
    const drops = new Array(columns).fill(0);

    // Randomize initial positions for a staggered start
    for (let i = 0; i < drops.length; i++) {
        drops[i] = Math.random() * -20;
    }

    const startTime = performance.now();

    function draw(now) {
        const elapsed = now - startTime;

        // Fade out near the end
        if (elapsed > FADE_START) {
            const fadeProgress = (elapsed - FADE_START) / (DURATION - FADE_START);
            canvas.style.opacity = Math.max(0, 1 - fadeProgress);
        }

        // End effect
        if (elapsed > DURATION) {
            canvas.remove();
            _running = false;
            return;
        }

        // Semi-transparent black to create trail effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${FONT_SIZE}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            if (drops[i] < 0) {
                drops[i] += 0.3; // Stagger: slowly enter the screen
                continue;
            }

            // Random character
            const char = CHARS[Math.floor(Math.random() * CHARS.length)];

            // Head character: bright
            ctx.fillStyle = "#ffffff";
            ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);

            // Trail: accent color with varying opacity
            const trailOpacity = 0.4 + Math.random() * 0.4;
            ctx.fillStyle = accentColor + Math.floor(trailOpacity * 255).toString(16).padStart(2, "0");
            if (drops[i] > 1) {
                const prevChar = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillText(prevChar, i * FONT_SIZE, (drops[i] - 1) * FONT_SIZE);
            }

            drops[i]++;

            // Reset drop with random chance
            if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}
