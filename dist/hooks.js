"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const utils_1 = require("./utils");
function initHooks(komo) {
    const { state, getElement, getModel, setModel, validateModelAt, isTouched, isDirty, getDefault, render } = komo;
    function getErrors(prop) {
        if (!state.errors || !state.errors[prop] || !state.errors[prop].length)
            return [];
        return state.errors[prop];
    }
    function useField(virtualOrName, virtual) {
        const name = virtual ? virtualOrName : virtualOrName;
        const unavailableMsg = prop => {
            if (prop)
                return `Prop "${prop}" undefined, element "${name}" is unavailable or not mounted.`;
            return `Element "${name}" is unavailable or not mounted.`;
        };
        const getElementOrProp = (prop, message, def = null) => {
            const element = getElement(name);
            message = message || unavailableMsg(prop);
            if (!element && !state.mounted)
                return;
            if (!element && state.mounted) {
                // tslint:disable-next-line: no-console
                console.warn(message);
                return def;
            }
            if (utils_1.isUndefined(prop))
                return element || def;
            const val = element[prop];
            return utils_1.isUndefined(val) ? def : val;
        };
        const field = {
            // register: komo.register.bind(komo),
            register: (elementOrOptions) => {
                // binds hidden prop so we know this 
                // is a hooked element or virtual.
                if (utils_1.isObject(elementOrOptions)) {
                    elementOrOptions.__hooked__ = true;
                    elementOrOptions.virtual = virtual;
                    // Virtual props must use same name.
                    if (elementOrOptions.virtual)
                        elementOrOptions.name = name;
                }
                return komo.register(elementOrOptions);
            },
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
                return getElementOrProp('value', null, '');
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
            // updateAt(key: string, value: any, modelValue?: any, validate: boolean = true) {
            //   const element = getElement(key);
            //   if (!element)
            //     // tslint:disable-next-line: no-console
            //     console.warn(`Cannot UPDATE unknown element at "${key}".`);
            //   else
            //     element.update(value, modelValue, validate);
            // },
            // setValueAt(key: string, value: any) {
            //   const el = getElement(key);
            //   if (!el)
            //     // tslint:disable-next-line: no-console
            //     console.warn(`Cannot set VALUE for known element at "${key}".`);
            //   else
            //     el.value = value;
            // },
            // setDataAt(nameOrPath: string, value: any) {
            //   const element = getElement(nameOrPath);
            //   if (!element)
            //     // tslint:disable-next-line: no-console
            //     console.warn(`Cannot set DATA for known element at "${nameOrPath}".`);
            //   else
            //     element.value = value;
            // },
            validate() {
                const element = getElementOrProp();
                if (element)
                    return validateModelAt(element);
            },
            validateAt(...names) {
                const promises = names.reduce((a, c) => {
                    const el = getElement(c);
                    if (!el) {
                        // tslint:disable-next-line: no-console
                        console.warn(`Cannot validate at unknown element "${c}".`);
                        return a;
                    }
                    a = [...a, validateModelAt(el)];
                }, []);
                return Promise.all(promises);
            },
            render
        };
        return field;
    }
    function useFields(vanity, ...names) {
        if (utils_1.isString(vanity)) {
            names.unshift(vanity);
            vanity = undefined;
        }
        return names.reduce((result, prop) => {
            result[prop] = useField(prop, vanity);
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