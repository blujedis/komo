"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const validate_1 = require("./validate");
function initElement(api) {
    const { log, schemaAst, fields, unref, mounted, setModel, getModel, getDefault, isTouched, isDirty, setDirty, setTouched, removeDirty, isValidateable } = api;
    function resetElement(element) {
        let value;
        if (utils_1.isRadio(element.type)) {
            element.checked = element.defaultChecked;
            if (element.checked)
                value = element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            value = element.defaultChecked = utils_1.isBooleanLike(element.defaultChecked);
            element.checked = value;
        }
        else if (element.multiple) {
            value = [...element.defaultValue];
            for (let i = 0; i < element.options.length; i++) {
                const opt = element.options[i];
                if (value.includes(opt.value || opt.text))
                    opt.setAttribute('selected', 'true');
            }
        }
        else {
            value = element.defaultValue;
        }
        // Update the model and set defaults.
        if (value)
            setModel(element.path, value, true);
    }
    function updateElement(element, isBlur = false) {
        // Previous value & flags.
        const defaultValue = getDefault(element.path);
        const prevTouched = isTouched(element.path);
        const prevDirty = isDirty(element.path);
        let value;
        let touched = false;
        let dirty = false;
        // On change always set local touched.
        if (!isBlur)
            touched = true;
        if (utils_1.isRadio(element.type)) {
            const radios = [...fields.current.values()]
                .filter(e => utils_1.isRadio(e.type) && e.name === element.name);
            const checked = radios.find(e => e.checked);
            value = (checked && checked.value) || '';
        }
        else if (utils_1.isCheckbox(element.type)) {
            value = element.checked;
        }
        else if (element.multiple) {
            value = [];
            // tslint:disable-next-line
            for (let i = 0; i < element.options.length; i++) {
                const opt = element.options[i];
                if (opt.selected)
                    value.push(opt.value || opt.text);
            }
        }
        else {
            value = element.value;
        }
        dirty = !utils_1.isEqual(defaultValue + '', value + '');
        // If is dirty on blur then
        // it is also touched.
        if (isBlur)
            touched = !!dirty || prevTouched;
        if (dirty)
            setDirty(element.name);
        if (touched)
            setTouched(element.name);
        if (!dirty && prevDirty)
            removeDirty(element.name);
        // Set the model value.
        setModel(element.path, value);
    }
    // Binds to events, sets initial values.
    function bindElement(element) {
        if (!element || fields.current.has(element))
            return;
        if (!element.name) {
            log.warn(`Element of tag "${element.tagName}" could NOT be registered using name of undefined.`);
            return;
        }
        // Normalize path, get default values.
        element.path = element.path || element.name;
        if (!element.type)
            element.setAttribute('type', 'text');
        // Get the model by key.
        const modelVal = getModel(element.path);
        if (utils_1.isRadio(element.type)) {
            element.defaultValue = element.initValue || element.value || modelVal || '';
            element.defaultChecked = element.initChecked || element.checked || modelVal === element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            element.defaultValue = element.initValue || element.value || element.checked || modelVal || false;
            element.defaultChecked = element.defaultValue || false;
        }
        else if (element.multiple) {
            let arr = element.defaultValue = element.initValue || element.value || modelVal || [];
            if (!Array.isArray(arr))
                arr = [element.defaultValue];
            arr = arr.filter(v => !utils_1.isUndefined(v));
            // Ensure initial value includes
            // any default selected values in options.
            for (let i = 0; i < element.options.length; i++) {
                const opt = element.options[i];
                if (opt.selected) {
                    if (!arr.includes(opt.value || opt.text))
                        arr.push(opt.value || opt.text);
                }
            }
            element.defaultValue = arr;
        }
        else {
            element.defaultValue = element.value || modelVal || '';
        }
        element.validateChange = element.onChange ? false :
            utils_1.isUndefined(element.validateChange) ? true : element.validateChange;
        element.validateBlur = element.onBlur ? false :
            utils_1.isUndefined(element.validateBlur) ? true : element.validateBlur;
        const nativeValidators = validate_1.getNativeValidators(element);
        if (nativeValidators.length) {
            if (isValidatedByUser)
                throw new Error(`Field ${element.name} contains native validation keys ${nativeValidators.join(', ')}. Cannot use native validators with user defined schema function.`);
            schemaAst.current = schemaAst.current || {};
            schemaAst.current[element.path] = schemaAst.current[element.path] || [];
            const type = element.type === 'number' || element.type === 'range' ? 'number' : 'string';
            // Set the type.
            schemaAst.current[element.path] = [[type, undefined]];
            // Extend AST with each native validator.
            nativeValidators.forEach(k => {
                schemaAst.current[element.path] = [...schemaAst.current[element.path],
                    [k, element[k]]];
            });
        }
        // Set the Initial Value.
        resetElement(element);
        // Bind events & add to fields
        let events = [];
        const handleBlur = (e) => { updateElement(element, true); };
        const handleChange = (e) => { updateElement(element); };
        if (element.validateBlur) {
            utils_1.addListener(element, 'blur', handleBlur);
            events = [['blur', handleBlur]];
        }
        if (element.validateChange) {
            const changeEvent = utils_1.isTextLike(element.type) ? 'input' : 'change';
            utils_1.addListener(element, changeEvent, handleChange);
            events = [...events, [changeEvent, handleChange]];
        }
        // Reset the element to initial values.
        element.resetElement = () => {
            resetElement(element);
        };
        // Unbind events helper.
        element.unbind = () => {
            if (!events.length)
                return;
            events.forEach(tuple => {
                const [event, handler] = tuple;
                utils_1.removeListener(element, event, handler);
            });
        };
        // Unbind any events and then unref
        // the lement from any collections.
        element.unregister = () => {
            unref(element);
        };
        // Bind mutation observer.
        utils_1.initObserver(element, element.unregister.bind(element));
        // Add to current fields collection.
        fields.current.add(element);
    }
    function registerElement(pathElementOrOptions, options) {
        if (utils_1.isNullOrUndefined(pathElementOrOptions))
            return;
        const hasElement = arguments.length === 1 && typeof pathElementOrOptions === 'object' &&
            pathElementOrOptions.nodeName ? pathElementOrOptions : null;
        // No element just config return callback to get element.
        if (!hasElement) {
            if (!utils_1.isString(pathElementOrOptions)) {
                options = pathElementOrOptions;
                pathElementOrOptions = undefined;
            }
            options = options || {};
            options.path = pathElementOrOptions;
            return (element) => {
                if (!element) {
                    if (!mounted.current) // only show warning if not mounted.
                        log.warn(`Failed to register unknown element using options ${JSON.stringify(options)}.`);
                    return;
                }
                // Extend element with options.
                const _element = element;
                _element.path = options.path || _element.name;
                _element.initValue = options.defaultValue;
                _element.initChecked = options.defaultChecked;
                _element.onValidate = options.onValidate;
                bindElement(_element);
            };
        }
        // ONLY element was passed.
        bindElement(pathElementOrOptions);
    }
    return registerElement;
}
exports.initElement = initElement;
//# sourceMappingURL=register.js.map