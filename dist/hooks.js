"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function initHooks(komo) {
    const { state, getElement, getModel, setModel, validateModelAt, isTouched, isDirty, getDefault } = komo;
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
        const unavailableMsg = prop => {
            if (prop)
                return `Prop "${prop}" undefined, element ${name} is unavailable or not mounted.`;
            return `Element "${name}" is unavailable or not mounted.`;
        };
        const getElementOrProp = (prop, message, def = null) => {
            const element = getElement(name);
            message = message || unavailableMsg(prop);
            if (!element || !state.mounted) {
                // tslint:disable-next-line: no-console
                console.warn(message);
                return def;
            }
            if (!prop)
                return element;
            return element[prop];
        };
        const field = {
            register: komo.register.bind(komo),
            // Getters //
            get mounted() {
                return state.mounted;
            },
            get element() {
                return getElementOrProp();
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
                return getElementOrProp('path');
            },
            get value() {
                return getElementOrProp('value');
            },
            get data() {
                return getModel(field.path);
            },
            get default() {
                return getDefault(field.path);
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
                const element = getElementOrProp();
                if (!element)
                    return;
                element.value = value + '';
            },
            set data(value) {
                setModel(field.path, value);
            },
            // Events //
            focus(e) {
                const element = getElementOrProp();
                if (element)
                    element.focus();
            },
            blur(e) {
                const element = getElementOrProp();
                if (element)
                    element.blur();
            },
            update(value, modelValue, validate = true) {
                const element = getElementOrProp();
                if (element)
                    element.update(value, modelValue, validate);
            },
            validate() {
                const element = getElementOrProp();
                if (element)
                    return validateModelAt(element);
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