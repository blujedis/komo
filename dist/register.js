"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const validate_1 = require("./validate");
const typeMap = {
    range: 'number',
    number: 'number',
    email: 'string',
    url: 'string',
    checkbox: 'boolean'
};
/**
 * Creates initialized methods for binding and registering an element.
 *
 * @param api the base form api.
 */
function initElement(api) {
    const { options: formOptions, log, schemaAst, fields, unregister, setModel, getModel, getDefault, isTouched, isDirty, setDefault, mounted, setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange, validateModelAt, isValidatable, removeError, setError, getElement, render } = api;
    /**
     * Resets the element to its defaults.
     *
     * @param element the element to be reset.
     * @param isInit when true is setting initial defaults.
     */
    function resetElement(element, isInit = false) {
        let value;
        if (utils_1.isRadio(element.type)) {
            element.checked = element.defaultCheckedPersist;
            if (element.checked)
                value = element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            value = element.defaultChecked = utils_1.isBooleanLike(element.defaultCheckedPersist);
            element.checked = value;
        }
        else if (element.multiple) {
            value = [...element.defaultValuePersist];
            for (let i = 0; i < element.options.length; i++) {
                const opt = element.options[i];
                if (value.includes(opt.value || opt.text)) {
                    opt.setAttribute('selected', 'true');
                    opt.selected = true;
                }
            }
        }
        else {
            value = element.defaultValuePersist;
            element.value = value;
        }
        setModel(element.path, value);
        if (isInit)
            setDefault(element.path, value);
    }
    /**
     * Updates the element on event changes.
     *
     * @param element the registered element to be updated.
     * @param isBlur indicates the update event is of type blur.
     */
    function updateElement(element) {
        // Previous value & flags.
        const defaultValue = getDefault(element.path);
        const prevTouched = isTouched(element.name);
        const prevDirty = isDirty(element.name);
        let value;
        let dirty = false;
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
        dirty = utils_1.isArray(defaultValue)
            ? !utils_1.isEqual(defaultValue, value)
            : !utils_1.isEqual(defaultValue + '', value + '');
        if (dirty)
            setDirty(element.name);
        if (!!dirty || prevTouched)
            setTouched(element.name);
        if (!dirty && prevDirty)
            removeDirty(element.name);
        // Updating the model here so if 
        // empty string set to undefined.
        if (value === '')
            value = undefined;
        // Set the model value.
        setModel(element.path, value);
    }
    /**
     * Binds and element and attaches specified event listeners.
     *
     * @param element the element to be bound.
     */
    function bindElement(element, rebind = false) {
        if (!element || (fields.current.has(element) && !rebind))
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
            element.defaultValue = element.defaultValuePersist =
                element.initValue || element.value || modelVal || '';
            element.defaultChecked = element.defaultCheckedPersist =
                element.initChecked || element.checked || modelVal === element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            element.defaultValue = element.defaultValuePersist =
                element.initValue || element.value || element.checked || modelVal || false;
            element.defaultChecked = element.defaultCheckedPersist = element.defaultValue || false;
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
            element.defaultValue = element.defaultValuePersist = arr;
        }
        else {
            element.defaultValue = element.defaultValuePersist = element.value || modelVal || '';
        }
        // NOTE: This should probably be refactored to
        // own file for greater flexibility/options.
        if (!rebind) {
            const allowNative = !utils_1.isUndefined(element.enableNativeValidation) ?
                element.enableNativeValidation : formOptions.enableNativeValidation;
            if (allowNative && !utils_1.isFunction(formOptions.validationSchema)) {
                const nativeValidators = validate_1.getNativeValidators(element);
                const nativeValidatorTypes = validate_1.getNativeValidatorTypes(element);
                if (nativeValidators.length || nativeValidatorTypes.length) {
                    schemaAst.current = schemaAst.current || {};
                    schemaAst.current[element.path] = schemaAst.current[element.path] || [];
                    const baseType = typeMap[element.type];
                    // Set the type.
                    schemaAst.current[element.path] = [[baseType || 'string', undefined]];
                    // These are basically sub types of string
                    // like email or string.
                    if (nativeValidatorTypes.length) {
                        schemaAst.current[element.path].push([element.type, undefined]);
                    }
                    // Extend AST with each native validator.
                    if (nativeValidators.length)
                        nativeValidators.forEach(k => {
                            schemaAst.current[element.path].push([k, element[k]]);
                        });
                }
            }
        }
        // Set the Initial Value.
        resetElement(element, true);
        // No need to rebind events just rebinding defaults.
        if (rebind)
            return;
        // Bind events
        let events = [];
        element.validate = async () => {
            const currentValue = getModel(element.path);
            if (!isValidatable())
                return Promise.resolve(currentValue);
            const { err, data } = await utils_1.me(validateModelAt(element));
            if (err) {
                setError(element.name, err[element.name]);
                return Promise.reject(err);
            }
            removeError(element.name);
            render();
            return Promise.resolve(data);
        };
        // Reset the element to initial values.
        element.reset = () => {
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
        element.rebind = () => {
            bindElement(element, true);
        };
        // Unbind any events and then unref
        // the lement from any collections.
        element.unregister = () => {
            unregister(element);
        };
        const handleBlur = async (e) => {
            updateElement(element);
            if (isValidateBlur(element)) {
                await utils_1.me(element.validate());
            }
        };
        const handleChange = async (e) => {
            updateElement(element);
            if (isValidateChange(element)) {
                await utils_1.me(element.validate());
            }
        };
        if (element.enableModelUpdate !== false) {
            // Attach blur
            utils_1.addListener(element, 'blur', handleBlur);
            events = [['blur', handleBlur]];
            // Attach change.
            const changeEvent = utils_1.isTextLike(element.type) ? 'input' : 'change';
            utils_1.addListener(element, changeEvent, handleChange);
            events = [...events, [changeEvent, handleChange]];
        }
        // Bind mutation observer.
        utils_1.initObserver(element, element.unregister.bind(element));
        // Add to current fields collection.
        fields.current.add(element);
    }
    /**
     * Checks if the element is a duplicate and should be ignored.
     * Radio groups never return true.
     */
    function isDuplicate(element) {
        if (utils_1.isRadio(element.type))
            return false;
        const isDupe = fields.current.has(element) || getElement(element.name);
        if (isDupe)
            log.warn(`Duplicate field name "${element.name}" ignored, field is not bound.`);
        return isDupe;
    }
    function registerElement(elementOrOptions, options) {
        if (utils_1.isNullOrUndefined(elementOrOptions))
            return;
        const hasElement = arguments.length === 1 && utils_1.isObject(elementOrOptions) &&
            elementOrOptions.nodeName ? elementOrOptions : null;
        // No element just config return callback to get element.
        if (!hasElement) {
            if (!utils_1.isString(elementOrOptions)) {
                options = elementOrOptions;
                elementOrOptions = undefined;
            }
            options = options || {};
            return (element) => {
                // Extend element with options.
                const _element = element;
                if (!_element || isDuplicate(_element))
                    return;
                _element.name = options.name || _element.name;
                _element.path = options.path || _element.name;
                _element.initValue = options.defaultValue;
                _element.initChecked = options.defaultChecked;
                _element.required = options.required || _element.required;
                _element.min = options.min || _element.min;
                _element.max = options.max || _element.max;
                _element.pattern = options.pattern || _element.pattern;
                _element.validateChange = options.validateChange;
                _element.validateBlur = options.validateBlur;
                _element.enableNativeValidation = options.enableNativeValidation;
                _element.enableModelUpdate = options.enableModelUpdate;
                let minLength = _element.minLength === -1 ? undefined : _element.minLength;
                minLength = options.minLength || minLength;
                let maxLength = _element.maxLength === -1 ? undefined : _element.maxLength;
                maxLength = options.maxLength || maxLength;
                if (minLength)
                    _element.minLength = minLength;
                if (maxLength)
                    _element.maxLength = maxLength;
                bindElement(_element);
            };
        }
        if (!elementOrOptions || isDuplicate(elementOrOptions))
            return;
        // ONLY element was passed.
        bindElement(elementOrOptions);
    }
    return registerElement;
}
exports.initElement = initElement;
//# sourceMappingURL=register.js.map