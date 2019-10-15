import { ValidationError, ValidateOptions } from 'yup';
import set from 'lodash.setwith';
import { IModel, ErrorModel, ValidationSchema, IValidator } from '../types';
import { isPromise } from './helpers';

/**
 * Parses yup error to friendly form errors.
 * 
 * @param error the emitted yup error.
 */
export function yupToErrors<T extends IModel>(error: ValidationError): ErrorModel<T> {

  let errors: any = {};

  if (error.inner) {
    if (error.inner.length === 0)
      return set(errors, error.path, error.message);

    for (const err of error.inner) {
      if (!(errors as any)[err.path])
        errors = set(errors, err.path, err.message);
    }
  }

  return errors;

}

/**
 * Normalizes the schema into common interface.
 * 
 * @param schema the yup schema or user function for validation.
 */
export function normalizeValidator<T extends IModel>(schema: ValidationSchema<T>): IValidator<T> {

  let validator: IValidator<T>;

  // User supplied custom validation script
  // map to same interface as yup.
  if (typeof schema === 'function') {

    validator = {
      validate: (model: T) => {
        return new Promise((resolve, reject) => {
          const result = schema(model as any);
          if (!isPromise(result))
            return result;
          return (result as Promise<T>)
            .then(res => resolve(res))
            .catch(err => reject(err));
        });
      }
    };

    validator.validateAt = (path: string, value: any) => {
      const model = set({}, path, value) as T;
      return validator.validate(model);
    };

  }

  else if (schema) {

    validator.validate = (model: T, options?: ValidateOptions) => {
      return schema.validate(model, options)
        .then(res => {
          return res;
        })
        .catch(err => {
          return yupToErrors(err) as any;
        });
    };

    validator.validateAt = (path: string, value: any, options?: ValidateOptions) => {
      return schema.validateAt(path, value, options)
        .then(res => {
          return res;
        })
        .catch(err => {
          return yupToErrors(err) as any;
        });
    };

  }

  if (validator && !(validator.validate || validator.validateAt))
    throw new Error(`Validation schema requires yup ObjectSchema or function implementing: "(model) => ErrorModel | Promise<T>".`);

  return validator;

}
