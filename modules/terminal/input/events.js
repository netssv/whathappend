/**
 * Simple Pub/Sub Event Bus for Terminal Input
 */

export const InputEvents = {
    // Event Names
    EV_KEY_TYPED: "EV_KEY_TYPED",
    EV_COMMAND_SUBMIT: "EV_COMMAND_SUBMIT",
    EV_BUFFER_CHANGE: "EV_BUFFER_CHANGE",
    EV_TAB_PRESSED: "EV_TAB_PRESSED",
    EV_HISTORY_NAVIGATE: "EV_HISTORY_NAVIGATE",
    EV_PASTE_TEXT: "EV_PASTE_TEXT",
    EV_CLEAR_SCREEN: "EV_CLEAR_SCREEN",
    EV_INTERRUPT: "EV_INTERRUPT",

    listeners: {},

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    emit(event, payload) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(payload));
        }
    }
};
