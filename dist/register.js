"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const validate_1 = require("./validate");
const { debug_register, debug_event, debug_set } = utils_1.debuggers;
/**
 * Creates initialized methods for binding and registering an element.
 *
 * @param api the base form api.
 */
function initElement(api) {
    const { options: komoOptions, schemaAst, fields, unregister, setModel, getModel, isTouched, isDirty, setDefault, mounted, setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange, validateModelAt, isValidatable, removeError, setError, render, getElement, isDirtyCompared } = api;
    /**
     * Checks if the element is a duplicate and should be ignored.
     * Radio groups never return true.
     */
    function isRegistered(element) {
        if (mounted.current)
            return true;
        const exists = fields.current.has(element);
        const elements = getElement(element.name, true);
        // if only a single element, not a radio group.
        if (elements.length === 1)
            return exists || !elements.length;
        // If group ensure name/value not dupe.
        return exists || !!elements.filter(e => e.value === element.value).length;
    }
    // TODO: need to breatkout get set for each element type
    // into it's own file, make it more clear.
    /**
     *
     * @param element the element to set multiple select element for.
     * @param values the array of values to set.
     */
    function setMultiple(element, values) {
        values = !utils_1.isArray(values) ? [values] : values;
        const result = [];
        for (let i = 0; i < element.options.length; i++) {
            const opt = element.options[i];
            opt.selected = false;
            opt.removeAttribute('selected');
            if (values.includes(opt.value) || values.includes(opt.text)) {
                opt.setAttribute('selected', 'true');
                opt.selected = true;
                result.push(opt.value || opt.text);
            }
        }
        return result;
    }
    /**
     * Get multiple values from select multiple.
     *
     * @param element the element to get select multiple values for.
     */
    function getMultiple(element) {
        if (!utils_1.isSelectMultiple(element.type)) {
            // tslint:disable-next-line: no-console
            console.error(`Attempted to get as select multiple value but is type "${element.type}" and tag of ${element.tagName || 'null'}`);
            return;
        }
        const value = [];
        // tslint:disable-next-line
        for (let i = 0; i < element.options.length; i++) {
            const opt = element.options[i];
            if (opt.selected)
                value.push(opt.value || opt.text);
        }
        return value;
    }
    /**
     * Gets value of checked radio.
     *
     * @param element the radio element to get value for.
     */
    function getRadioValue(element) {
        if (!utils_1.isRadio(element.type)) {
            // tslint:disable-next-line: no-console
            console.error(`Attempted to get as radio value but is type ${element.type} and tag of ${element.tagName || 'null'}`);
            return;
        }
        const radios = getElement(element.name, true);
        const checked = radios.find(e => e.checked);
        return (checked && checked.value) || '';
    }
    /**
     * Find radios and set checked on value match.
     *
     * @param name the radio group name.
     * @param value the value to match to set checked radio.
     */
    function setRadioChecked(name, value) {
        const radios = getElement(name, true);
        let nextChecked;
        radios.forEach((radio) => {
            if (utils_1.isEqual(radio.value, value)) {
                radio.checked = true;
                nextChecked = radio;
            }
            else {
                radio.checked = false;
            }
        });
        if (!nextChecked)
            // tslint:disable-next-line: no-console
            console.warn(`Could not set radio group, value "${value} has no match.`);
        return nextChecked;
    }
    /**
     * Gets the data value from parsing element.
     * This value will be used to set the model.
     *
     * @param element the registered element to be updated.
     */
    function getElementValue(element) {
        let value;
        if (utils_1.isRadio(element.type)) {
            value = getRadioValue(element);
        }
        else if (utils_1.isCheckbox(element.type)) {
            value = element.checked;
        }
        else if (element.multiple) {
            value = getMultiple(element);
        }
        else {
            value = element.value;
        }
        return value;
    }
    /**
     * Sets the element's default value. be sure to pass the correct
     * value type. Multiples for example needs an array of values.
     *
     * @param element the element to be reset.
     * @param value the element value to set.
     */
    function setElementValue(element, value) {
        value = utils_1.isUndefined(value) ? '' : value;
        if (utils_1.isRadio(element.type)) {
            setRadioChecked(element.name, value);
        }
        else if (utils_1.isCheckbox(element.type)) {
            if (utils_1.isBooleanLike(value) && (value === true || value === 'true'))
                element.checked = true;
            else
                element.checked = false;
        }
        else if (element.multiple) {
            value = setMultiple(element, value);
        }
        else {
            element.value = value;
        }
    }
    /**
     * Sets the element's default value.
     *
     * @param element the element to be reset.
     */
    function setElementDefault(element, isReset = false) {
        let value;
        if (utils_1.isRadio(element.type)) {
            element.checked = element.defaultCheckedPersist;
            if (element.checked)
                value = element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            element.checked = element.defaultChecked = utils_1.isBooleanLike(element.defaultCheckedPersist);
            value = element.checked;
        }
        else if (element.multiple) {
            value = setMultiple(element, [...element.defaultValuePersist]);
        }
        else {
            value = element.defaultValuePersist;
            element.value = value;
        }
        // Don't set undefined unchecked
        // radio will not have value.
        if (utils_1.isUndefined(value))
            return value;
        setModel(element.path, value);
        return value;
    }
    /**
     * Sets the element's state after comparing value.
     *
     * @param element the element to set state for.
     * @param value the value used to compare state.
     */
    function setElementState(element, value) {
        const name = !element.virtual ? element.name : element.virtual;
        const prevTouched = isTouched(name);
        const prevDirty = isDirty(name);
        const dirtyCompared = isDirtyCompared(name, value);
        let dirty = false;
        let touched = false;
        if (dirtyCompared) {
            setDirty(name);
            dirty = true;
        }
        if (!!dirtyCompared || prevTouched) {
            setTouched(name);
            touched = true;
        }
        if (!dirtyCompared && prevDirty)
            removeDirty(name);
        // Updating the model here so if 
        // empty string set to undefined.
        if (value === '')
            value = undefined;
        return {
            dirty,
            touched,
            value,
            modelValue: undefined
        };
    }
    /**
     * Calls "setModel" persisting data to model.
     *
     * @param element the element to set model for.
     * @param modelValue the value to be set.
     */
    function setElementModel(element, modelValue) {
        const castHandler = komoOptions.castHandler;
        modelValue = castHandler(modelValue, element.path, element.name);
        // Set the model value.
        setModel(element.path, modelValue);
        return modelValue;
    }
    function updateStateAndModel(element, value, modelValue) {
        // if no value is provided then
        // get the normalized value.
        value = utils_1.isUndefined(value) ? getElementValue(element) : value;
        // Update the state.
        const elementState = setElementState(element, value);
        debug_set('update', element.name, element.path, element.virtual, elementState);
        // Ensure the model value.
        modelValue = utils_1.isUndefined(modelValue) ? value : modelValue;
        // Update the model value.
        elementState.modelValue = setElementModel(element, modelValue);
        return elementState;
    }
    /**
     * Attaches blur/change events for element.
     *
     * @param element the element to attach events for.
     */
    function attachEvents(element) {
        let events = [];
        // Cannot attach events to virtuals.
        if (element.virtual)
            return events;
        const handleBlur = async (e) => {
            updateStateAndModel(element);
            debug_event(element.name, element.value);
            if (isValidateBlur(element)) {
                await utils_1.me(element.validate());
            }
        };
        const handleChange = async (e) => {
            updateStateAndModel(element);
            debug_event(element.name, element.value);
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
        return events;
    }
    /**
     * Validates the model at key name.
     *
     * @param element the element to be validated.
     * @param value the value to be validated.
     */
    async function validateElementModel(element, value) {
        if (!isValidatable())
            return Promise.resolve(value);
        const { err, data } = await utils_1.me(validateModelAt(element));
        if (err) {
            setError(element.name, err[element.name]);
            render('validate:invalid');
            return Promise.reject(err);
        }
        // Model is valid remove all errors.
        removeError(element.name);
        // Render and update view.
        render('validate:valid');
        return Promise.resolve(data);
    }
    /**
     * Extends the element with bound events.
     *
     * @param element the element to be extended.
     */
    function extendEvents(element, rebind = false) {
        let events = [];
        // Attach events return array of attach for unbinding.
        // skip if rebinding or if is a virtual element.
        if (!rebind && !element.virtual)
            events = attachEvents(element);
        // Update the model, value and state.
        element.update = async (value, modelValue, validate = true) => {
            // Select multiples use model array 
            // to set it's slected values.
            const setVal = element.multiple ? modelValue || value : value;
            setElementValue(element, setVal);
            updateStateAndModel(element, value, modelValue);
            if (!validate) {
                render('update:novalidate');
                return;
            }
            await utils_1.me(validateElementModel(element, value));
        };
        element.validate = async () => {
            const currentValue = getModel(element.path);
            return validateElementModel(element, currentValue);
        };
        // Reset the element to initial values.
        element.reset = () => {
            setElementDefault(element);
        };
        element.reinit = (options) => {
            bindElement(element, true);
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
            unregister(element);
        };
        // Bind mutation observer.
        if (!element.virtual)
            utils_1.initObserver(element, element.unregister.bind(element));
    }
    /**
     * Initializes the default values for the specified element.
     *
     * @param element the element to initialize default values vor.
     */
    function initDefaults(element) {
        // Normalize path, get default values.
        element.path = element.path || element.name;
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
            const elementValues = getMultiple(element);
            arr = [...arr, ...elementValues].reduce((a, c) => {
                if (!a.includes(c))
                    a.push(c);
                return a;
            }, []);
            element.defaultValue = element.defaultValuePersist = arr;
        }
        else {
            element.defaultValue = element.defaultValuePersist = element.initValue || element.value || modelVal || '';
        }
    }
    /**
     * Binds and element and attaches specified event listeners.
     *
     * @param element the element to be bound.
     */
    function bindElement(element, rebind = false) {
        if (!element || (isRegistered(element) && !rebind))
            return;
        if (!element.name) {
            // tslint:disable-next-line: no-console
            console.warn(`Element of tag "${element.tagName || 'null'}" could NOT be registered using name of undefined.`);
            return;
        }
        // If virtual element can only have type of "text".
        if (element.virtual) {
            element.type = 'text';
            element.multiple = false; // shouldn't be set but just in case.
        }
        // Normalizes the element and defaults for use with Komo.
        initDefaults(element);
        // NOTE: This should probably be refactored to
        // own file for greater flexibility/options.
        if (!rebind) {
            const allowNative = !utils_1.isUndefined(element.enableNativeValidation) ?
                element.enableNativeValidation : komoOptions.validateNative;
            if (allowNative && !utils_1.isFunction(komoOptions.validationSchema))
                schemaAst.current = validate_1.parseNativeValidators(element, schemaAst.current);
        }
        // Set the Initial Value.
        const value = setElementDefault(element);
        setDefault(element.path, value);
        // Attach/extend element with events.
        extendEvents(element, rebind);
        // Add to current field to the collection.
        if (!rebind)
            fields.current.add(element);
        return element;
    }
    /**
     * Normalizes the element merging user options with element options/config.
     *
     * @param element the element to be normalized.
     * @param options user provided options to initialize with.
     */
    function normalizeElement(element, options = {}) {
        element.name = (options.name || element.name);
        element.path = options.path || element.name;
        element.initValue = options.defaultValue;
        element.initChecked = options.defaultChecked;
        element.validateChange = options.validateChange;
        element.validateBlur = options.validateBlur;
        element.enableNativeValidation = options.enableNativeValidation;
        element.enableModelUpdate = options.enableModelUpdate;
        if (options.required)
            element.required = options.required || element.required;
        if (options.min)
            element.min = options.min;
        if (options.max)
            element.max = options.max;
        if (options.pattern)
            element.pattern = options.pattern;
        if (options.minLength)
            element.minLength = options.minLength;
        if (options.maxLength)
            element.maxLength = options.maxLength;
        if (element.virtual) {
            element.type = 'text';
            element.multiple = false;
        }
        return element;
    }
    function registerElement(elementOrOptions, options) {
        if (utils_1.isNullOrUndefined(elementOrOptions))
            return;
        const hasElement = arguments.length === 1 && utils_1.isObject(elementOrOptions) &&
            elementOrOptions.nodeName ||
            elementOrOptions.virtual ? elementOrOptions : null;
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
                if (!_element || isRegistered(_element))
                    return;
                normalizeElement(_element, options);
                if (_element.virtual)
                    debug_register('virtual', _element.name, _element.path, _element.virtual);
                else
                    debug_register('custom', _element.name, _element.path, _element.virtual);
                return bindElement(_element);
            };
        }
        if (!elementOrOptions || isRegistered(elementOrOptions))
            return;
        debug_register(elementOrOptions.name);
        // ONLY element was passed.
        return bindElement(elementOrOptions);
    }
    return registerElement;
}
exports.initElement = initElement;
//# sourceMappingURL=register.js.map