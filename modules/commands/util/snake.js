/**
 * @module modules/commands/util/snake.js
 * @description Classic Snake game in ASCII for the terminal.
 */

import { ANSI } from "../../formatter.js";

export function cmdSnake() {
    return {
        __watch: true,
        watcher: {
            intervalId: null,
            onDataDisposable: null,
            start: function(term, doneCallback) {
                term.write('\x1b[2J\x1b[H'); // Clear terminal completely
                
                // Game config
                const cols = Math.min(term.cols || 80, 80);
                const rows = Math.min(term.rows || 24, 30);
                
                const gridWidth = Math.floor(cols / 2) - 4; // x2 characters per cell
                const gridHeight = rows - 8;
                
                let snake = [
                    { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
                    { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
                    { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) }
                ];
                let dir = { x: 1, y: 0 };
                let nextDir = { x: 1, y: 0 };
                let food = generateFood();
                let score = 0;
                let gameOver = false;
                
                function generateFood() {
                    let newFood;
                    while (true) {
                        newFood = {
                            x: Math.floor(Math.random() * gridWidth),
                            y: Math.floor(Math.random() * gridHeight)
                        };
                        const onSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y);
                        if (!onSnake) break;
                    }
                    return newFood;
                }
                
                // Key bindings
                this.onDataDisposable = term.onData(e => {
                    if (e === '\x1b[A' || e === 'w' || e === 'W') { // up
                        if (dir.y !== 1) nextDir = { x: 0, y: -1 };
                    } else if (e === '\x1b[B' || e === 's' || e === 'S') { // down
                        if (dir.y !== -1) nextDir = { x: 0, y: 1 };
                    } else if (e === '\x1b[C' || e === 'd' || e === 'D') { // right
                        if (dir.x !== -1) nextDir = { x: 1, y: 0 };
                    } else if (e === '\x1b[D' || e === 'a' || e === 'A') { // left
                        if (dir.x !== 1) nextDir = { x: -1, y: 0 };
                    } else if (e === 'q' || e === 'Q') {
                        doneCallback(); // quit
                    } else if (gameOver && (e === 'r' || e === 'R')) {
                        // Restart
                        snake = [
                            { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
                            { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
                            { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) }
                        ];
                        dir = { x: 1, y: 0 };
                        nextDir = { x: 1, y: 0 };
                        score = 0;
                        gameOver = false;
                        food = generateFood();
                    }
                });
                
                const draw = () => {
                    if (!gameOver) {
                        dir = nextDir;
                        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
                        
                        // Check collision with walls
                        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
                            gameOver = true;
                        } else if (snake.some(s => s.x === head.x && s.y === head.y)) {
                            // Check collision with self
                            gameOver = true;
                        }
                        
                        if (!gameOver) {
                            snake.unshift(head);
                            if (head.x === food.x && head.y === food.y) {
                                score += 10;
                                food = generateFood();
                            } else {
                                snake.pop();
                            }
                        }
                    }
                    
                    // Render
                    let out = '\x1b[H\n'; // Go to top
                    out += `  ${ANSI.bold}${ANSI.cyan}SNAKE${ANSI.reset} - Score: ${ANSI.yellow}${score}${ANSI.reset}  ${ANSI.dim}(Use Arrows/WASD to move, Q to quit)${ANSI.reset}\n`;
                    
                    // Top border
                    out += `  ${ANSI.dim}┌` + '─'.repeat(gridWidth * 2) + `┐${ANSI.reset}\n`;
                    
                    for (let y = 0; y < gridHeight; y++) {
                        out += `  ${ANSI.dim}│${ANSI.reset}`;
                        for (let x = 0; x < gridWidth; x++) {
                            if (food.x === x && food.y === y) {
                                out += `${ANSI.red}● ${ANSI.reset}`;
                            } else {
                                const isSnake = snake.some(s => s.x === x && s.y === y);
                                if (isSnake) {
                                    const isHead = snake[0].x === x && snake[0].y === y;
                                    if (isHead) {
                                        out += `${ANSI.green}■ ${ANSI.reset}`;
                                    } else {
                                        out += `${ANSI.green}▣ ${ANSI.reset}`;
                                    }
                                } else {
                                    out += `  `;
                                }
                            }
                        }
                        out += `${ANSI.dim}│${ANSI.reset}\n`;
                    }
                    
                    // Bottom border
                    out += `  ${ANSI.dim}└` + '─'.repeat(gridWidth * 2) + `┘${ANSI.reset}\n`;
                    
                    if (gameOver) {
                        out += `  ${ANSI.bold}${ANSI.red}GAME OVER!${ANSI.reset} ${ANSI.dim}Press 'R' to restart, 'Q' to quit.${ANSI.reset}\n`;
                    } else {
                        out += `\n`;
                    }
                    
                    term.write(out);
                };
                
                draw();
                // 100ms is a good speed for snake
                this.intervalId = setInterval(draw, 100);
            },
            stop: function(term) {
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
                // Don't need to write to term, doneCallback handles next prompt
                if (term) term.write(`\n\n  ${ANSI.dim}[Snake stopped]${ANSI.reset}\n`);
            }
        }
    };
}
