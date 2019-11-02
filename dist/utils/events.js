"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Adds an event listener to element.
 *
 * @param element the element to bind to.
 * @param events the event types to add listeners for.
 * @param listener the listener to bind.
 */
function addListener(element, events, listener) {
    if (!element || !element.addEventListener)
        return;
    if (!Array.isArray(events))
        events = [events];
    element.addEventListener(events.join(' '), listener);
}
exports.addListener = addListener;
/**
 * Removes an event listener from element.
 *
 * @param element the element to unbind.
 * @param events the event types to remove.
 * @param listener the bound listener.
 */
function removeListener(element, events, listener) {
    if (!element || !element.removeEventListener)
        return;
    if (!Array.isArray(events))
        events = [events];
    element.removeEventListener(events.join(' '), listener);
}
exports.removeListener = removeListener;
//# sourceMappingURL=events.js.map