declare type HTMLNode = Node & ParentNode;
/**
 * Checks if element is detached.
 *
 * @param element the element to inspect.
 */
export declare function isDetached(element: HTMLNode): boolean;
/**
 * Creates a MutationObserver watching element for detach.
 *
 * @param element the element to watch.
 * @param onDetach the cleanup function once detached.
 */
export declare function initObserver(element: HTMLNode, onDetach: any): MutationObserver;
export {};
