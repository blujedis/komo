import isEqual from 'lodash.isequal';
import { PromiseStrict } from 'src/types';
export { isEqual };
declare type ElementType = string | Partial<{
    type: string;
}>;
/**
 * Non operation function.
 *
 * @param def a default value to return for noop.
 */
export declare function noop(def?: any): (...args: any[]) => any;
/**
 * Promise wrapper that returns an object when used
 * with `await` preventing the need for try/catch.
 *
 * @example
 * const { err, data } = await me(Promise);
 *
 * @param promise the promise to be executed.
 */
export declare const me: <T, E = Error>(promise: PromiseStrict<T, E>) => {
    err?: E;
    data?: T;
};
/**
 * Checks if value or value.type is "radio".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isRadio(value: ElementType): boolean;
/**
 * Checks if value or value.type is "checkbox".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isCheckbox(value: ElementType): boolean;
/**
 * Checks if value or value.type is "select".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelect(value: ElementType): boolean;
/**
 * Checks if value or value.type is "select-one".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelectOne(value: ElementType): boolean;
/**
 * Checks if value or value.type is "select-multiple".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelectMultiple(value: ElementType): boolean;
/**
 * Checks if value or value.type is "text".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isText(value: ElementType): boolean;
/**
 * Checks if value or value.type is "textarea".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isTextarea(value: ElementType): boolean;
/**
 * Checks if value or value.type is "hidden".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isHidden(value: ElementType): boolean;
/**
 * Checks if value or value.type is "file".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isFile(value: ElementType): boolean;
/**
 * Checks if value.type is text like input (i.e. not radio, check, submit, reset etc.)
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isTextLike(value: ElementType): boolean;
/**
 * Checks if element is of type that should prevent enter key submits.
 *
 * @param value the value to check element type.
 */
export declare function isPreventEnter(value: ElementType): boolean;
/**
 * Checks loosely if value is a promise.
 *
 * @param value the value to inspect.
 */
export declare function isPromise(value: any): boolean;
/**
 * Checks if a value is boolean like.
 *
 * @param value the value to inspect.
 */
export declare function isBooleanLike(value: any): boolean;
/**
 * Checks if a value is truthy.
 *
 * @param value the value to inspect.
 */
export declare function isTruthy(value: unknown): boolean;
/**
 * Checks if value is undefined.
 *
 * @param value the value to inspect.
 */
export declare function isUndefined(value: unknown): boolean;
/**
 * Checks if is null or undefined.
 *
 * @param value the value to inspect.
 */
export declare function isNullOrUndefined(value: unknown): boolean;
/**
 * Checks if value is an array.
 *
 * @param value the value to inspect.
 */
export declare function isArray(value: unknown): boolean;
/**
 * Checks if is an object.
 *
 * @param value the value to inspect.
 */
export declare function isObject(value: unknown): boolean;
/**
 * Checks if is a plain object.
 *
 * @param value the value to inspect.
 */
export declare function isPlainObject(value: unknown): boolean;
/**
 * Checks if is a string.
 *
 * @param value the value to inspect.
 */
export declare function isString(value: unknown): boolean;
/**
 * Checks if is a function.
 *
 * @param value the value to inspect.
 */
export declare function isFunction(value: unknown): boolean;
/**
 * Checks if string, object or array are empty.
 *
 * @param value the value to inspect.
 */
export declare function isEmpty(value: unknown): boolean;
/**
 * Ensures default when value is undefined.
 *
 * @param value the value to inspect.
 * @param def the default if value is undefined.
 */
export declare function toDefault(value: any, def: any): any;
/**
 * Merges two objects.
 *
 * @param target the target object.
 * @param source the source object to add to target.
 */
export declare function merge<T, S>(target: T, source: S): T & S;
/**
 * Similar to merge but only extends top levels.
 *
 * @param target the target object.
 * @param source the source to extend to the target.
 */
export declare function extend<T, S>(target: T, source: S): T & S;
/**
 * Checks if an object is an element.
 *
 * @param value the value to inspect as element.
 */
export declare function isElement(value: unknown): boolean;
/**
 * Checks if an object is an element or is a virtual.
 *
 * @param value the value to inspect as element or virtual.
 */
export declare function isVirtual(value: unknown): any;
/**
 * Checks if an object is an element or a virtual element.
 *
 * @param value the value to inspect as element or virtual.
 */
export declare function isElementOrVirtual(value: unknown): any;
