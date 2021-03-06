"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNativeValidators = exports.normalizeCasting = exports.castValue = exports.simpleClone = exports.parseDefaults = exports.isYupSchema = exports.promisifyDefaults = exports.hasNativeValidators = exports.getNativeValidatorTypes = exports.getNativeValidators = exports.normalizeValidator = exports.ensureErrorModel = exports.astToSchema = exports.yupToErrors = void 0;
const yup_1 = require("yup");
const lodash_get_1 = __importDefault(require("lodash.get"));
const lodash_set_1 = __importDefault(require("lodash.set"));
const utils_1 = require("./utils");
const { debug_validate } = utils_1.debuggers;
const typeToYup = {
    range: 'number',
    number: 'number',
    email: 'string',
    url: 'string',
    checkbox: 'boolean'
};
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 * @param getElement a method which gets an element.
 */
function yupToErrors(error, getElement) {
    const errors = {};
    if (!error.inner || !error.inner.length) {
        const element = getElement(error.path);
        const key = ((element && element.name) || error.path);
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
            const element = getElement(err.path);
            const key = ((element && element.name) || err.path);
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
    const isFunc = typeof schema === 'function';
    if (isFunc)
        return schema;
    const obj = schema || yup_1.object();
    function getPath(path) {
        const segments = path.split('.');
        return 'fields.' + segments.reduce((a, c, i) => {
            const result = [...a, c, 'fields'];
            if (i === segments.length - 1)
                result.pop();
            return result;
        }, []).join('.');
    }
    function getSchema(path, from, def = null) {
        path = getPath(path);
        return lodash_get_1.default(from || {}, path) || def;
    }
    function reducer(props, node) {
        return props.reduce((result, config) => {
            let [type, opts] = config;
            // strip out "length"
            type = type.replace(/length$/i, '');
            if (type === 'pattern') {
                type = 'matches';
                opts = new RegExp(opts);
            }
            if (type === 'required') {
                opts = undefined;
            }
            if (result && result[type]) {
                result = result[type](opts);
            }
            else {
                let fn = yup_1.string;
                if (type === 'boolean')
                    fn = yup_1.boolean;
                if (type === 'number')
                    fn = yup_1.number;
                result = fn(opts);
            }
            return result;
        }, node);
    }
    function shaper(key, props) {
        // The current schema/node at path.
        // the last segment in path is removed
        // so if it exists is always the parent
        // schema object containing "fields".
        const current = getSchema(key, schema);
        const isNested = /\./g.test(key);
        if (isNested) {
            const segments = [...key.split('.')];
            const lastIdx = segments.length - 1;
            const lastKey = segments[lastIdx];
            const reduced = reducer(props, current);
            segments.reduceRight((result, curr, i) => {
                const nextPath = segments.slice(0, i + 1).join('.');
                const parent = utils_1.isString(result) ? getSchema(nextPath, schema) : result;
                parent.fields[lastKey] = reduced;
                return parent;
            });
        }
        else {
            // @ts-ignore
            obj.fields[key] = reducer(props, current);
        }
    }
    // Iterate each key in AST.
    for (const k in ast) {
        if (!ast.hasOwnProperty(k) || !ast[k].length)
            continue;
        shaper(k, ast[k]);
    }
    return schema;
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
    // const keys = Object.keys(errors);
    // const first = errors[keys[0]];
    // if (isPlainObject(first[0]))
    //   return errors as ErrorModel<T>;
    for (const k in errors) {
        if (!errors.hasOwnProperty(k) || !errors[k])
            continue;
        //  const errs = errors as ErrorMessageModel<T>;
        // const val = (!Array.isArray(errs[k]) ? [errs] : errs[k]) as string[];
        const errs = errors[k];
        const val = (!Array.isArray(errs) ? [errs] : errs);
        const mapped = val.map(message => {
            if (typeof message === 'string')
                return {
                    message
                };
            if (utils_1.isPlainObject(message))
                return message;
            throw new Error(`Komo encountered invalid error model type of ${typeof message} - ${JSON.stringify(message)}`);
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
function normalizeValidator(schema, findField, fields, vanities, ast, onValidated) {
    let validator;
    // tslint:disable-next-line: no-empty
    onValidated = onValidated || ((...args) => { });
    // User supplied custom validation script
    // map to same interface as yup.
    if (utils_1.isFunction(schema)) {
        validator = {
            validate: (model) => {
                const result = schema(model, fields.current, vanities, ast);
                if (utils_1.isPromise(result)) {
                    return result
                        .then(res => {
                        onValidated(model, null);
                        return res;
                    })
                        .catch(err => {
                        const normalized = ensureErrorModel(err);
                        onValidated(model, err);
                        return Promise.reject(normalized);
                    });
                }
                // convert empty result set.
                const normalizedErr = utils_1.isEmpty(result) ? null : ensureErrorModel(result);
                onValidated(model, normalizedErr);
                if (normalizedErr)
                    return Promise.reject(normalizedErr);
                return Promise.resolve(model);
            }
        };
        validator.validateAt = async (path, model) => {
            const { err, data } = await utils_1.promise(validator.validate(model));
            onValidated(model, err);
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
                onValidated(model, null);
                return res;
            })
                .catch(err => {
                const normalized = yupToErrors(err, findField);
                onValidated(model, normalized);
                return Promise.reject(normalized);
            });
        };
        validator.validateAt = (path, model, options) => {
            return schema.validateAt(path, model, options)
                .then(res => {
                onValidated(model, null);
                return lodash_set_1.default({}, path, res);
            })
                .catch(err => {
                const normalized = yupToErrors(err, findField);
                onValidated(model, normalized);
                return Promise.reject(normalized);
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
    return ['email', 'url', 'tel', 'date', 'time']
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
 * @param normalizedDefaults the normalized defaults for yup or empty object
 */
function promisifyDefaults(defaults, normalizedDefaults = {}) {
    if (!utils_1.isPromise(defaults))
        defaults = Promise.resolve(defaults);
    // On error we return normalizedDefaults.
    // We merge these in Komo sync event.
    return defaults
        .then(res => {
        return { ...normalizedDefaults, ...res }; // merge normalized with promised result.
    })
        .catch(err => {
        // tslint:disable-next-line: no-console
        if (err)
            console.log(err);
        return { ...normalizedDefaults };
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
function parseDefaults(schema, purge) {
    let _schema = schema;
    if (!isYupSchema(schema))
        return {
            schema,
            defaults: {}
        };
    // If init default clone and set as default.
    if (_schema.__INIT_DEFAULTS__)
        _schema = _schema.clone().default(_schema.__INIT_DEFAULTS__);
    // Clone the default values.
    const defaults = { ..._schema.default() };
    // Iterate all fields and delete defaults
    // this is required when setting defaults
    // with Yup otherwise your form will never
    // throw an error for your field as well
    // yup says....NOPE!!!
    const purgeFields = (s) => {
        const fields = s.fields;
        for (const k in fields) {
            if (utils_1.isUndefined(fields[k]))
                continue;
            if (fields[k].fields) {
                purgeFields(fields[k]);
            }
            else {
                delete fields[k]._default;
                delete fields[k]._defaultDefault;
            }
        }
    };
    if (purge) {
        purgeFields(_schema);
        // Store the init defaults.
        _schema.__INIT_DEFAULTS__ = { ...defaults };
    }
    return {
        schema: _schema,
        defaults
    };
}
exports.parseDefaults = parseDefaults;
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
/**
 * Parses the element for native validators building up an ast for use with Yup.
 * Only a minimal subset of yup validations are supported in converting from native
 * validators or element type values.
 *
 * Parser supports converting type="element_type" for the following input.
 *
 * text = string
 * number = number
 * checkbox = boolean
 *
 * ONLY The following native validators are supported.
 *
 * email, url, range, required
 * min, max, minLength, maxLength,
 * pattern.
 *
 * @param element the element to be parsed.
 */
function parseNativeValidators(element, schemaAst) {
    schemaAst = (schemaAst || {});
    const nativeValidators = getNativeValidators(element);
    const nativeValidatorTypes = getNativeValidatorTypes(element);
    if (nativeValidators.length || nativeValidatorTypes.length) {
        schemaAst[element.path] = schemaAst[element.path] || [];
        const baseType = typeToYup[element.type];
        // Set the type.
        schemaAst[element.path] = [[baseType || 'string', element.name]];
        // These are basically sub types of string
        // like email or url.
        if (nativeValidatorTypes.length) {
            schemaAst[element.path].push([element.type, undefined]);
        }
        // Extend AST with each native validator.
        if (nativeValidators.length)
            nativeValidators.forEach(k => {
                schemaAst[element.path].push([k, element[k]]);
            });
    }
    return schemaAst;
}
exports.parseNativeValidators = parseNativeValidators;
//# sourceMappingURL=validate.js.map