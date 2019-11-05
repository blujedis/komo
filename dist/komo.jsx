"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const register_1 = require("./register");
const dot_prop_1 = require("dot-prop");
const hooks_1 = require("./hooks");
const utils_1 = require("./utils");
const validate_1 = require("./validate");
/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */
const DEFAULTS = {
    defaults: {},
    validateSubmit: true,
    validateBlur: true,
    validateChange: false,
    validateInit: false,
    enableNativeValidation: false,
    enableWarnings: true
};
function initApi(options) {
    const defaults = react_1.useRef({ ...options.model });
    const model = react_1.useRef({ ...options.model });
    const fields = react_1.useRef(new Set());
    const touched = react_1.useRef(new Set());
    const dirty = react_1.useRef(new Set());
    const errors = react_1.useRef({});
    const validator = react_1.useRef();
    const schemaAst = react_1.useRef();
    const mounted = react_1.useRef(false);
    const submitCount = react_1.useRef(0);
    const submitting = react_1.useRef(false);
    const submitted = react_1.useRef(false);
    const [getStatus, renderStatus] = react_1.useState({ status: 'init' });
    // HELPERS //
    const log = utils_1.createLogger(options.enableWarnings ? 'info' : 'error');
    const render = (status) => {
        if (!status)
            return getStatus.status;
        renderStatus({ status });
    };
    const getElement = (namePathOrElement) => {
        if (typeof namePathOrElement === 'object')
            return namePathOrElement;
        return [...fields.current.values()].find(e => e.name === namePathOrElement || e.path === namePathOrElement);
    };
    const initSchema = () => {
        let schema;
        if (schemaAst.current)
            options.validationSchema = validate_1.astToSchema(schemaAst.current, options.validationSchema);
        // Create the validator.
        validator.current = validate_1.normalizeValidator(options.validationSchema, getElement);
        schema = options.validationSchema;
        return schema;
    };
    // MODEL //
    const getDefault = (path) => {
        if (!path)
            return defaults.current;
        return dot_prop_1.get(defaults.current, path);
    };
    const setDefault = react_1.useCallback((pathOrModel, value) => {
        if (!pathOrModel) {
            log.error(`Cannot set default value using key or model of undefined.`);
            return;
        }
        let current = { ...defaults.current };
        if (utils_1.isString(pathOrModel)) {
            if (value === '')
                value = undefined;
            dot_prop_1.set(current, pathOrModel, value);
            defaults.current = current;
        }
        else {
            if (value)
                current = { ...current, ...pathOrModel };
            else
                current = pathOrModel;
            defaults.current = current;
        }
    }, []);
    const syncDefaults = (defs) => {
        defaults.current = utils_1.merge({ ...defaults.current }, { ...defs });
        model.current = utils_1.merge({ ...defs }, { ...model.current });
        // Iterate bound elements and update default values.
        [...fields.current.values()].forEach(element => {
            element.rebind();
        });
    };
    const setModel = react_1.useCallback((pathOrModel, value) => {
        if (!pathOrModel) {
            log.error(`Cannot set default value using key or model of undefined.`);
            return;
        }
        let current = { ...model.current };
        if (utils_1.isString(pathOrModel)) {
            if (value === '')
                value = undefined;
            dot_prop_1.set(current, pathOrModel, value);
            model.current = current;
        }
        else {
            if (value)
                current = { ...current, ...pathOrModel };
            else
                current = pathOrModel;
            model.current = current;
        }
    }, []);
    const getModel = react_1.useCallback((path) => {
        if (!path)
            return model.current;
        return dot_prop_1.get(model.current, path);
    }, [defaults]);
    // TOUCHED //
    const setTouched = (name) => {
        if (!touched.current.has(name))
            touched.current.add(name);
    };
    const removeTouched = (name) => {
        const removed = touched.current.delete(name);
        return removed;
    };
    const clearTouched = () => {
        touched.current.clear();
    };
    const isTouched = react_1.useCallback((name) => {
        if (name)
            return touched.current.has(name);
        return !!touched.current.size;
    }, []);
    // DIRTY //
    const setDirty = (name) => {
        if (!dirty.current.has(name))
            dirty.current.add(name);
    };
    const removeDirty = (name) => {
        const removed = dirty.current.delete(name);
        return removed;
    };
    const clearDirty = () => {
        dirty.current.clear();
    };
    const isDirty = react_1.useCallback((name) => {
        if (name)
            return dirty.current.has(name);
        return !!dirty.current.size;
    }, []);
    // ERRORS //
    const setError = react_1.useCallback((nameOrErrors, value) => {
        const currentErrors = { ...errors.current };
        if (utils_1.isString(nameOrErrors)) {
            errors.current = { ...currentErrors, [nameOrErrors]: value };
        }
        else {
            if (value) // extend/merge errors.
                errors.current = { ...currentErrors, ...nameOrErrors };
            else
                errors.current = { ...nameOrErrors };
        }
        for (const k in errors.current) {
            if (utils_1.isUndefined(errors.current[k]))
                delete errors.current[k];
        }
        render('seterror');
        return errors.current;
    }, [options.validationSchema]);
    const removeError = react_1.useCallback((name) => {
        const exists = errors.current.hasOwnProperty(name);
        // causes a render to trigger then we set below.
        // saves us a render actually.
        setError(name, undefined);
        const errs = {};
        for (const k in errors.current) {
            if (typeof errors.current[k] !== 'undefined' || k !== name)
                errs[k] = errors.current[k];
        }
        errors.current = errs;
        // Just so we know if something actually deleted.
        if (exists)
            return true;
        return false;
    }, [options.validationSchema, setError]);
    const clearError = () => {
        errors.current = {};
    };
    // VALIDATION //
    const validateModel = react_1.useCallback((opts) => {
        const _validator = validator.current;
        if (!_validator)
            return Promise.resolve(model.current);
        opts = { abortEarly: false, ...opts };
        return _validator.validate(model.current, opts);
    }, [options.validationSchema, setError]);
    const validateModelAt = react_1.useCallback((nameOrElement, opts) => {
        const _validator = validator.current;
        const element = utils_1.isString(nameOrElement) ?
            getElement(nameOrElement) : nameOrElement;
        if (!element) {
            log.error(`validateModelAt failed using missing or unknown element.`);
            return;
        }
        let currentValue = getModel(element.path);
        if (!_validator)
            return Promise.resolve(currentValue);
        opts = { abortEarly: false, ...opts };
        if (utils_1.isFunction(options.validationSchema))
            return _validator.validateAt(element.path, model.current);
        currentValue = currentValue === '' ? undefined : currentValue;
        return _validator.validateAt(element.path, currentValue, opts);
    }, [options.validationSchema, setError]);
    const isValidatable = () => {
        return (typeof options.validationSchema === 'object' &&
            typeof options.validationSchema._nodes) !== 'undefined' ||
            typeof options.validationSchema === 'function';
    };
    const isValidateChange = (nameOrElement) => {
        let element = nameOrElement;
        if (utils_1.isString(nameOrElement))
            element = getElement(nameOrElement);
        return utils_1.isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
    };
    const isValidateBlur = (nameOrElement) => {
        let element = nameOrElement;
        if (utils_1.isString(nameOrElement))
            element = getElement(nameOrElement);
        return utils_1.isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
    };
    const unregister = react_1.useCallback((element) => {
        // Nothing to unregister.
        if (!fields.current.size)
            return;
        // If string find the element in fields.
        const _element = typeof element === 'string' ?
            getElement(element) :
            element;
        if (!_element) {
            log.warn(`Failed to unregister element of undefined.`);
            return;
        }
        // Remove any flags/errors that are stored.
        removeDirty(_element.name);
        removeTouched(_element.name);
        removeError(_element.name);
        // Unbind any listener events.
        _element.unbind();
        // Delete the element from fields collection.
        fields.current.delete(_element);
    }, []);
    const state = {
        get model() {
            return model.current;
        },
        get isMounted() {
            return mounted.current;
        },
        get errors() {
            return errors.current;
        },
        get touched() {
            return [...touched.current.keys()];
        },
        get dirty() {
            return [...dirty.current.keys()];
        },
        get valid() {
            return !Object.entries(errors.current).length;
        },
        get invalid() {
            return !!Object.entries(errors.current).length;
        },
        get isSubmitting() {
            return submitting.current;
        },
        get isSubmitted() {
            return submitted.current;
        },
        get submitCount() {
            return submitCount.current;
        },
        get isDirty() {
            return isDirty();
        },
        get isTouched() {
            return isTouched();
        }
    };
    const api = {
        // Common
        options,
        log,
        defaults,
        fields,
        unregister,
        schemaAst,
        render,
        getElement,
        initSchema,
        // Form
        mounted,
        state,
        // Model
        model,
        getDefault,
        setDefault,
        syncDefaults,
        getModel,
        setModel,
        validator: validator.current,
        validateModel,
        validateModelAt,
        isValidatable,
        isValidateBlur,
        isValidateChange,
        // Touched
        setTouched,
        removeTouched,
        clearTouched,
        isTouched,
        // Dirty
        setDirty,
        removeDirty,
        clearDirty,
        isDirty,
        // Errors,
        errors,
        setError,
        removeError,
        clearError,
        submitCount,
        submitting,
        submitted
    };
    return api;
}
/**
 * Use form hook exposes Komo form hook API.
 *
 * @param options form api options.
 */
function initForm(options) {
    const _options = { ...DEFAULTS, ...options };
    const base = initApi(_options);
    const { options: formOptions, log, defaults, render, clearDirty, clearTouched, clearError, setModel, fields, submitCount, submitting, submitted, validateModel, getModel, syncDefaults, isValidatable, errors, setError, unregister, mounted, initSchema, model } = base;
    react_1.useEffect(() => {
        // May need to update model defaults
        // again from user here.
        mounted.current = true;
        const init = async () => {
            const normalized = validate_1.normalizeDefaults(options.defaults, options.validationSchema);
            const { err, data } = await utils_1.me(normalized);
            // Err and data both 
            syncDefaults({ ...err, ...data });
            // Init normalize the validation schema.
            initSchema();
            // validate form before touched.
            if (options.validateInit) {
                validateModel()
                    .catch(valErr => {
                    if (valErr)
                        setError(valErr);
                });
            }
        };
        init();
        return () => {
            mounted.current = false;
            [...fields.current.values()].forEach(e => {
                unregister(e);
            });
        };
    }, [unregister]);
    /**
     * Manually resets model, dirty touched and clears errors.
     *
     * @param values new values to reset form with.
     */
    function _resetForm(values = {}) {
        // Reset all states.
        setModel({ ...defaults.current, ...values });
        clearDirty();
        clearTouched();
        clearError();
        // Reset all fields.
        [...fields.current.values()].forEach(e => {
            e.reset();
        });
        submitCount.current = 0;
        submitting.current = false;
        submitted.current = false;
        // Rerender the form
        render('reset');
    }
    function _handleReset(valuesOrEvent) {
        const handleCallback = async (event, values) => {
            if (event) {
                event.preventDefault();
                event.persist();
            }
            await reset(values);
        };
        if (typeof valuesOrEvent === 'function')
            return (event) => {
                return handleCallback(event, valuesOrEvent);
            };
        return handleCallback(valuesOrEvent);
    }
    /**
     * Handles form submission.
     *
     * @param handler submit handler function.
     */
    function _handleSubmit(handler) {
        if (!handler) {
            // Submit called but no handler!!
            log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
            return;
        }
        const handleCallback = (m, e, ev) => {
            const errorKeys = Object.keys(errors.current);
            if (errorKeys.length && formOptions.validateSubmitExit) {
                log.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
                return;
            }
            submitting.current = false;
            submitted.current = true;
            submitCount.current = submitCount.current + 1;
            errors.current = e || errors.current;
            render('submit');
            handler(m, e || {}, ev);
        };
        return async (event) => {
            submitting.current = true;
            if (event) {
                event.preventDefault();
                event.persist();
            }
            const _model = getModel();
            // Can't validate or is disabled.
            if (!isValidatable() || !formOptions.validateSubmit) {
                await handleCallback(model, {}, event);
                return;
            }
            clearError();
            const { err } = await utils_1.me(validateModel(_model));
            if (err)
                setError(err);
            await handleCallback(_model, err, event);
        };
    }
    const reset = react_1.useCallback(_resetForm, []);
    const handleReset = react_1.useCallback(_handleReset, []);
    const handleSubmit = react_1.useCallback(_handleSubmit, []);
    return {
        // Elements
        register: react_1.useCallback(register_1.initElement(base), []),
        unregister: base.unregister,
        // Form
        render,
        state: base.state,
        reset,
        handleReset,
        handleSubmit,
        // Model
        getElement: base.getElement,
        getModel: base.getModel,
        setModel: base.setModel,
        validateModel: base.validateModel,
        validateModelAt: base.validateModelAt,
        setTouched: base.setTouched,
        removeTouched: base.removeTouched,
        clearTouched: base.clearTouched,
        setDirty: base.setDirty,
        removeDirty: base.removeDirty,
        clearDirty: base.clearDirty,
        setError: base.setError,
        removeError: base.removeError,
        clearError: base.clearError
    };
}
exports.initForm = initForm;
/**
 * Initializes Komo.
 *
 * @param options the komo options.
 */
function initKomo(options) {
    const api = initForm(options);
    function initWithKomo(handler) {
        return handler(api);
    }
    api.withKomo = initWithKomo;
    const hooks = hooks_1.initHooks(api);
    const komo = utils_1.extend(api, hooks);
    return komo;
}
exports.initKomo = initKomo;
//# sourceMappingURL=komo.jsx.map