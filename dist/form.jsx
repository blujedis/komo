"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const register_1 = require("./register");
const dot_prop_1 = require("dot-prop");
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
// export function initForm<T extends IModel>(options: IOptions<T>) {
function initForm(options) {
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
    const findField = (namePathOrElement) => {
        if (typeof namePathOrElement === 'object')
            return namePathOrElement;
        return [...fields.current.values()].find(e => e.name === namePathOrElement || e.path === namePathOrElement);
    };
    const initSchema = () => {
        let schema;
        if (schemaAst.current)
            options.validationSchema = validate_1.astToSchema(schemaAst.current, options.validationSchema);
        // Create the validator.
        validator.current = validate_1.normalizeValidator(options.validationSchema, findField);
        schema = options.validationSchema;
        return schema;
    };
    // MODEL //
    const getDefault = (path) => {
        if (!path)
            return defaults.current;
        return dot_prop_1.get(defaults.current, path);
    };
    const setDefault = (pathOrModel, value) => {
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
    const getModel = (path) => {
        if (!path)
            return model.current;
        return dot_prop_1.get(model.current, path);
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
    const isTouched = (name) => {
        if (name)
            return touched.current.has(name);
        return !!touched.current.size;
    };
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
    const isDirty = (name) => {
        if (name)
            return dirty.current.has(name);
        return !!dirty.current.size;
    };
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
        render('seterror');
        return errors.current;
    }, [options.validationSchema]);
    const removeError = (name) => {
        setError(name, undefined); // this just causes a render to trigger.
        const clone = { ...errors.current };
        delete clone[name];
        errors.current = clone;
        return true;
    };
    const clearError = () => {
        errors.current = {};
    };
    const isError = (name) => {
        if (name)
            return !dot_prop_1.has(errors, name);
        return !Object.entries(errors).length;
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
            findField(nameOrElement) : nameOrElement;
        if (!element) {
            log.error(`validateModelAt failed using missing or unknown element.`);
            return;
        }
        const currentValue = getModel(element.path);
        if (!_validator)
            return Promise.resolve(currentValue);
        opts = { abortEarly: false, ...opts };
        if (utils_1.isFunction(options.validationSchema))
            return _validator.validateAt(element.path, model.current);
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
            element = findField(nameOrElement);
        return utils_1.isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
    };
    const isValidateBlur = (nameOrElement) => {
        let element = nameOrElement;
        if (utils_1.isString(nameOrElement))
            element = findField(nameOrElement);
        return utils_1.isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
    };
    const unregister = react_1.useCallback((element) => {
        // Nothing to unregister.
        if (!fields.current.size)
            return;
        // If string find the element in fields.
        const _element = typeof element === 'string' ?
            findField(element) :
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
        get isSubmitting() {
            return submitting.current;
        },
        get isSubmitted() {
            return submitted.current;
        },
        get submitCount() {
            return submitCount.current;
        },
        get isValid() {
            return isError();
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
        findField,
        initSchema,
        // Form
        mounted,
        state,
        // Model
        model,
        getDefault,
        setDefault,
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
        isError,
        submitCount,
        submitting,
        submitted
    };
    return api;
}
exports.initForm = initForm;
/**
 * Use form hook exposes Komo form hook API.
 *
 * @param options form api options.
 */
function useForm(options) {
    const _options = { ...DEFAULTS, ...options };
    // Check if schema is object or ObjectSchema,
    // if yes get the defaults.
    if (typeof options.validationSchema === 'object') {
        const schema = options.validationSchema;
        const _defaults = schema._nodes ? schema.cast() : schema;
        _options.model = { ..._defaults };
    }
    if (_options.defaults)
        _options.model = { ..._options.defaults, ..._options.model };
    const base = initForm(_options);
    const { options: formOptions, log, defaults, render, clearDirty, clearTouched, clearError, setModel, fields, submitCount, submitting, submitted, validateModel, getModel, isValidatable, errors, setError, unregister, mounted, initSchema, model } = base;
    react_1.useEffect(() => {
        mounted.current = true;
        initSchema();
        // validate form before touched.
        if (options.validateInit) {
            validateModel()
                .catch(err => {
                if (err)
                    setError(err);
            });
        }
        return () => {
            mounted.current = false;
            [...fields.current.values()].forEach(e => {
                unregister(e);
            });
        };
    }, [unregister]);
    const reset = react_1.useCallback((values = {}) => {
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
    }, []);
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
    const handleReset = react_1.useCallback(_handleReset, []);
    const handleSubmit = react_1.useCallback((handler) => {
        if (!handler) {
            // Submit called but no handler!!
            log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
            return;
        }
        const handleCallback = (m, e, ev) => {
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
            clearError();
            // Can't validate or is disabled.
            if (!isValidatable() || !formOptions.validateSubmit) {
                await handleCallback(model, {}, event);
                return;
            }
            const { err } = await utils_1.me(validateModel(_model));
            if (err)
                setError(err);
            await handleCallback(_model, err, event);
        };
    }, []);
    return {
        // Elements
        register: react_1.useCallback(register_1.initElement(base), []),
        unregister: base.unregister,
        // Form
        state: base.state,
        reset,
        handleReset,
        handleSubmit,
        // Model
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
        clearError: base.clearError,
    };
}
exports.default = useForm;
//# sourceMappingURL=form.jsx.map