
type HTMLNode = Node & ParentNode;

/**
 * Checks if element is detached.
 * 
 * @param element the element to inspect.
 */
export function isDetached(element: HTMLNode): boolean {

  if (!element) 
    return true;

  if (!(element instanceof HTMLElement) || element.nodeType === Node.DOCUMENT_NODE)
    return false;

  return isDetached(element.parentNode);

}

/**
 * Creates a MutationObserver watching element for detach.
 * 
 * @param element the element to watch.
 * @param onDetach the cleanup function once detached.
 */
export function initObserver(element: HTMLNode, onDetach) {

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
