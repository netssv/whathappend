/**
 * @module modules/commands/util/hack-timer.js
 * @description Timer class for the Hacker Trivia game.
 */

export class GameTimer {
    constructor(duration, onTick, onTimeout) {
        this.duration = duration;
        this.timeLeft = duration;
        this.interval = null;
        this.onTick = onTick;
        this.onTimeout = onTimeout;
        this.timeoutOccurred = false;
    }

    start() {
        this.stop();
        this.timeLeft = this.duration;
        this.timeoutOccurred = false;
        this.interval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.stop();
                this.timeoutOccurred = true;
                this.onTimeout();
            } else {
                this.onTick();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
