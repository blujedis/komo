"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initElement = void 0;
const utils_1 = require("./utils");
const validate_1 = require("./validate");
const { debug_register, debug_event, debug_set } = utils_1.debuggers;
/**
 * Default options used upon registering an
 * element or virtual element.
 */
const REGISTER_DEFAULTS = {
    validateBlur: true,
    enableBlurEvents: true,
    enableChangeEvents: false
};
/**
 * Creates initialized methods for binding and registering an element.
 *
 * @param api the base form api.
 */
function initElement(api) {
    const { options: komoOptions, schemaAst, fields, unregister, setModel, getModel, isTouched, isDirty, setDefault, setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange, validateModelAt, isValidatable, removeError, setError, render, getElement, isDirtyCompared, model } = api;
    /**
     * Checks if the element is a duplicate and should be ignored.
     * Radio groups never return true.
     */
    function isRegistered(element) {
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
        value = utils_1.isNullOrUndefined(value) ? '' : value;
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
    function setElementDefault(element) {
        let value;
        if (utils_1.isRadio(element.type)) {
            element.checked = utils_1.parseBoolean(element.defaultCheckedPersist);
            if (element.checked)
                value = element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            element.checked = element.defaultChecked = utils_1.parseBoolean(element.defaultCheckedPersist);
            value = element.checked;
        }
        else if (element.multiple) {
            value = setMultiple(element, [...element.defaultValuePersist]);
        }
        else {
            value = element.defaultValuePersist;
            element.value = value;
            // Must have string here.
            if (utils_1.isObject(value) && !element.virtual) {
                // tslint:disable-next-line: no-console
                console.error(`Element "${element.name}" contains invalid typeof "${typeof value}", ${element.type} can only accept strings. Is this a virtual?`);
                return;
            }
        }
        // Don't set undefined unchecked
        // radio will not have value.
        if (utils_1.isUndefined(value))
            return value;
        // Setting parsed default to model.
        setModel(element.path, value);
        return value;
    }
    /**
     * Sets the element's state after comparing value.
     *
     * @param element the element to set state for.
     * @param value the value used to compare state.
     */
    function setElementState(element, modelValue) {
        const name = element.name;
        const prevTouched = isTouched(name);
        const prevDirty = isDirty(name);
        const dirtyCompared = isDirtyCompared(name, modelValue);
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
        return {
            dirty,
            touched
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
        if (modelValue === '')
            modelValue = undefined;
        return new Promise((resolve, reject) => {
            modelValue = castHandler(modelValue, element.path, element.name);
            // Set the model value.
            setModel(element.path, modelValue);
            resolve(modelValue);
        });
    }
    async function updateStateAndModel(element, value, modelValue) {
        // if no value is provided then
        // get the normalized value.
        value = utils_1.isUndefined(value) ? getElementValue(element) : value;
        // Ensure the model value.
        modelValue = utils_1.isUndefined(modelValue) ? value : modelValue;
        // Update the state.
        const elementState = setElementState(element, modelValue);
        debug_set('update', element.name, element.path, element.virtual, elementState);
        // Update the model value.
        await setElementModel(element, modelValue);
    }
    /**
     * Attaches blur/change events for element.
     *
     * @param element the element to attach events for.
     */
    function attachEvents(element) {
        let events = [];
        // Attach event to prevent enter key 
        // submissions for input like types
        // such as textarea, text, select etc.
        // some duplication here need to sort
        // through this.
        if (utils_1.isPreventEnter(element.type) || element.tagName === 'INPUT') {
            const handleEnter = (e) => {
                // @ts-ignore
                if (e.key === 'Enter')
                    return e.preventDefault();
            };
            utils_1.addListener(element, 'keypress', handleEnter);
            events = [...events, ['keypress', handleEnter]];
        }
        if (!element.enableBlurEvents && !element.enableChangeEvents)
            return events;
        const handleBlur = async (e) => {
            await updateStateAndModel(element);
            debug_event(element.name, element.value);
            if (isValidateBlur(element)) {
                await utils_1.me(element.validate());
            }
        };
        const handleChange = async (e) => {
            await updateStateAndModel(element);
            debug_event(element.name, element.value);
            if (isValidateChange(element)) {
                await utils_1.me(element.validate());
            }
        };
        // Attach blur
        if (element.enableBlurEvents) {
            utils_1.addListener(element, 'blur', handleBlur);
            events = [...events, ['blur', handleBlur]];
        }
        // Attach change.
        if (element.enableChangeEvents) {
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
     * @param shouldRender used to suppress unnecessary renders when validating multiple.
     */
    async function validateElementModel(element, value, shouldRender = true) {
        if (!isValidatable())
            return Promise.resolve(value);
        const { err, data } = await utils_1.me(validateModelAt(element));
        if (err) {
            setError(element.name, err[element.name]);
            if (shouldRender)
                render('validate:invalid');
            return Promise.reject(err);
        }
        // Model is valid remove all errors.
        removeError(element.name);
        // Render and update view.
        if (shouldRender)
            render('validate:valid');
        return Promise.resolve(data);
    }
    /**
     * Triggers validation for element model and also any additional elements.
     *
     * @param element the primary element triggering validate.
     * @param value the value to return if valid.
     * @param additional additional elements to trigger validation on.
     */
    async function validateElementModels(element, value, additional) {
        if (!isValidatable())
            return Promise.resolve(value);
        if (!additional || !additional.length)
            return validateElementModel(element, value);
        const createPromise = (el) => {
            return validateElementModel(el, el.value, false);
        };
        additional.unshift(element);
        const promises = additional.map(el => createPromise);
        return Promise.all(promises).finally(() => render('validate:multiple'));
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
            await updateStateAndModel(element, value, modelValue);
            if (!validate) {
                render('update:novalidate');
                return;
            }
            const additional = utils_1.isArray(validate) ? validate.map(v => getElement(v)) : undefined;
            // await me(validateElementModels(element, value, additional));
            await utils_1.me(validateElementModels(element, value, additional));
        };
        element.validate = async () => {
            const currentValue = getModel(element.path);
            return validateElementModel(element, currentValue);
        };
        // Reset the element to initial values.
        element.reset = () => {
            setElementDefault(element);
        };
        element.reinit = () => {
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
            const initVal = element.initValue(model.current);
            const initChecked = element.initChecked(model.current);
            element.defaultValue = element.defaultValuePersist =
                initVal || element.value || modelVal || '';
            element.defaultChecked = element.defaultCheckedPersist =
                initChecked || element.checked || modelVal === element.value;
        }
        else if (utils_1.isCheckbox(element.type)) {
            const initVal = element.initValue(model.current);
            // const initChecked = element.initChecked(model.current);
            element.defaultValue = element.defaultValuePersist =
                initVal || element.checked || modelVal;
            element.defaultChecked = element.defaultCheckedPersist = element.defaultValue;
        }
        else if (element.multiple) {
            const initVal = element.initValue(model.current);
            let arr = element.defaultValue = initVal || element.value || modelVal || [];
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
            const initVal = element.initValue(model.current);
            element.defaultValue = element.defaultValuePersist =
                initVal || element.value || modelVal || '';
        }
    }
    /**
     * Normalizes the element merging user options with element options/config.
     *
     * @param element the element to be normalized.
     * @param options user provided options to initialize with.
     */
    function normalizeElement(element, options) {
        options = { ...REGISTER_DEFAULTS, ...options };
        if (element.virtual && (element.path || options.path)) {
            // tslint:disable-next-line: no-console
            console.error(`Virtual element "${element.name}" cannot contain a model path, please specify  defaultValue or defaultChecked.`);
            return null;
        }
        element.path = options.path || element.name;
        if (options) {
            // Check these manually rather than use a merge lib
            // otherwise we end up clobbering the element.
            if (!utils_1.isUndefined(options.defaultValue) && !utils_1.isFunction(options.defaultValue))
                options.defaultValue = utils_1.noop(options.defaultValue);
            if (!utils_1.isUndefined(options.defaultChecked) && !utils_1.isFunction(options.defaultChecked))
                options.defaultChecked = utils_1.noop(options.defaultChecked);
            element.initValue = options.defaultValue;
            element.initChecked = options.defaultChecked;
            element.validateChange = options.validateChange;
            element.validateBlur = options.validateBlur;
            element.enableNativeValidation = options.enableNativeValidation;
            element.enableChangeEvents = options.enableChangeEvents;
            element.enableBlurEvents = options.enableBlurEvents;
            // NOTE: Above options can only be set by custom options object
            //       hence ther is no need to check the element's value.
            if (options.required)
                element.required = options.required || element.required;
            if (options.min)
                element.min = options.min || element.min;
            if (options.max)
                element.max = options.max || element.max;
            if (options.pattern)
                element.pattern = options.pattern || element.pattern;
            if (options.minLength)
                element.minLength = options.minLength || element.minLength;
            if (options.maxLength)
                element.maxLength = options.maxLength || element.maxLength;
        }
        // Treat virtuals as simple text fields only.
        // cannot be radios, checkboxes etc.
        // they also cannot auto update the model.
        if (element.virtual) {
            element.type = 'text';
            element.multiple = false;
            element.enableBlurEvents = false;
            element.enableChangeEvents = false;
        }
        element.initValue = element.initValue || utils_1.noop();
        element.initChecked = element.initChecked || utils_1.noop();
        return element;
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
            return null;
        }
        // Normalizes the element and defaults for use with Komo.
        initDefaults(element);
        if (!rebind) {
            const allowNative = !utils_1.isUndefined(element.enableNativeValidation) ?
                element.enableNativeValidation : komoOptions.validateNative;
            if (allowNative && !utils_1.isFunction(komoOptions.validationSchema))
                schemaAst.current = validate_1.parseNativeValidators(element, schemaAst.current);
        }
        // Set the Initial Value.
        const value = setElementDefault(element);
        // Set the default model value.
        setDefault(element.path, value);
        // Attach/extend element with events.
        extendEvents(element, rebind);
        if (!rebind) {
            // Add to current field to the collection.
            fields.current.add(element);
        }
        return element;
    }
    function registerElement(elementOrOptions, options) {
        if (utils_1.isNullOrUndefined(elementOrOptions))
            return;
        // No element just config return callback to get element.
        if (!utils_1.isElementOrVirtual(elementOrOptions)) {
            if (!utils_1.isString(elementOrOptions)) {
                options = elementOrOptions;
                elementOrOptions = undefined;
            }
            options = options || {};
            return (element) => {
                // Extend element with options.
                let _element = element;
                if (_element && options.bindTo) {
                    if (!_element[options.bindTo]) {
                        // tslint:disable-next-line
                        console.warn(`Cannot bindTo unknown property or element ${options.bindTo}.`);
                        return;
                    }
                    // Bind to custom inner element.
                    _element = _element[options.bindTo];
                }
                // TODO: rethink how this works
                if (_element)
                    // @ts-ignore
                    _element.__hooked = options.__hooked__;
                if (!_element || isRegistered(_element))
                    return;
                const normalized = normalizeElement(_element, options);
                if (!normalized)
                    return;
                if (_element.virtual)
                    debug_register('virtual', _element.name, _element.path, _element.virtual);
                else
                    debug_register('custom', _element.name, _element.path);
                return bindElement(_element);
            };
        }
        if (!elementOrOptions || isRegistered(elementOrOptions))
            return;
        debug_register(elementOrOptions.name);
        if (!normalizeElement(elementOrOptions, elementOrOptions))
            return null;
        // ONLY element was passed.
        return bindElement(elementOrOptions);
    }
    return registerElement;
}
exports.initElement = initElement;
//# sourceMappingURL=register.js.map