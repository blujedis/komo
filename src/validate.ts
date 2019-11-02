import { ValidationError, ValidateOptions, object, ObjectSchema, number, string, boolean } from 'yup';
import { set } from 'dot-prop';
import { IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement, 
  ISchemaAst, 
  KeyOf} from './types';
import { isPromise, isTruthy } from './utils/helpers';

/**
 * Parses yup error to friendly form errors.
 * 
 * @param error the emitted yup error.
 */
export function yupToErrors<T extends IModel>(
  error: ValidationError, getFields?: () => Set<IRegisteredElement<T>>): ErrorModel<T> {

  const errors: ErrorModel<T> = {} as any;
  const values = [...getFields().values()];

  const getKey = (path: string) => {
    return values.find(e => e.path === path) || path;
  };

  if (!error.inner || !error.inner.length) {
    const key = getKey(error.path) as KeyOf<T>;
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
      const key = getKey(error.path) as KeyOf<T>;
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

  let obj: any = {};

  for (const k in ast) {
    if (!ast.hasOwnProperty(k) || !ast[k].length) continue;

    const props = ast[k];

    const chain = props.reduce((a, c) => {
      // tslint:disable-next-line
      let [type, opts] = c as any;

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
        let fn: any = string;
        if (type === 'boolean')
          fn = boolean;
        if (type === 'number')
          fn = number;
        a.out = fn(opts);
      }

      return a;

    }, { out: undefined });

    obj = set({ ...obj }, k, chain.out);

  }

  if (!schema)
    return object(obj);

  return schema.shape(obj);

}

/**
 * Normalizes the schema into common interface.
 * Always returns object of model or object of key value whe using validateAT.
 * 
 * @param schema the yup schema or user function for validation.
 */
export function normalizeValidator<T extends IModel>(
    schema: ValidationSchema<T>, getFields?: () => Set<IRegisteredElement<T>>): IValidator<T> {

  let validator: IValidator<T>;

  // User supplied custom validation script
  // map to same interface as yup.
  if (typeof schema === 'function') {

    validator = {
      validate: (model: T) => {
        return new Promise((resolve, reject) => {
          const result = schema(model as any);
          if (!isPromise(result)) {
            if (result instanceof Error)              
              return Promise.reject(result);
            return Promise.resolve(result as T);
          }
          return (result as Promise<T>);
        });
      }
    };

    validator.validateAt = (path: string, value: any) => {
      const model = set({}, path, value) as T;
      return validator.validate(model);
    };

  }

  else if (schema) {

    validator = {} as any;

    validator.validate = (model: T, options?: ValidateOptions) => {
      return schema.validate(model, options)
        .then(res => {
          return res;
        })
        .catch(err => {
          return Promise.reject(yupToErrors(err, getFields)) as any;
        });
    };

    validator.validateAt = (path: string, value: any, options?: ValidateOptions) => {
      return schema.validateAt(path, value, options)
        .then(res => {
          return set({}, path, res) as Partial<T>;
        })
        .catch(err => {
          return Promise.reject(yupToErrors(err, getFields)) as any;
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
  const valKeys = ['required', 'min', 'max', 'maxLength', 'minLength', 'pattern'];
  return valKeys.filter(k => isTruthy(element[k]));
}

/**
 * Checks if element has native validation keys.
 * 
 * @param element the element to be inspected.
 */
export function hasNativeValidators(element: IRegisteredElement<any>) {
  return !!getNativeValidators(element).length;
}
