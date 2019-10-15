import React, { FC, useRef, useEffect } from 'react';
import { initRegister } from './register';
import get from 'lodash.get';
import set from 'lodash.setwith';
import { IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel, ValidationSchema, SubmitResetHandler, IValidator } from './types';
import { useRenderCount, merge, log, isPromise, yupToErrors } from './utils';
import { ObjectSchema, ValidateOptions } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

interface IForm<T extends IModel> {
  noValidate?: boolean;
  onSubmit?: SubmitResetHandler<T>;
  onReset?: SubmitResetHandler<T>;
}

const DEFAULTS: IOptions<any> = {
  model: {},
  onSubmit: ((e) => undefined),
  onReset: ((e) => undefined)
};

export type FormApi = ReturnType<typeof initForm>;

/**
 * Normalizes the schema into common interface.
 * 
 * @param schema the yup schema or user function for validation.
 */
function normalizeValidation<T extends IModel>(schema: ValidationSchema<T>): IValidator<T> {

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

export function initForm<T extends IModel>(options: IOptions<T>) {

  const form = useRef<HTMLFormElement>(null);
  const defaults = useRef({ ...options.model });
  const state = useRef({ ...options.model });
  const fields = useRef(new Set<IRegisteredElement<T>>());
  const touched = useRef(new Set<string>());
  const dirty = useRef(new Set<string>());
  const errors = useRef<ErrorModel<T>>({});
  const isMounted = useRef(false);
  const validator = normalizeValidation(options.validationSchema);

  // Form wrapper creates ref sets noValidate.
  const Form: FC<IForm<T>> = (props) => {

    useRenderCount();
    props = { onSubmit: options.onSubmit, onReset: options.onReset, noValidate: true, ...props };

    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    return <form ref={form} {...props} />;

  };

  const api = {
    form,
    Form,
    fields,
    getModel,
    setModel,
    validateModel,
    touched,
    setTouched,
    removeTouched,
    dirty,
    setDirty,
    removeDirty,
    validator
  };

  function setModel<K extends KeyOf<T>>(path: string, value: any);
  function setModel<K extends KeyOf<T>>(key: K, value: T[K]);
  function setModel(model: T);
  function setModel<K extends KeyOf<T>>(pathOrModel: string | K | T, value?: T[K]) {

    if (!pathOrModel) {
      log.error(`Cannot set model using key or model of undefined.`);
      return;
    }

    if (arguments.length === 2)
      state.current = set(state.current, pathOrModel as K, value);

    else
      state.current = { ...state.current, ...pathOrModel as T };

  }

  function getModel<K extends KeyOf<T>>(path: string);
  function getModel<K extends KeyOf<T>>(key: K);
  function getModel();
  function getModel<K extends KeyOf<T>>(path?: K | string) {
    if (!path)
      return state.current;
    return get(state.current, path, undefined);
  }

  function validateModel(pathOrModel: string | KeyOf<T> | T, value?: any) {

    if (!options.validationSchema) {
      errors.current = {};
      return true;
    }

    if (arguments.length === 2) {

      // Check if user defined field validator.


    }

    else {

    }

  }

  function setTouched(name: string) {
    if (!touched.current.has(name))
      touched.current.add(name);
  }

  function removeTouched(name: string) {
    return touched.current.delete(name);
  }

  function setDirty(name: string) {
    if (!dirty.current.has(name))
      dirty.current.add(name);

    // if (!fieldsRef.current[name]) return false;

    // const isDirty =
    //   defaultValuesRef.current[name] !==
    //   getFieldValue(fieldsRef.current, fieldsRef.current[name]!.ref);
    // const isDirtyChanged = dirtyFieldsRef.current.has(name) !== isDirty;

    // if (isDirty) {
    //   dirtyFieldsRef.current.add(name);
    // } else {
    //   dirtyFieldsRef.current.delete(name);
    // }

    // isDirtyRef.current = !!dirtyFieldsRef.current.size;
    // return isDirtyChanged;
  }

  function removeDirty(name: string) {
    return dirty.current.delete(name);
  }

  function reset() {
    state.current = { ...defaults.current };
  }

  return api as typeof api;

}

/**
 * Use form hook exposes Komo form hook API.
 * 
 * @param options form api options.
 */
export default function useForm<T extends IModel>(options?: IOptions<T>) {

  options = { ...DEFAULTS, ...options };

  try {
    // If cast schema get model from yup schema.
    if (options.castSchema && options.validationSchema && typeof options.validationSchema === 'object')
      // @ts-ignore
      options.model = options.validationSchema.cast();
  }
  catch (ex) {
    throw new Error(`Failed to "cast" validation schema to model, verify valid "yup" schema.`);
  }

  const baseApi = initForm(options);
  const extend = { register: initRegister<T>(baseApi as any) };

  const api = merge(baseApi, extend);

  return api;

}
