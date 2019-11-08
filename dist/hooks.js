"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function initHooks(komo) {
    const { state, getElement, getModel, setModel, validateModelAt, isTouched, isDirty } = komo;
    function getErrors(prop) {
        if (!state.errors || !state.errors[prop] || !state.errors[prop].length)
            return [];
        return state.errors[prop];
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
    function useField(name) {
        const field = {
            register: komo.register.bind(komo),
            // Getters //
            get mounted() {
                return state.mounted;
            },
            get element() {
                if (!field.mounted) {
                    // tslint:disable-next-line: no-console
                    console.warn(`Element for "${name}" is unavailable, the element has not mounted.`);
                    return null;
                }
                return getElement(name);
            },
            get errors() {
                return getErrors(name);
            },
            get valid() {
                return !field.errors.length;
            },
            get invalid() {
                return !!field.errors.length;
            },
            get touched() {
                return isTouched(name);
            },
            get dirty() {
                return isDirty(name);
            },
            get name() {
                return name;
            },
            get path() {
                return field.element.path;
            },
            get value() {
                return field.element.value;
            },
            get data() {
                return getModel(field.path);
            },
            get message() {
                if (field.valid)
                    return null;
                return state.errors[name][0].message;
            },
            get messages() {
                if (field.valid)
                    return null;
                return field.errors.map(e => e.message);
            },
            // Setters //
            set value(value) {
                field.element.value = value + '';
            },
            set data(value) {
                setModel(field.path, value);
            },
            // Events //
            focus(e) {
                field.element.focus();
            },
            blur(e) {
                field.element.blur();
            },
            update(value, modelValue, validate = true) {
                field.element.update(value, modelValue, validate);
            },
            validate() {
                return validateModelAt(field.element);
            }
        };
        return field;
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
    function useFields(...names) {
        return names.reduce((result, prop) => {
            result[prop] = useField(prop);
            return result;
        }, {});
    }
    return {
        useField: react_1.useCallback(useField, []),
        useFields: react_1.useCallback(useFields, [useField])
    };
}
exports.initHooks = initHooks;
//# sourceMappingURL=hooks.js.map