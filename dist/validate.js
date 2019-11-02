"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
const dot_prop_1 = require("dot-prop");
const helpers_1 = require("./utils/helpers");
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 */
function yupToErrors(error) {
    const errors = {};
    if (!error.inner || !error.inner.length) {
        errors[error.path] = errors[error.path] || [];
        errors[error.path].push({
            type: error.type,
            name: error.name,
            path: error.path,
            value: error.value,
            message: error.message
        });
    }
    else {
        for (const err of error.inner) {
            errors[err.path] = errors[err.path] || [];
            errors[err.path].push({
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
 * Normalizes the schema into common interface.
 *
 * @param schema the yup schema or user function for validation.
 */
function normalizeValidator(schema) {
    let validator;
    // User supplied custom validation script
    // map to same interface as yup.
    if (typeof schema === 'function') {
        validator = {
            validate: (model) => {
                return new Promise((resolve, reject) => {
                    const result = schema(model);
                    if (!helpers_1.isPromise(result))
                        return Promise.reject(result);
                    return result
                        .then(res => resolve(res))
                        .catch(err => reject(err));
                });
            }
        };
        validator.validateAt = (path, value) => {
            const model = dot_prop_1.set({}, path, value);
            return validator.validate(model);
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
                return Promise.reject(yupToErrors(err));
            });
        };
        validator.validateAt = (path, value, options) => {
            return schema.validateAt(path, value, options)
                .then(res => {
                return dot_prop_1.set({}, path, res);
            })
                .catch(err => {
                return Promise.reject(yupToErrors(err));
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
    const valKeys = ['required', 'min', 'max', 'maxLength', 'minLength', 'pattern'];
    return valKeys.filter(k => helpers_1.isTruthy(element[k]));
}
exports.getNativeValidators = getNativeValidators;
/**
 * Checks if element has native validation keys.
 *
 * @param element the element to be inspected.
 */
function hasNativeValidators(element) {
    return !!getNativeValidators(element).length;
}
exports.hasNativeValidators = hasNativeValidators;
//# sourceMappingURL=validate.js.map