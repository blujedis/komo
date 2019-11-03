import { ValidationError, ValidateOptions, object, ObjectSchema, number, string, boolean } from 'yup';
import { set, get } from 'dot-prop';
import {
  IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement,
  ISchemaAst,
  KeyOf,
  IFindField,
  ValidateModelHandler,
  ErrorMessageModel,
  IValidationError
} from './types';
import { isPromise, isTruthy, isString, isFunction, me, isNullOrUndefined, isEmpty, isPlainObject } from './utils/helpers';



/**
 * Lookup helper for element or prop in element.
 * 
 * @param findField the core lookup helper for finding elements.
 */
export function lookup<T extends IModel>(findField: IFindField<T>) {

  const getElement = (pathOrElement: string | IRegisteredElement<T>) => {
    if (!isString(pathOrElement))
      return pathOrElement as IRegisteredElement<T>;
    return findField(pathOrElement as string);
  };

  return {
    element: (pathOrElement: string | IRegisteredElement<T>) => getElement(pathOrElement),
    at: <K extends KeyOf<IRegisteredElement<T>>>(
      pathOrElement: string | IRegisteredElement<T>, prop: K) => {
      const element = getElement(pathOrElement);
      return element[prop];
    }
  };

}

/**
 * Parses yup error to friendly form errors.
 * 
 * @param error the emitted yup error.
 */
export function yupToErrors<T extends IModel>(
  error: ValidationError, findField?: IFindField<T>): ErrorModel<T> {

  const errors: ErrorModel<T> = {} as any;

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
 * Converts error message model to standard error model.
 * 
 * @param errors the collection of errors as ErrorModel or ErrorMessageModel.
 */
export function ensureErrorModel<T extends IModel>(
  errors: ErrorModel<T> | ErrorMessageModel<T>) {
  if (isNullOrUndefined(errors) || isEmpty(errors))
    return ({} as any) as ErrorModel<T>;
  const keys = Object.keys(errors);
  const first = errors[keys[0]];
  if (isPlainObject(first[0]))
    return errors as ErrorModel<T>;
  for (const k in errors) {
    if (!errors.hasOwnProperty(k)) continue;
    const errs = errors as ErrorMessageModel<T>;
    const val = (!Array.isArray(errs[k]) ? [errs] : errs[k]) as string[];
    const mapped = val.map(message => {
      // tslint:disable-next-line: no-object-literal-type-assertion
      return {
        message
      } as IValidationError;
    });
    (errors as ErrorModel<T>)[k] = mapped;
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
  schema: ValidationSchema<T>, findField?: IFindField<T>): IValidator<T> {

  let validator: IValidator<T>;

  // User supplied custom validation script
  // map to same interface as yup.
  if (isFunction(schema)) {

    validator = {
      validate: (model: T) => {

        const result = (schema as ValidateModelHandler<T>)(model);

        if (isPromise(result))
          return (result as Promise<T>)
            .catch(err => {
              Promise.reject(ensureErrorModel(err as ErrorModel<T> | ErrorMessageModel<T>));
            });

        // convert empty result set.
        const isErr = isEmpty(result) ? null : result;

        if (isErr)
          return Promise
            .reject(ensureErrorModel(result as ErrorModel<T> | ErrorMessageModel<T>)) as any;

        return Promise.resolve(model);

      }

    };

    validator.validateAt = async (path: string, model: T) => {
      const { err, data } = await me(validator.validate(model));
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
          return res;
        })
        .catch(err => {
          return Promise.reject(yupToErrors(err, findField));
        });

    };

    validator.validateAt = (path: string, value: any, options?: ValidateOptions) => {

      return (schema as ObjectSchema<T>).validateAt(path, { [path]: value } as any, options)
        .then(res => {
          return set({}, path, res) as Partial<T>;
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
  return ['email', 'url']
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
