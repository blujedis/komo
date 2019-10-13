import { ValidationError } from 'yup';
import set from 'lodash.setwith';
import { IModel, ValidationModel } from '../types';

/**
 * Parses yup error to friendly form errors.
 * 
 * @param error the emitted yup error.
 */
export function yupToErrors<T extends IModel>(error: ValidationError): ValidationModel<T> {

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
