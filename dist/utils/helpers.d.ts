import isEqual from 'lodash.isequal';
import { PromiseStrict } from 'src/types';
export { isEqual };
declare type TagType = string | Partial<{
    type: string;
}>;
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
 * Merges own property names and types.
 *
 * @param target the target object.
 * @param source the source to merge to target.
 */
export declare function merge<T, S>(target: T, source: S): T & S;
/**
 * Checks if value or value.type is "radio".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isRadio(value: TagType): boolean;
/**
 * Checks if value or value.type is "checkbox".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isCheckbox(value: TagType): boolean;
/**
 * Checks if value or value.type is "select".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelect(value: TagType): boolean;
/**
 * Checks if value or value.type is "select-one".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelectOne(value: TagType): boolean;
/**
 * Checks if value or value.type is "select-multiple".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isSelectMultiple(value: TagType): boolean;
/**
 * Checks if value or value.type is "input".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isInput(value: TagType): boolean;
/**
 * Checks if value or value.type is "textarea".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isTextarea(value: TagType): boolean;
/**
 * Checks if value or value.type is "hidden".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isHidden(value: TagType): boolean;
/**
 * Checks if value or value.type is "file".
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isFile(value: TagType): boolean;
/**
 * Checks if value.type is text like input (i.e. not radio, check, submit, reset etc.)
 *
 * @param value the string or object containing type to inspect.
 */
export declare function isTextLike(value: TagType): boolean;
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
 * Ensures value or fallsback to default.
 *
 * @param value the value to inspect.
 * @param def the default if value is undefined.
 */
export declare function toDefault(value: any, def: any): any;
