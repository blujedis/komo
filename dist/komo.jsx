"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const register_1 = require("./register");
const lodash_get_1 = __importDefault(require("lodash.get"));
const lodash_set_1 = __importDefault(require("lodash.set"));
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
    validateNative: false
};
const { debug_api, debug_init } = utils_1.debuggers;
function initApi(options) {
    const defaults = react_1.useRef({});
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
    const [currentStatus, renderStatus] = react_1.useState('init');
    let state = {};
    let api = {};
    // HELPERS //
    const render = (status) => {
        renderStatus(status);
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
    const initSchema = react_1.useCallback(() => {
        let schema;
        if (schemaAst.current)
            options.validationSchema = validate_1.astToSchema(schemaAst.current, options.validationSchema);
        // Create the validator.
        validator.current = validate_1.normalizeValidator(options.validationSchema, getElement);
        schema = options.validationSchema;
        return schema;
    }, [defaults, options.validationSchema]);
    // MODEL //
    const getDefault = (path) => {
        if (!path)
            return defaults.current;
        return lodash_get_1.default(defaults.current, path);
    };
    const setDefault = react_1.useCallback((pathOrModel, value) => {
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
    }, []);
    const syncDefaults = react_1.useCallback((defs) => {
        defaults.current = utils_1.merge({ ...defaults.current }, { ...defs });
        model.current = utils_1.merge({ ...defs }, { ...model.current });
        // Iterate bound elements and update default values.
        [...fields.current.values()].forEach(element => {
            element.reinit();
        });
    }, []);
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
    const getModel = (path) => {
        if (!path)
            return model.current;
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
    const isDirtyCompared = (name, value, defaultValue) => {
        const element = getElement(name);
        value = utils_1.toDefault(value, element.value);
        defaultValue = utils_1.toDefault(defaultValue, getModel(element.path));
        // Probably need to look further into this
        // ensure common and edge cases are covered.
        // NOTE: we check array here as value could
        // be multiple option group in some cases.
        return utils_1.isArray(defaultValue)
            ? !utils_1.isEqual(defaultValue, value)
            : !utils_1.isEqual(defaultValue + '', value + '');
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
        // if a virtual check the name it's mapped to.
        if (element.virtual)
            element = getElement(element.virtual);
        return utils_1.isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
    };
    const isValidateBlur = (nameOrElement) => {
        let element = nameOrElement;
        if (utils_1.isString(nameOrElement))
            element = getElement(nameOrElement);
        if (element.virtual)
            element = getElement(element.virtual);
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
    const { options: formOptions, defaults, render, clearDirty, clearTouched, clearError, setModel, fields, submitCount, submitting, submitted, validateModel, getModel, syncDefaults, state, isValidatable, errors, setError, unregister, mounted, initSchema, model, getRegistered } = base;
    react_1.useEffect(() => {
        const init = async () => {
            if (mounted.current)
                return;
            debug_init('fields', getRegistered());
            debug_init('schema', options.validationSchema);
            const { err, data } = await utils_1.me(options.defaults);
            debug_init('defaults', data);
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
        const handleCallback = (m, e, ev) => {
            const errorKeys = Object.keys(errors.current);
            if (errorKeys.length && formOptions.validateSubmitExit) {
                // tslint:disable-next-line: no-console
                console.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
                return;
            }
            submitting.current = false;
            submitted.current = true;
            submitCount.current = submitCount.current + 1;
            errors.current = e || errors.current;
            render('form:submit');
            handler(m, e || {}, ev);
        };
        return async (event) => {
            submitting.current = true;
            if (event) {
                event.preventDefault();
                event.persist();
            }
            // Can't validate or is disabled.
            if (!isValidatable() || !formOptions.validateSubmit) {
                await handleCallback(model.current, {}, event);
                return;
            }
            clearError();
            const { err } = await utils_1.me(validateModel());
            if (err)
                setError(err);
            await handleCallback(model.current, err, event);
        };
    }
    const reset = react_1.useCallback(_resetForm, []);
    const handleReset = react_1.useCallback(_handleReset, []);
    const handleSubmit = react_1.useCallback(_handleSubmit, []);
    const api = {
        // Elements
        register: react_1.useCallback(register_1.initElement(base), []),
        unregister: base.unregister,
        // Form
        render,
        reset,
        handleReset,
        handleSubmit,
        state,
        // Model
        getDefault: base.getDefault,
        getElement: base.getElement,
        getModel: base.getModel,
        setModel: base.setModel,
        validateModel: base.validateModel,
        validateModelAt: base.validateModelAt,
        setTouched: base.setTouched,
        removeTouched: base.removeTouched,
        clearTouched: base.clearTouched,
        isTouched: base.isTouched,
        setDirty: base.setDirty,
        removeDirty: base.removeDirty,
        clearDirty: base.clearDirty,
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