"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Simple clone util to clone initial values of an input.
 * Use only for this purpose, shallow clone only.
 *
 * @param value
 */
function cloneInput(value) {
    if (typeof value !== 'object')
        return value;
    if (Array.isArray(value))
        return [...value];
    return { ...value };
}
exports.cloneInput = cloneInput;
//# sourceMappingURL=utils.js.map