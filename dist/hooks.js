"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function initHooks(komo) {
    function isErrorProp(prop) {
        return typeof komo.state.errors[prop] !== 'undefined';
    }
    function isTouched(prop) {
        return komo.state.touched.includes(prop);
    }
    function isDirty(prop) {
        return komo.state.dirty.includes(prop);
    }
    function hasError(prop) {
        if (!isTouched(prop))
            return false;
        return isErrorProp(prop);
    }
    /**
     * Creates hook to form field element.
     *
     * @example
     * const firstName= useField('firstName');
     *
     * @example
     * <input name="firstName" type="text" error={firstName.invalid} required />
     * <span>{firstName.required}</span>
     *
     * @param name the name of the field to create hook for.
     * @param def the default message value, typically empty string ''.
     */
    function useField(name, def = '') {
        return {
            get element() {
                return komo.getElement(name);
            },
            get touched() {
                return isTouched(name);
            },
            get dirty() {
                return isDirty(name);
            },
            get errors() {
                return komo.state.errors;
            },
            get message() {
                if (!this.errors || typeof this.errors[name] === 'undefined')
                    return def;
                return this.errors[name][0].message;
            },
            get valid() {
                return !hasError(name);
            },
            get invalid() {
                return hasError(name);
            }
        };
    }
    /**
     * Creates and object containing use field hooks for form.
     *
     * @example
     * const { firstName, lastName } = useFields('firstName', 'lastName');
     *
     * @example
     * <input name="firstName" type="text" error={firstName.invalid} required />
     * <span>{firstName.required}</span>
     *
     * @param names the field names you wish to create hooks for.
     */
    function useFields(...name) {
        return name.reduce((result, prop) => {
            result[prop] = useField(prop);
            return result;
        }, {});
    }
    return {
        useField,
        useFields
    };
}
exports.initHooks = initHooks;
//# sourceMappingURL=hooks.js.map