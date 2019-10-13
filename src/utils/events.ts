import { IRegisterElement } from '../types';

/**
 * Adds an event listener to element.
 * 
 * @param element the element to bind to.
 * @param events the event types to add listeners for.
 * @param listener the listener to bind.
 */
export function addListener(
  element: IRegisterElement,
  events: string | string[],
  listener: EventListenerOrEventListenerObject) {

  if (!element || !element.addEventListener)
    return;

  if (!Array.isArray(events))
    events = [events];

  element.addEventListener(events.join(' '), listener);

}

/**
 * Removes an event listener from element.
 * 
 * @param element the element to unbind.
 * @param events the event types to remove.
 * @param listener the bound listener.
 */
export function removeListener(
  element: IRegisterElement,
  events: string | string[],
  listener: EventListenerOrEventListenerObject) {

  if (!element || !element.removeEventListener)
    return;

  if (!Array.isArray(events))
    events = [events];

  element.removeEventListener(events.join(' '), listener);

}
