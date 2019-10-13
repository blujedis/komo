"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const input_1 = require("./input");
const DEFAULTS = {
    model: undefined,
    pristine: [],
    touched: [],
    error: {}
};
function deleteKeys(obj, ...keys) {
    return Object.keys(obj).reduce((a, c) => {
        if (keys.includes(c))
            return a;
        a[c] = obj[c];
        return a;
    }, {});
}
function initForm(options) {
    if (!options.model)
        throw new Error(`Cannot initialize form using "model" of undefined`);
    const ref = options.ref || react_1.useRef(null);
    const [state, setState] = react_1.useState({ ...DEFAULTS, ...options });
    const controls = new Map();
    function setKey(key, value) {
        setState({ ...state, ...{ [key]: value } });
    }
    function register(key, initialValue) {
        if (initialValue)
            setModel(key, initialValue);
        const hook = [state.model[key], (value) => setModel(key, value)];
        return hook;
    }
    function unregister(name) {
        return controls.delete(name);
    }
    function setModel(key, value) {
        if (arguments.length === 1)
            setKey('model', key);
        else
            setKey('model', { ...state[key], ...{ [key]: value } });
    }
    function setPristine(key) {
        if (!state.pristine.includes(key))
            setKey('pristine', [...state.pristine, key]);
    }
    function removePristine(key) {
        if (!state.pristine.includes(key))
            return false;
        setKey('pristine', state.pristine.filter(k => k !== key));
        return true;
    }
    function resetPristine() {
        clear('pristine');
    }
    function setTouched(key) {
        if (!state.touched.includes(key))
            setKey('touched', [...state.touched, key]);
    }
    function removeTouched(key) {
        if (!state.touched.includes(key))
            return false;
        setKey('touched', state.touched.filter(k => k !== key));
        return true;
    }
    function resetTouched() {
        clear('touched');
    }
    function setError(key, eState) {
        let keyErrors = state.error[key] = state.error[key] || [];
        keyErrors = [...keyErrors, eState];
        setKey('error', { ...state.error, [key]: keyErrors });
    }
    function removeError(key, eState) {
        const idx = state.error[key].indexOf(eState);
        if (idx < 0)
            return false;
        const keyErrors = [...state.error[key].slice(0, idx), ...state.error[key].slice(idx + 1)];
        setKey('error', { ...state.error, [key]: keyErrors });
        return true;
    }
    function resetError() {
        clear('error');
    }
    function isValid(schema) {
        const hasErrors = Object.keys(state.error).length;
        if (!schema)
            return !hasErrors;
        return !hasErrors && schema.isValidSync(state.model);
    }
    function isPristine() {
        return !state.pristine.length;
    }
    function isTouched() {
        return !!state.touched.length;
    }
    function clear(key) {
        if (!Array.isArray(state[key]))
            setKey(key, {});
        else
            setKey(key, []);
    }
    function reset() {
        const pristine = [];
        const touched = [];
        const error = {};
        setState({ ...state, pristine, touched, error });
        ref.current.reset();
    }
    return {
        ref,
        model: state.model,
        pristine: state.pristine,
        touched: state.touched,
        error: state.error,
        state,
        setState,
        setModel,
        setError,
        removeError,
        resetError,
        setPristine,
        removePristine,
        resetPristine,
        isPristine,
        setTouched,
        removeTouched,
        resetTouched,
        isTouched,
        isValid,
        clear,
        reset,
        register,
        unregister
    };
}
function useForm(options) {
    const api = initForm(options);
    function input(name, initialValue, attributes = {}) {
        return input_1.useFormInput(name, initialValue, attributes, api);
    }
    return api;
}
exports.useForm = useForm;
//# sourceMappingURL=form.jsx.map