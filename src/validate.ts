import {
  object, string, boolean, ValidationError, number,
  ObjectSchema, ValidateOptions, mixed
} from 'yup';
import get from 'lodash.get';
import set from 'lodash.set';
import {
  IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement,
  ISchemaAst,
  KeyOf,
  IGetElement,
  ValidateModelHandler,
  ErrorMessageModel,
  IValidationError,
  CastHandler,
  INativeValidators,
} from './types';
import {
  debuggers, isPromise, isTruthy, isString, isFunction, promise,
  isNullOrUndefined, isEmpty, isPlainObject, isUndefined, isObject, isArray
} from './utils';
import { MutableRefObject } from 'react';

const { debug_validate } = debuggers;

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
export function yupToErrors<T extends IModel>(
  error: ValidationError, getElement?: IGetElement<T>): ErrorModel<T> {

  const errors: ErrorModel<T> = {} as any;

  if (!error.inner || !error.inner.length) {
    const element = getElement(error.path);
    const key = ((element && element.name) || error.path) as any;
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
      const key = ((element && element.name) || err.path) as any;
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

/**
 * Converts AST type schema to Yup Schema or merges with existing Yup Schema.
 * 
 * @param ast the schema ast to convert.
 * @param schema optional existing schema.
 */
export function astToSchema<T extends IModel>(ast: ISchemaAst, schema?: ObjectSchema<T>): ObjectSchema<T> {

  const isFunc = typeof schema === 'function';

  if (isFunc)
    return schema;

  const obj = schema || object();

  function getPath(path: string) {
    const segments = path.split('.') as any;
    return 'fields.' + segments.reduce((a, c, i) => {
      const result = [...a, c, 'fields'];
      if (i === segments.length - 1)
        result.pop();
      return result;
    }, []).join('.');
  }

  function getSchema(path: string, from: any, def: any = null) {
    path = getPath(path);
    return get(from || {}, path) || def;
  }

  function reducer(props: any[][], node?) {

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
        let fn: any = string;
        if (type === 'boolean')
          fn = boolean;
        if (type === 'number')
          fn = number;
        result = fn(opts);
      }

      return result;

    }, node);

  }

  function shaper(key: string, props: any[][]) {

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
        const parent = isString(result) ? getSchema(nextPath, schema) : result;
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
    if (!ast.hasOwnProperty(k) || !ast[k].length) continue;
    shaper(k, ast[k]);
  }

  return schema;

}

/**
 * Converts error message model to standard error model.
 * 
 * @param errors the collection of errors as ErrorModel or ErrorMessageModel.
 */
export function ensureErrorModel<T extends IModel>(
  errors: ErrorModel<T> | ErrorMessageModel<T>) {

  if (isNullOrUndefined(errors) || isEmpty(errors))
    return ({} as any) as ErrorModel<T>;
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
    const val = (!Array.isArray(errs) ? [errs] : errs) as any;
    const mapped = val.map(message => {
      if (typeof message === 'string')
        return {
          message
        } as IValidationError;
      if (isPlainObject(message))
        return message;
      throw new Error(`Komo encountered invalid error model type of ${typeof message} - ${JSON.stringify(message)}`);
    });
    errors[k] = mapped;
  }

  return errors as ErrorModel<T>;

}

/**
 * Normalizes the schema into common interface.
 * Always returns object of model or object of key value whe using validateAT.
 * 
 * @param schema the yup schema or user function for validation.
 */
export function normalizeValidator<T extends IModel>(
  schema: ValidationSchema<T>,
  findField: IGetElement<T>,
  fields: MutableRefObject<Set<IRegisteredElement<T>>>,
  vanities: string[],
  ast: ISchemaAst,
  onValidated: (model: T, errors: ErrorModel<T>) => void): IValidator<T> {

  let validator: IValidator<T>;

  // tslint:disable-next-line: no-empty
  onValidated = onValidated || ((...args) => { });

  // User supplied custom validation script
  // map to same interface as yup.
  if (isFunction(schema)) {

    validator = {

      validate: (model: T) => {

        const result = (schema as ValidateModelHandler<T>)(model, fields.current, vanities, ast);

        if (isPromise(result)) {
          return (result as Promise<T>)
            .then(res => {
              onValidated(model, null);
              return res;
            })
            .catch(err => {
              const normalized = ensureErrorModel(err as ErrorModel<T> | ErrorMessageModel<T>);
              onValidated(model, err);
              return Promise.reject(normalized);
            });
        }

        // convert empty result set.
        const normalizedErr = isEmpty(result) ? null : ensureErrorModel(result as ErrorModel<T> | ErrorMessageModel<T>);

        onValidated(model, normalizedErr);

        if (normalizedErr)
          return Promise.reject(normalizedErr) as any;
        return Promise.resolve(model);

      }

    };

    validator.validateAt = async (path: string, model: T) => {
      const { err, data } = await promise(validator.validate(model));
      onValidated(model, err);
      if (err)
        return Promise.reject(err);
      Promise.resolve(data);
    };

  }

  else if (schema) {

    validator = {} as any;

    validator.validate = (model: T, options?: ValidateOptions) => {

      return (schema as ObjectSchema<T>).validate(model, options)
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

    validator.validateAt = (path: string, model: T, options?: ValidateOptions) => {
      return (schema as ObjectSchema<T>).validateAt(path, model, options)
        .then(res => {
          onValidated(model, null);
          return set({}, path, res) as Partial<T>;
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

/**
 * Gets list of native validation keys.
 * 
 * @param element the element to be inspected.
 */
export function getNativeValidators(element: IRegisteredElement<any>) {
  return ['required', 'min', 'max', 'maxLength', 'minLength', 'pattern']
    .filter(k => isTruthy(element[k]));
}

/**
 * Gets list of validatable types.
 * 
 * @param element the element to be inpsected.
 */
export function getNativeValidatorTypes(element: IRegisteredElement<any>) {
  return ['email', 'url', 'tel', 'date', 'time']
    .filter(k => isTruthy(element.type === k));
}

/**
 * Checks if element has native validation keys.
 * 
 * @param element the element to be inspected.
 */
export function hasNativeValidators(element: IRegisteredElement<any>) {
  return !!getNativeValidators(element).length || !!getNativeValidatorTypes(element).length;
}

/**
 * Normalizes default values.
 * 
 * @param defaults user defined defaults.
 * @param normalizedDefaults the normalized defaults for yup or empty object
 */
export function promisifyDefaults<T extends IModel>(defaults: T, normalizedDefaults: Partial<T> = {}) {

  const userDefaults: Partial<T> = isPlainObject(defaults) ? { ...defaults } : {};

  if (!isPromise(defaults))
    return Promise.resolve({ ...normalizedDefaults, ...userDefaults }) as Promise<T>;

  // On error we return normalizedDefaults.
  // We merge these in Komo sync event.
  return (defaults as any)
    .then(res => {
      return { ...normalizedDefaults, ...res }; // merge normalized with promised result.
    })
    .catch(err => {
      // tslint:disable-next-line: no-console
      if (err) console.log(err);
      return { ...normalizedDefaults };
    }) as Promise<T>;

}

/**
 * Checks if object is a Yup Schema.
 * 
 * @param schema the value to inspect if is a yup schema.
 */
export function isYupSchema(schema: any) {
  return isObject(schema) && schema.__isYupSchema__;
}

/**
 * If is a Yup Schema parses defaults then stores original source. 
 * This allows for re-populating your defaults on next time your route is resolved.
 * 
 * @param schema the provided validation schema.
 */
export function parseDefaults<T extends IModel>(schema: ValidationSchema<T>, purge: boolean) {

  let _schema = schema as any;

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
      if (isUndefined(fields[k])) continue;
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

/**
 * If object or array shallow clone otherwise return value.
 * 
 * @param value the value to be cloned.
 */
export function simpleClone(value: any) {
  if (isObject(value)) {
    if (isArray(value))
      return [...value];
    return { ...value };
  }
  return value;
}

/**
 * Uses yup to try and cast value to type or calls back for user defined casting.
 * 
 * @param value the value to be cast.
 */
export function castValue(value: any) {

  if (isUndefined(value))
    return value;

  const origVal = simpleClone(value);
  const castVal = mixed().cast(value);

  return isUndefined(castVal) ? origVal : castVal;

}

/**
 * Normalizes the cast handler so the same signature can be called.
 * When the handler is disabled a noop is created returning the original value.
 * 
 * @param handler the cast handler or whether the handler is enabled.
 */
export function normalizeCasting<T extends IModel>(handler: boolean | CastHandler) {

  handler = isUndefined(handler) ? true : handler;

  if (!handler)
    return value => value;

  // Use internal yup casting.
  if (handler === true)
    return value => castValue(value);

  return (value: any, path: string, name: KeyOf<T>) => {
    value = castValue(value);
    (handler as CastHandler)(value, path, name);
  };

}

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
export function parseNativeValidators<T extends IModel>(element: IRegisteredElement<T>, schemaAst: ISchemaAst) {

  schemaAst = (schemaAst || {}) as ISchemaAst;

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
      schemaAst[element.path].push([element.type as any, undefined]);
    }

    // Extend AST with each native validator.
    if (nativeValidators.length)
      nativeValidators.forEach(k => {
        schemaAst[element.path].push([k as KeyOf<INativeValidators>, element[k]]);
      });

  }

  return schemaAst;

}
