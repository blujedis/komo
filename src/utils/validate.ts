import { ValidationError } from 'yup';
import set from 'lodash.setwith';
import { IModel, ErrorModel } from '../types';

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

export function toErrorModel<T extends IModel>(messageOrError, path?: string, value?: any) {
  if (arguments.length === 1) {
    if (typeof messageOrError !== 'object' || Array.isArray(messageOrError)) {
      const type = Array.isArray(messageOrError) ? 'array' : typeof messageOrError;
      throw new Error(`Invalid ErrorModel of type ${type} or missing arguments.`);
    }
    return messageOrError as ErrorModel<T>;
  }
  return set({}, path, value) as ErrorModel<T>;
}
