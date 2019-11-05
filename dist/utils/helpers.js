"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
exports.isEqual = lodash_isequal_1.default;
/**
 * Checks if value is matching tag type.
 *
 * @param tag the tag type or object containing type.
 * @param match the value to match.
 */
function isTagType(tag, match) {
    const compare = ((typeof tag === 'object' ? tag.type : tag) || '').toLowerCase();
    if (!compare)
        return false;
    return compare.startsWith(match);
}
// PUBLIC //
/**
 * Promise wrapper that returns an object when used
 * with `await` preventing the need for try/catch.
 *
 * @example
 * const { err, data } = await me(Promise);
 *
 * @param promise the promise to be executed.
 */
exports.me = (promise) => {
    return promise
        .then(data => ({ err: null, data }))
        .catch(err => ({ err }));
};
/**
 * Checks if value or value.type is "radio".
 *
 * @param value the string or object containing type to inspect.
 */
function isRadio(value) {
    return isTagType(value, 'radio');
}
exports.isRadio = isRadio;
/**
 * Checks if value or value.type is "checkbox".
 *
 * @param value the string or object containing type to inspect.
 */
function isCheckbox(value) {
    return isTagType(value, 'checkbox');
}
exports.isCheckbox = isCheckbox;
/**
 * Checks if value or value.type is "select".
 *
 * @param value the string or object containing type to inspect.
 */
function isSelect(value) {
    return isTagType(value, 'select');
}
exports.isSelect = isSelect;
/**
 * Checks if value or value.type is "select-one".
 *
 * @param value the string or object containing type to inspect.
 */
function isSelectOne(value) {
    return isTagType(value, 'select-one');
}
exports.isSelectOne = isSelectOne;
/**
 * Checks if value or value.type is "select-multiple".
 *
 * @param value the string or object containing type to inspect.
 */
function isSelectMultiple(value) {
    return isTagType(value, 'select-multiple');
}
exports.isSelectMultiple = isSelectMultiple;
/**
 * Checks if value or value.type is "input".
 *
 * @param value the string or object containing type to inspect.
 */
function isInput(value) {
    return isTagType(value, 'input');
}
exports.isInput = isInput;
/**
 * Checks if value or value.type is "textarea".
 *
 * @param value the string or object containing type to inspect.
 */
function isTextarea(value) {
    return isTagType(value, 'textarea');
}
exports.isTextarea = isTextarea;
/**
 * Checks if value or value.type is "hidden".
 *
 * @param value the string or object containing type to inspect.
 */
function isHidden(value) {
    return isTagType(value, 'hidden');
}
exports.isHidden = isHidden;
/**
 * Checks if value or value.type is "file".
 *
 * @param value the string or object containing type to inspect.
 */
function isFile(value) {
    return isTagType(value, 'file');
}
exports.isFile = isFile;
/**
 * Checks if value.type is text like input (i.e. not radio, check, submit, reset etc.)
 *
 * @param value the string or object containing type to inspect.
 */
function isTextLike(value) {
    const type = value.type || value;
    return !['select-one', 'select-multiple', 'radio',
        'checkbox', 'file', 'submit', 'reset'].includes(type);
}
exports.isTextLike = isTextLike;
/**
 * Checks loosely if value is a promise.
 *
 * @param value the value to inspect.
 */
function isPromise(value) {
    return Promise.resolve(value) === value;
}
exports.isPromise = isPromise;
/**
 * Checks if a value is boolean like.
 *
 * @param value the value to inspect.
 */
function isBooleanLike(value) {
    return /^(true|false|0|1)$/.test(value);
}
exports.isBooleanLike = isBooleanLike;
/**
 * Checks if a value is truthy.
 *
 * @param value the value to inspect.
 */
function isTruthy(value) {
    return (typeof value !== undefined &&
        value !== undefined &&
        value !== null &&
        value !== false &&
        value !== -1 &&
        value !== '');
}
exports.isTruthy = isTruthy;
/**
 * Checks if value is undefined.
 *
 * @param value the value to inspect.
 */
function isUndefined(value) {
    return value === undefined;
}
exports.isUndefined = isUndefined;
/**
 * Checks if is null or undefined.
 *
 * @param value the value to inspect.
 */
function isNullOrUndefined(value) {
    return value === null || isUndefined(value);
}
exports.isNullOrUndefined = isNullOrUndefined;
/**
 * Checks if value is an array.
 *
 * @param value the value to inspect.
 */
function isArray(value) {
    return Array.isArray(value);
}
exports.isArray = isArray;
/**
 * Checks if is an object.
 *
 * @param value the value to inspect.
 */
function isObject(value) {
    return !isNullOrUndefined(value) &&
        typeof value === 'object';
}
exports.isObject = isObject;
/**
 * Checks if is a plain object.
 *
 * @param value the value to inspect.
 */
function isPlainObject(value) {
    return isObject(value) &&
        value.constructor &&
        value.constructor === Object &&
        Object.prototype.toString.call(value) === '[object Object]';
}
exports.isPlainObject = isPlainObject;
/**
 * Checks if is a string.
 *
 * @param value the value to inspect.
 */
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
/**
 * Checks if is a function.
 *
 * @param value the value to inspect.
 */
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
/**
 * Checks if string, object or array are empty.
 *
 * @param value the value to inspect.
 */
function isEmpty(value) {
    return value === '' ||
        (Array.isArray(value) && !value.length) ||
        (isObject(value) &&
            !Object.entries(value).length);
}
exports.isEmpty = isEmpty;
/**
 * Ensures default when value is undefined.
 *
 * @param value the value to inspect.
 * @param def the default if value is undefined.
 */
function toDefault(value, def) {
    if (isUndefined(value))
        return def;
    return value;
}
exports.toDefault = toDefault;
/**
 * Merges two objects.
 *
 * @param target the target object.
 * @param source the source object to add to target.
 */
function merge(target, source) {
    for (const k in source) {
        if (isUndefined(source[k]))
            continue;
        if (isPlainObject(target[k]) && isPlainObject(source[k]))
            target[k] = merge(target[k], source[k]);
        else
            target[k] = source[k];
    }
    return target;
}
exports.merge = merge;
/**
 * Similar to merge but only extends top levels.
 *
 * @param target the target object.
 * @param source the source to extend to the target.
 */
function extend(target, source) {
    for (const k in source) {
        if (isUndefined(source[k]))
            continue;
        target[k] = source[k];
    }
    return target;
}
exports.extend = extend;
//# sourceMappingURL=helpers.js.map