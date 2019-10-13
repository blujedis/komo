"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function initControl(name, initialValue, form) {
    function unregister() {
        if (!form)
            return;
        form.unregister(name);
    }
    function setTouched() {
        if (!form)
            return;
        form.removeTouched(name);
    }
    function removeTouched() {
        if (!form)
            return;
        form.removeTouched(name);
    }
    function validate() {
    }
    function isPristine() {
    }
    function isTouched() {
    }
}
function useFormInput(name, initialValue, attributes = {}, form) {
    const control = initControl(name, initialValue, form);
    const [value, setValue] = form.register(name);
    // Set initial pristine state.
    form.setPristine(name);
    function touched(e) {
        form.removePristine(name);
        form.setTouched(name);
    }
    function onChange(e) {
        setValue(e.target.value);
    }
    const _attributes = {
        value,
        onChange
    };
    attributes = { ..._attributes, ...attributes };
    return {
        value,
        setValue,
        attributes
    };
}
exports.useFormInput = useFormInput;
//# sourceMappingURL=input.jsx.map