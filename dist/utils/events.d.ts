import { IRegisterElement } from '../types';
/**
 * Adds an event listener to element.
 *
 * @param element the element to bind to.
 * @param events the event types to add listeners for.
 * @param listener the listener to bind.
 */
export declare function addListener(element: IRegisterElement, events: string | string[], listener: EventListenerOrEventListenerObject): void;
/**
 * Removes an event listener from element.
 *
 * @param element the element to unbind.
 * @param events the event types to remove.
 * @param listener the bound listener.
 */
export declare function removeListener(element: IRegisterElement, events: string | string[], listener: EventListenerOrEventListenerObject): void;
