"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHooks = void 0;
const react_1 = require("react");
const utils_1 = require("./utils");
function initHooks(komo) {
    const { state, getElement, getModel, setModel, validateModelAt, isTouched, isDirty, getDefault, render, removeError, removeTouched, removeDirty, unregister } = komo;
    function getErrors(prop) {
        if (!state.errors || !state.errors[prop] || !state.errors[prop].length)
            return [];
        return state.errors[prop];
    }
    function useField(virtualOrName, virtual) {
        const name = virtual ? virtualOrName : virtualOrName;
        let unregistered;
        const unavailableMsg = prop => {
            if (prop)
                return `Prop "${prop}" undefined, element "${name}" is unavailable or not mounted.`;
            return `Element "${name}" is unavailable or not mounted.`;
        };
        function getElementOrProp(prop, def = null) {
            const element = getElement(name);
            if (!element && !state.mounted)
                return;
            if (!element && state.mounted) {
                if (!virtual && !unregistered)
                    // tslint:disable-next-line: no-console
                    // console.warn(unavailableMsg(prop));
                    return def;
            }
            if (utils_1.isUndefined(prop))
                return element || def;
            const val = element[prop];
            return utils_1.isUndefined(val) ? def : val;
        }
        const field = {
            register: (elementOrOptions) => {
                // binds hidden prop so we know this 
                // is a hooked element or virtual.
                if (utils_1.isObject(elementOrOptions)) {
                    elementOrOptions.__hooked__ = true;
                    elementOrOptions.virtual = virtual;
                    // Virtual props must use same name.
                    if (elementOrOptions.virtual)
                        elementOrOptions.name = name;
                    // need undefined check here for advanced hook binding example.
                    if (name !== elementOrOptions.name && !elementOrOptions.virtual && typeof elementOrOptions.name !== 'undefined')
                        throw new Error(`Attempted to bind element "${elementOrOptions.name}" using hook for "${name}".`);
                }
                return komo.register(elementOrOptions);
            },
            unregister: () => {
                if (!name)
                    return;
                unregistered = true;
                unregister(name);
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
                const element = getElementOrProp();
                if (!element)
                    return '';
                if (element.type !== 'checkbox')
                    return element.value || '';
                return element.checked;
            },
            get data() {
                if (!field.path)
                    return null;
                return getModel(field.path);
            },
            get default() {
                if (!field.path)
                    return null;
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
                if (!field.path)
                    return;
                setModel(field.path, value);
            },
            // Events //
            reset() {
                const element = getElementOrProp();
                if (element) {
                    // TODO: Use timeout here so we don't trigger
                    // too many renders, maybe we should add
                    // a "noRender" arg to removeError which calls
                    // setError. 
                    setTimeout(() => {
                        removeDirty(name);
                        removeTouched(name);
                        removeError(name);
                        element.reset();
                    });
                }
            },
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