import React, { FC, useRef, FormEvent, useEffect } from 'react';
import { initRegister } from './register';
import get from 'lodash.get';
import set from 'lodash.setwith';
import { IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel, ValidationSchema } from './types';
import { useRenderCount, merge, log, isPromise } from './utils';
import { ObjectSchema } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

interface IForm {
  noValidate?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
}

const DEFAULTS: IOptions<any> = {
  model: {},
  onSubmit: ((e) => undefined),
  onReset: ((e) => undefined)
};

export type FormApi = ReturnType<typeof initForm>;

function normalizeValidationSchema<T extends IModel>(initSchema: ValidationSchema<T>) {

  let schema = initSchema as ObjectSchema<T>;

  // User supplied custom validation script
  // map to same interface as yup.
  if (typeof initSchema === 'function') {

    schema = {
      validate: (modelOrPath: string | KeyOf<T> | T, valueOrErrors?: any, errors?: ErrorModel<T>) => {
        return new Promise((resolve, reject) => {
          const result = initSchema(modelOrPath as any, valueOrErrors, errors);
          if (!isPromise(result))
            return result;
          return (result as Promise<ErrorModel<T>>)
            .then(res => resolve(res))
            .catch(rej => reject(rej));
        });
      }
    } as any;

    schema.validateAt = schema.validate;

  }

  if (schema && !schema.validate)
    throw new Error(`Validation schema requires yup ObjectSchema or function implementing: "(model) => ErrorModel | Promise<ErrorModel>".`);

  return schema;

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
  const schema: ObjectSchema<T> = normalizeValidationSchema(options.validationSchema);

  // Form wrapper creates ref sets noValidate.
  const Form: FC<IForm> = (props) => {

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
    schema
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
