import isEqual from 'lodash.isequal';
import { PromiseStrict } from 'src/types';
export { isEqual };

// PRIVATE //

type ElementType = string | Partial<{ type: string; }>;

/**
 * Checks if value is matching tag type.
 * 
 * @param tag the tag type or object containing type. 
 * @param match the value to match. 
 */
function isElementType(tag: ElementType, match: string) {
  const compare = ((typeof tag === 'object' ? tag.type : tag) || '').toLowerCase();
  if (!compare) return false;
  return compare.startsWith(match);
}

// PUBLIC //

/**
 * Non operation function.
 * 
 * @param def a default value to return for noop.
 */
export function noop(def?: any) {
  return (...args: any[]) => def || undefined;
}

/**
 * Promise wrapper that returns an object when used
 * with `await` preventing the need for try/catch.
 * 
 * @example
 * const { err, data } = await me(Promise);
 * 
 * @param promise the promise to be executed.
 */
export const promise = <T, E = Error>(p: PromiseStrict<T, E>) => {
  return p
    .then(data => ({ err: null, data }))
    .catch(err => ({ err })) as { err?: E, data?: T; };
};

/**
 * Checks if value or value.type is "radio".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isRadio(value: ElementType) {
  return isElementType(value, 'radio');
}

/**
 * Checks if value or value.type is "checkbox".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isCheckbox(value: ElementType) {
  return isElementType(value, 'checkbox');
}

/**
 * Checks if value or value.type is "select".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isSelect(value: ElementType) {
  return isElementType(value, 'select');
}

/**
 * Checks if value or value.type is "select-one".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isSelectOne(value: ElementType) {
  return isElementType(value, 'select-one');
}

/**
 * Checks if value or value.type is "select-multiple".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isSelectMultiple(value: ElementType) {
  return isElementType(value, 'select-multiple');
}

/**
 * Checks if value or value.type is "text".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isText(value: ElementType) {
  return isElementType(value, 'text');
}

/**
 * Checks if value or value.type is "textarea".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isTextarea(value: ElementType) {
  return isElementType(value, 'textarea');
}

/**
 * Checks if value or value.type is "hidden".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isHidden(value: ElementType) {
  return isElementType(value, 'hidden');
}

/**
 * Checks if value or value.type is "file".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isFile(value: ElementType) {
  return isElementType(value, 'file');
}

/**
 * Checks if value.type is text like input (i.e. not radio, check, submit, reset etc.)
 * 
 * @param value the string or object containing type to inspect.
 */
export function isTextLike(value: ElementType) {
  const type = (value as any).type || value;
  return !['select-one', 'select-multiple', 'radio',
    'checkbox', 'file', 'submit', 'reset'].includes(type);
}

/**
 * Checks if element is of type that should prevent enter key submits.
 * 
 * @param value the value to check element type.
 */
export function isPreventEnter(value: ElementType) {
  const type = (value as any).type || value;
  return ['select-one', 'select-multiple', 'text',
    'textarea', 'file', 'email', 'color', 'date',
    'datetime-local', 'month', 'number', 'time', 'url', 'week'].includes(type);
}

/**
 * Checks loosely if value is a promise.
 * 
 * @param value the value to inspect.
 */
export function isPromise(value: any) {
  return Promise.resolve(value) === value;
}

/**
 * Checks if a value is boolean like.
 * 
 * @param value the value to inspect.
 */
export function isBooleanLike(value: any) {
  return /^(true|false|0|1)$/.test(value);
}

/**
 * Parses boolean value.
 * 
 * @param value the value to inspect
 */
export function parseBoolean(value: unknown) {
  if (!isBooleanLike(value))
    return false;
  if (/^(false|0)$/.test(value as any))
    return false;
  return true;
}

/**
 * Checks if a value is truthy.
 * 
 * @param value the value to inspect.
 */
export function isTruthy(value: unknown) {
  return (typeof value !== 'undefined' &&
    value !== undefined &&
    value !== null &&
    value !== false &&
    value !== -1 &&
    value !== '');
}

/**
 * Checks if value is undefined.
 * 
 * @param value the value to inspect.
 */
export function isUndefined(value: unknown) {
  return typeof value === 'undefined';
}

/**
 * Checks if is null or undefined.
 * 
 * @param value the value to inspect.
 */
export function isNullOrUndefined(value: unknown) {
  return value === null || isUndefined(value);
}

/**
 * Checks if value is an array.
 * 
 * @param value the value to inspect.
 */
export function isArray(value: unknown) {
  return Array.isArray(value);
}

/**
 * Checks if is an object.
 * 
 * @param value the value to inspect.
 */
export function isObject(value: unknown) {
  return !isNullOrUndefined(value) &&
    typeof value === 'object';
}

/**
 * Checks if is a plain object.
 * 
 * @param value the value to inspect.
 */
export function isPlainObject(value: unknown) {
  return isObject(value) &&
    value.constructor &&
    value.constructor === Object &&
    Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Checks if is a string.
 * 
 * @param value the value to inspect.
 */
export function isString(value: unknown) {
  return typeof value === 'string';
}

/**
 * Checks if is a function.
 * 
 * @param value the value to inspect.
 */
export function isFunction(value: unknown) {
  return typeof value === 'function';
}

/**
 * Checks if string, object or array are empty.
 * 
 * @param value the value to inspect.
 */
export function isEmpty(value: unknown) {
  return value === '' ||
    (Array.isArray(value) && !value.length) ||
    (isObject(value) &&
      !Object.entries(value).length);
}

/**
 * Ensures default when value is undefined.
 * 
 * @param value the value to inspect.
 * @param def the default if value is undefined.
 */
export function toDefault(value: any, def: any) {
  if (isUndefined(value))
    return def;
  return value;
}

/**
 * Merges two objects.
 * 
 * @param target the target object.
 * @param source the source object to add to target.
 */
export function merge<T, S>(target: T, source: S) {
  for (const k in source) {
    if (isUndefined(source[k])) continue;
    if (isPlainObject(target[k as any]) && isPlainObject(source[k]))
      target[k as any] = merge(target[k as any], source[k]);
    else
      target[k as any] = source[k];
  }
  return target as T & S;
}

/**
 * Similar to merge but only extends top levels.
 * 
 * @param target the target object.
 * @param source the source to extend to the target.
 */
export function extend<T, S>(target: T, source: S) {
  for (const k in source) {
    if (isUndefined(source[k])) continue;
    target[k as any] = source[k];
  }
  return target as T & S;
}

/**
 * Checks if an object is an element.
 * 
 * @param value the value to inspect as element.
 */
export function isElement(value: unknown) {
  // @ts-ignore
  if (!isObject(value) || !value.nodeName) return false;
  return value instanceof Element || value instanceof HTMLDocument;
}

/**
 * Checks if an object is an element or is a virtual.
 * 
 * @param value the value to inspect as element or virtual.
 */
export function isVirtual(value: unknown) {
  if (!isObject(value)) return false;
  // @ts-ignore
  return (value || {}).virtual;
}

/**
 * Checks if an object is an element or a virtual element.
 * 
 * @param value the value to inspect as element or virtual.
 */
export function isElementOrVirtual(value: unknown) {
  return isElement(value) || isVirtual(value);
}
