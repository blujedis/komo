"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
const dot_prop_1 = require("dot-prop");
const utils_1 = require("./utils");
const { debug_validate } = utils_1.debuggers;
/**
 * Lookup helper for element or prop in element.
 *
 * @param findField the core lookup helper for finding elements.
 */
function lookup(findField) {
    const getElement = (pathOrElement) => {
        if (!utils_1.isString(pathOrElement))
            return pathOrElement;
        return findField(pathOrElement);
    };
    return {
        element: (pathOrElement) => getElement(pathOrElement),
        at: (pathOrElement, prop) => {
            const element = getElement(pathOrElement);
            return element[prop];
        }
    };
}
exports.lookup = lookup;
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 */
function yupToErrors(error, findField) {
    const errors = {};
    if (!error.inner || !error.inner.length) {
        const key = lookup(findField).at(error.path, 'name');
        errors[key] = errors[key] || [];
        errors[key].push({
            type: error.type,
            name: error.name,
            path: error.path,
            value: error.value,
            message: error.message
        });
    }
    else {
        for (const err of error.inner) {
            const key = lookup(findField).at(err.path, 'name');
            errors[key] = errors[key] || [];
            errors[key].push({
                type: err.type,
                name: err.name,
                path: err.path,
                value: err.value,
                message: err.message
            });
        }
    }
    return errors;
}
exports.yupToErrors = yupToErrors;
/**
 * Converts AST type schema to Yup Schema or merges with existing Yup Schema.
 *
 * @param ast the schema ast to convert.
 * @param schema optional existing schema.
 */
function astToSchema(ast, schema) {
    let obj = {};
    for (const k in ast) {
        if (!ast.hasOwnProperty(k) || !ast[k].length)
            continue;
        const props = ast[k];
        const chain = props.reduce((a, c) => {
            // tslint:disable-next-line
            let [type, opts] = c;
            type = type.replace(/length$/i, '');
            if (type === 'pattern') {
                type = 'matches';
                opts = new RegExp(opts);
            }
            if (type === 'required')
                opts = undefined;
            if (a.out) {
                a.out = a.out[type](opts);
            }
            else {
                let fn = yup_1.string;
                if (type === 'boolean')
                    fn = yup_1.boolean;
                if (type === 'number')
                    fn = yup_1.number;
                a.out = fn(opts);
            }
            return a;
        }, { out: undefined });
        obj = dot_prop_1.set({ ...obj }, k, chain.out);
    }
    if (!schema)
        return yup_1.object(obj);
    return schema.shape(obj);
}
exports.astToSchema = astToSchema;
/**
 * Converts error message model to standard error model.
 *
 * @param errors the collection of errors as ErrorModel or ErrorMessageModel.
 */
function ensureErrorModel(errors) {
    if (utils_1.isNullOrUndefined(errors) || utils_1.isEmpty(errors))
        return {};
    const keys = Object.keys(errors);
    const first = errors[keys[0]];
    if (utils_1.isPlainObject(first[0]))
        return errors;
    for (const k in errors) {
        if (!errors.hasOwnProperty(k))
            continue;
        const errs = errors;
        const val = (!Array.isArray(errs[k]) ? [errs] : errs[k]);
        const mapped = val.map(message => {
            // tslint:disable-next-line: no-object-literal-type-assertion
            return {
                message
            };
        });
        errors[k] = mapped;
    }
    return errors;
}
exports.ensureErrorModel = ensureErrorModel;
/**
 * Normalizes the schema into common interface.
 * Always returns object of model or object of key value whe using validateAT.
 *
 * @param schema the yup schema or user function for validation.
 */
function normalizeValidator(schema, findField) {
    let validator;
    // User supplied custom validation script
    // map to same interface as yup.
    if (utils_1.isFunction(schema)) {
        validator = {
            validate: (model) => {
                const result = schema(model);
                if (utils_1.isPromise(result))
                    return result
                        .catch(err => {
                        Promise.reject(ensureErrorModel(err));
                    });
                // convert empty result set.
                const isErr = utils_1.isEmpty(result) ? null : result;
                if (isErr)
                    return Promise
                        .reject(ensureErrorModel(result));
                return Promise.resolve(model);
            }
        };
        validator.validateAt = async (path, model) => {
            const { err, data } = await utils_1.me(validator.validate(model));
            if (err)
                return Promise.reject(err);
            Promise.resolve(data);
        };
    }
    else if (schema) {
        validator = {};
        validator.validate = (model, options) => {
            return schema.validate(model, options)
                .then(res => {
                return res;
            })
                .catch(err => {
                return Promise.reject(yupToErrors(err, findField));
            });
        };
        validator.validateAt = (path, value, options) => {
            return schema.validateAt(path, { [path]: value }, options)
                .then(res => {
                return dot_prop_1.set({}, path, res);
            })
                .catch(err => {
                return Promise.reject(yupToErrors(err, findField));
            });
        };
    }
    if (validator && !(validator.validate || validator.validateAt))
        throw new Error(`Validation schema requires yup ObjectSchema or function implementing: "(model) => ErrorModel | Promise<T>".`);
    return validator;
}
exports.normalizeValidator = normalizeValidator;
/**
 * Gets list of native validation keys.
 *
 * @param element the element to be inspected.
 */
function getNativeValidators(element) {
    return ['required', 'min', 'max', 'maxLength', 'minLength', 'pattern']
        .filter(k => utils_1.isTruthy(element[k]));
}
exports.getNativeValidators = getNativeValidators;
/**
 * Gets list of validatable types.
 *
 * @param element the element to be inpsected.
 */
function getNativeValidatorTypes(element) {
    return ['email', 'url']
        .filter(k => utils_1.isTruthy(element.type === k));
}
exports.getNativeValidatorTypes = getNativeValidatorTypes;
/**
 * Checks if element has native validation keys.
 *
 * @param element the element to be inspected.
 */
function hasNativeValidators(element) {
    return !!getNativeValidators(element).length || !!getNativeValidatorTypes(element).length;
}
exports.hasNativeValidators = hasNativeValidators;
/**
 * Normalizes default values.
 *
 * @param defaults user defined defaults.
 * @param schema a yup validation schema or user defined function.
 * @param purge when true purge defaults from yup schema
 */
function promisifyDefaults(defaults, yupDefaults = {}) {
    const initDefaults = utils_1.isPlainObject(defaults) ? { ...defaults } : {};
    if (!utils_1.isPromise(defaults))
        return Promise.resolve({ ...yupDefaults, ...initDefaults });
    return defaults
        .then(res => {
        return { ...yupDefaults, ...res }; // merge schema defs with user defs.
    })
        .catch(err => {
        // tslint:disable-next-line: no-console
        if (err)
            console.log(err);
        return { ...yupDefaults };
    });
}
exports.promisifyDefaults = promisifyDefaults;
/**
 * Checks if object is a Yup Schema.
 *
 * @param schema the value to inspect if is a yup schema.
 */
function isYupSchema(schema) {
    return utils_1.isObject(schema) && schema.__isYupSchema__;
}
exports.isYupSchema = isYupSchema;
/**
 * If is a Yup Schema parses defaults then stores original source.
 * This allows for re-populating your defaults on next time your route is resolved.
 *
 * @param schema the provided validation schema.
 */
function parseYupDefaults(schema, purge) {
    let _schema = schema;
    if (!isYupSchema(schema))
        return {
            schema,
            defaults: {}
        };
    if (_schema.__INIT_DEFAULTS__)
        _schema = _schema.clone().default(_schema.__INIT_DEFAULTS__);
    const defaults = { ..._schema.default() };
    if (purge) {
        const fields = _schema.fields;
        for (const k in fields) {
            if (utils_1.isUndefined(fields[k]))
                continue;
            delete fields[k]._default;
            delete fields[k]._defaultDefault;
        }
        _schema.__INIT_DEFAULTS__ = { ...defaults };
    }
    return {
        schema: _schema,
        defaults
    };
}
exports.parseYupDefaults = parseYupDefaults;
/**
 * If object or array shallow clone otherwise return value.
 *
 * @param value the value to be cloned.
 */
function simpleClone(value) {
    if (utils_1.isObject(value)) {
        if (utils_1.isArray(value))
            return [...value];
        return { ...value };
    }
    return value;
}
exports.simpleClone = simpleClone;
/**
 * Uses yup to try and cast value to type or calls back for user defined casting.
 *
 * @param value the value to be cast.
 */
function castValue(value) {
    if (utils_1.isUndefined(value))
        return value;
    const origVal = simpleClone(value);
    const castVal = yup_1.mixed().cast(value);
    return utils_1.isUndefined(castVal) ? origVal : castVal;
}
exports.castValue = castValue;
/**
 * Normalizes the cast handler so the same signature can be called.
 * When the handler is disabled a noop is created returning the original value.
 *
 * @param handler the cast handler or whether the handler is enabled.
 */
function normalizeCasting(handler) {
    handler = utils_1.isUndefined(handler) ? true : handler;
    if (!handler)
        return value => value;
    // Use internal yup casting.
    if (handler === true)
        return value => castValue(value);
    return (value, path, name) => {
        value = castValue(value);
        handler(value, path, name);
    };
}
exports.normalizeCasting = normalizeCasting;
//# sourceMappingURL=validate.js.map