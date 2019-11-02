"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Checks if element is detached.
 *
 * @param element the element to inspect.
 */
function isDetached(element) {
    if (!element)
        return true;
    if (!(element instanceof HTMLElement) || element.nodeType === Node.DOCUMENT_NODE)
        return false;
    return isDetached(element.parentNode);
}
exports.isDetached = isDetached;
/**
 * Creates a MutationObserver watching element for detach.
 *
 * @param element the element to watch.
 * @param onDetach the cleanup function once detached.
 */
function initObserver(element, onDetach) {
    const observer = new MutationObserver(() => {
        if (isDetached(element)) {
            observer.disconnect();
            onDetach();
        }
    });
    observer.observe(window.document, {
        childList: true,
        subtree: true,
    });
    return observer;
}
exports.initObserver = initObserver;
//# sourceMappingURL=observer.js.map