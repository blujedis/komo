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
    model: {},
    validateSubmit: true,
    validateBlur: true,
    validateChange: true
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
    react_1.useEffect(() => {
        mounted.current = true;
        initSchema();
        return () => {
            mounted.current = false;
            [...fields.current.values()].forEach(e => unref);
        };
    }, []);
    const log = utils_1.createLogger(options.enableWarnings ? 'info' : 'error');
    function render(status) {
        status = status || Date.now();
        renderStatus({ status });
    }
    function initSchema() {
        let schema;
        if (schemaAst.current)
            options.validationSchema = validate_1.astToSchema(schemaAst.current, options.validationSchema);
        // Create the validator.
        validator.current = validate_1.normalizeValidator(options.validationSchema);
        schema = options.validationSchema;
        return schema;
    }
    function getDefault(path) {
        if (!path)
            return defaults.current;
        return dot_prop_1.get(defaults.current, path);
    }
    function setModel(pathOrModel, value, setDefault = false) {
        if (!pathOrModel) {
            log.error(`Cannot set model using key or model of undefined.`);
            return;
        }
        if (arguments.length >= 2) {
            if (value === '')
                value = undefined;
            model.current = dot_prop_1.set({ ...model.current }, pathOrModel, value);
            if (setDefault)
                defaults.current = dot_prop_1.set({ ...defaults.current }, pathOrModel, value);
        }
        else {
            model.current = { ...model.current, ...pathOrModel };
        }
    }
    function getModel(path) {
        if (!path)
            return model.current;
        return dot_prop_1.get(model.current, path);
    }
    function validateModel(nameOrModel, path, value, opts) {
        const _validator = validator.current;
        if (!_validator) {
            errors.current = {};
            if (typeof nameOrModel === 'string')
                return Promise.resolve(dot_prop_1.get(value, nameOrModel));
            return Promise.resolve(nameOrModel);
        }
        if (typeof nameOrModel === 'object') {
            opts = value;
            value = undefined;
        }
        opts = { abortEarly: false, ...opts };
        if (typeof nameOrModel === 'string') {
            return _validator
                .validateAt(path, value, opts)
                .catch(err => {
                setError(nameOrModel, err);
                return Promise.reject(errors.current);
            });
        }
        return _validator
            .validate(nameOrModel, opts)
            .catch(err => {
            setError(err, typeof nameOrModel === 'string');
            return Promise.reject(errors.current);
        });
    }
    function setTouched(name) {
        if (!touched.current.has(name))
            touched.current.add(name);
    }
    function removeTouched(name) {
        const removed = touched.current.delete(name);
        return removed;
    }
    function clearTouched() {
        touched.current.clear();
    }
    function isTouched(name) {
        if (name)
            return touched.current.has(name);
        return !!touched.current.size;
    }
    function setDirty(name) {
        if (!dirty.current.has(name))
            dirty.current.add(name);
    }
    function removeDirty(name) {
        const removed = dirty.current.delete(name);
        return removed;
    }
    function clearDirty() {
        dirty.current.clear();
    }
    function isDirty(name) {
        if (name)
            return dirty.current.has(name);
        return !!dirty.current.size;
    }
    function setError(nameOrErrors, value) {
        if (utils_1.isString(nameOrErrors))
            errors.current = { ...errors.current, [nameOrErrors]: value };
        else
            errors.current = { ...nameOrErrors };
        render('seterror');
        return errors.current;
    }
    function removeError(name) {
        const clone = { [name]: undefined, ...errors.current };
        errors.current = clone;
    }
    function clearError() {
        errors.current = {};
    }
    function isValid(name) {
        if (name)
            return !dot_prop_1.has(errors, name);
        return !Object.entries(errors).length;
    }
    function findField(nameOrPath) {
        return [...fields.current.values()].find(e => e.name === nameOrPath || e.path === nameOrPath);
    }
    function unref(element) {
        // If string find the element in fields.
        const _element = typeof element === 'string' ?
            findField(element) :
            element;
        if (!_element) {
            log.warn(`Failed to unref element of undefined.`);
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
    }
    function reset(values) {
        // Reset all states.
        model.current = { ...defaults.current, ...values };
        clearDirty();
        clearTouched();
        clearError();
        // Reset all fields.
        [...fields.current.values()].forEach(e => {
            e.resetElement();
        });
        submitCount.current = 0;
        submitting.current = false;
        submitted.current = false;
        // Rerender the form
        render('reset');
    }
    function handleReset(modelOrEvent) {
        if (typeof modelOrEvent === 'function') {
            return (values) => {
                reset(values);
            };
        }
        reset();
        render('reset');
    }
    function handleSubmit(handler) {
        if (!handler) {
            // Submit called but no handler!!
            log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
            return;
        }
        return async (event) => {
            submitting.current = true;
            if (event) {
                event.preventDefault();
                event.persist();
            }
            if (!options.validateSubmit)
                return handler(model.current, {}, event);
            const { err } = await utils_1.me(validateModel(model.current));
            await handler(model.current, err, event);
            submitting.current = false;
            submitted.current = true;
            submitCount.current = submitCount.current + 1;
            render('submit');
        };
    }
    return {
        // Common
        log,
        options,
        defaults,
        fields,
        unref,
        schemaAst,
        render,
        // Form
        mounted,
        reset: react_1.useCallback(reset, []),
        handleReset: react_1.useCallback(handleReset, []),
        handleSubmit: react_1.useCallback(handleSubmit, []),
        // Model
        getDefault,
        getModel,
        setModel,
        validateModel,
        isValidateable: () => {
            return (typeof options.validationSchema === 'object' && options.validationSchema._nodes) ||
                typeof options.validationSchema === 'function';
        },
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
        errors: errors.current,
        setError,
        removeError,
        clearError,
        // Getters
        get isValidatedByUser() {
            return validator.current && typeof options.validationSchema === 'function';
        },
        get isValidatedByYup() {
            return validator.current && typeof options.validationSchema === 'object';
        }
    };
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
        const defaults = schema._nodes ? schema.cast() : schema;
        _options.model = { ...defaults };
    }
    const api = initForm(_options);
    const extend = {
        register: react_1.useCallback(register_1.initElement(api), []),
    };
    return utils_1.merge(api, extend);
}
exports.default = useForm;
// register
// unregister
// renderBaseOnError
// setValueInternal
// executeValidation
// executeSchemaValidation
// triggerValidation
// setValue
// removeEventListenerAndRef
// reset
//# sourceMappingURL=form.jsx.map