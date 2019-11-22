"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const register_1 = require("./register");
const lodash_get_1 = __importDefault(require("lodash.get"));
const lodash_set_1 = __importDefault(require("lodash.set"));
const lodash_has_1 = __importDefault(require("lodash.has"));
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
    validationSchemaPurge: true,
    validateNative: false,
    cleanVanities: false
};
const { debug_api, debug_init } = utils_1.debuggers;
function initApi(options) {
    const defaults = react_1.useRef({});
    const defaultKeys = react_1.useRef([]);
    const model = react_1.useRef({});
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
    const [currentStatus, renderStatus] = react_1.useState({ status: 'init' });
    let state = {};
    let api = {};
    // HELPERS //
    const render = (status) => {
        renderStatus({ ...currentStatus, status });
        debug_api('rendered', status);
    };
    function _getElement(namePathOrElement, asGroup = false) {
        if (utils_1.isObject(namePathOrElement))
            return namePathOrElement;
        const filtered = [...fields.current.values()]
            .filter(e => e.name === namePathOrElement || e.path === namePathOrElement);
        if (asGroup)
            return filtered;
        return filtered[0];
    }
    const getElement = react_1.useCallback(_getElement, [fields]);
    const getRegistered = react_1.useCallback((asPath = false) => {
        return [...fields.current.values()].map(f => asPath ? f.path : f.name);
    }, [fields]);
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
        return lodash_get_1.default(defaults.current, path);
    };
    const setDefault = (pathOrModel, value) => {
        if (!pathOrModel) {
            // tslint:disable-next-line: no-console
            console.error(`Cannot set default value using key or model of undefined.`);
            return;
        }
        let current = { ...defaults.current };
        if (utils_1.isString(pathOrModel)) {
            if (value === '')
                value = undefined;
            lodash_set_1.default(current, pathOrModel, value);
            defaults.current = current;
        }
        else {
            if (value)
                current = { ...current, ...pathOrModel };
            else
                current = pathOrModel;
            defaults.current = current;
        }
    };
    const syncDefaults = (defs) => {
        defaults.current = utils_1.merge({ ...defaults.current }, { ...defs });
        model.current = utils_1.merge({ ...defs }, { ...model.current });
        const keys = Object.keys(defs);
        defaultKeys.current = keys;
        // Iterate bound elements and update default values.
        [...fields.current.values()].forEach(element => {
            if (keys.includes(element.name) && element.virtual)
                // tslint:disable-next-line: no-console
                console.error(`Attempted to set bound property "${element.name}" as vanity, try useField('${element.name}') NOT useField('${element.name}', true).`);
            element.reinit();
        });
    };
    const setModel = react_1.useCallback((pathOrModel, value) => {
        if (!pathOrModel) {
            // tslint:disable-next-line: no-console
            console.error(`Cannot set default value using key or model of undefined.`);
            return;
        }
        let current = { ...model.current };
        if (utils_1.isString(pathOrModel)) {
            if (value === '')
                value = undefined;
            lodash_set_1.default(current, pathOrModel, value);
            model.current = current;
        }
        else {
            if (value)
                current = { ...current, ...pathOrModel };
            else
                current = pathOrModel;
            model.current = current;
        }
    }, [defaults, model]);
    const hasModel = (path) => {
        return lodash_has_1.default(model.current, path);
    };
    const vanities = () => {
        return Object.keys(model.current).filter(k => !defaultKeys.current.includes(k));
    };
    const cleanModel = (model) => {
        const _model = {};
        for (const k in model) {
            if (!model.hasOwnProperty(k) || !defaultKeys.current.includes(k))
                continue;
            _model[k] = model[k];
        }
        return _model;
    };
    const getModel = (path, clean = false) => {
        if (typeof path === 'boolean') {
            clean = true;
            path = undefined;
        }
        if (!path) {
            if (clean)
                return cleanModel(model.current);
            return model.current;
        }
        return lodash_get_1.default(model.current, path);
    };
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
    const prepareCompare = (value) => {
        if (utils_1.isArray(value))
            value.sort();
        if (utils_1.isPlainObject(value)) {
            value = Object.keys(value).sort().reduce((a, c) => {
                a[c] = value[c];
                return a;
            }, {});
        }
        return String(value);
    };
    // If not compare value the model value is used.
    const isDirtyCompared = (name, value, compareValue) => {
        const element = getElement(name);
        const modelValue = getModel(element.path);
        compareValue = utils_1.toDefault(compareValue, modelValue);
        value = prepareCompare(value);
        compareValue = prepareCompare(compareValue);
        return !utils_1.isEqual(value, compareValue);
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
        render('error:set');
        debug_api('seterror', errors.current);
        return errors.current;
    }, [options.validationSchema]);
    const removeError = react_1.useCallback((name) => {
        const exists = errors.current.hasOwnProperty(name);
        // causes a render to trigger then we set below.
        setError(name, undefined);
        const errs = {};
        for (const k in errors.current) {
            // if (typeof errors.current[k] !== 'undefined' || k !== name)
            if (!utils_1.isUndefined(errors.current[k]) || k !== name)
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
        opts = { ...opts, ...{ strict: false, abortEarly: false } };
        return _validator.validate(model.current, opts);
    }, [options.validationSchema, setError]);
    const validateModelAt = react_1.useCallback((nameOrElement, opts) => {
        const _validator = validator.current;
        const element = utils_1.isString(nameOrElement) ?
            getElement(nameOrElement) : nameOrElement;
        if (!element) {
            // tslint:disable-next-line: no-console
            console.error(`validateModelAt failed using missing or unknown element.`);
            return;
        }
        const currentValue = getModel(element.path);
        if (!_validator)
            return Promise.resolve(currentValue);
        opts = { ...opts, ...{ strict: false, abortEarly: false } };
        return _validator.validateAt(element.path, model.current);
    }, [options.validationSchema, setError]);
    const isValidatable = () => validate_1.isYupSchema(options.validationSchema) || utils_1.isFunction(options.validationSchema);
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
        const _element = utils_1.isString(element) ?
            getElement(element) :
            element;
        if (!_element) {
            // tslint:disable-next-line: no-console
            console.warn(`Failed to unregister element of undefined.`);
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
    state = {
        get model() {
            return model.current;
        },
        get mounted() {
            return !!mounted.current;
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
        get vanities() {
            return vanities();
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
    api = {
        // Common
        options,
        defaults,
        fields,
        unregister,
        schemaAst,
        render,
        getElement,
        getRegistered,
        initSchema,
        // Form
        mounted,
        state,
        // Model
        model,
        getDefault,
        setDefault,
        syncDefaults,
        hasModel,
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
        isDirtyCompared,
        // Vanity
        // getVanity,
        // setVanity,
        // removeVanity,
        // clearVanity,
        // Errors,
        errors,
        setError,
        removeError,
        clearError,
        submitCount, submitting,
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
    const base = initApi(options);
    const { options: formOptions, defaults, render, clearDirty, clearTouched, clearError, setModel, fields, submitCount, submitting, submitted, validateModel, syncDefaults, state, hasModel, isValidatable, errors, setError, unregister, mounted, initSchema, model, getRegistered, getModel } = base;
    react_1.useEffect(() => {
        const init = async () => {
            if (mounted.current)
                return;
            debug_init('mount:fields', getRegistered());
            debug_init('mount:schema', options.validationSchema);
            const { err, data } = await utils_1.me(options.defaults);
            debug_init('mount:defaults', data);
            if (err && utils_1.isPlainObject(err))
                debug_init('err', err);
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
                }).finally(() => {
                    mounted.current = true;
                    render('form:effect:validate'); // this may not be needed.
                });
            }
            else {
                mounted.current = true;
                render('form:effect');
            }
        };
        init();
        return () => {
            mounted.current = false;
            [...fields.current.values()].forEach(e => {
                unregister(e);
            });
        };
    }, []);
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
        render('form:reset');
    }
    function _handleReset(valuesOrEvent) {
        const handleCallback = async (event, values) => {
            if (event) {
                event.preventDefault();
                event.persist();
            }
            await reset(values);
        };
        if (utils_1.isFunction(valuesOrEvent))
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
            // tslint:disable-next-line: no-console
            console.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
            return;
        }
        const handleCallback = (_model, _errors, _event) => {
            const errorKeys = Object.keys(errors.current);
            if (errorKeys.length && formOptions.validateSubmitExit) {
                // tslint:disable-next-line: no-console
                console.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
                return;
            }
            submitting.current = false;
            submitted.current = true;
            submitCount.current = submitCount.current + 1;
            errors.current = _errors || errors.current;
            render('form:submit');
            handler(_model, _errors || {}, _event);
        };
        return async (event) => {
            submitting.current = true;
            if (event) {
                event.preventDefault();
                event.persist();
            }
            // Clean properties not defined in
            // original model.
            const _model = formOptions.cleanVanities ? getModel(true) : model.current;
            // Can't validate or is disabled.
            if (!isValidatable() || !formOptions.validateSubmit) {
                await handleCallback(_model, {}, event);
                return;
            }
            clearError();
            const { err } = await utils_1.me(validateModel());
            if (err)
                setError(err);
            await handleCallback(_model, err, event);
        };
    }
    const reset = _resetForm;
    const handleReset = _handleReset;
    const handleSubmit = _handleSubmit;
    const api = {
        // Elements
        register: register_1.initElement(base),
        //unregister: base.unregister,
        // Form
        render,
        reset,
        handleReset,
        handleSubmit,
        state,
        // Model
        getDefault: base.getDefault,
        getElement: base.getElement,
        hasModel,
        getModel: base.getModel,
        setModel: base.setModel,
        validateModel: base.validateModel,
        validateModelAt: base.validateModelAt,
        isTouched: base.isTouched,
        isDirty: base.isDirty,
        setError: base.setError,
        removeError: base.removeError,
        clearError: base.clearError
    };
    return api;
}
/**
 * Initializes Komo.
 *
 * @param options the komo options.
 */
function initKomo(options) {
    options = { ...DEFAULTS, ...options };
    const normalizeYup = validate_1.parseYupDefaults(options.validationSchema, options.validationSchemaPurge);
    options.validationSchema = normalizeYup.schema;
    options.defaults = validate_1.promisifyDefaults(options.defaults, normalizeYup.defaults);
    options.castHandler = validate_1.normalizeCasting(options.castHandler);
    const api = initForm(options);
    // Override setModel so exposed method
    // causes render.
    const { render, setModel } = api;
    api.setModel = (pathOrModel, value) => { setModel(pathOrModel, value); render(`model:set`); };
    const hooks = hooks_1.initHooks(api);
    const komo = utils_1.extend(api, hooks);
    return komo;
}
exports.initKomo = initKomo;
//# sourceMappingURL=komo.js.map