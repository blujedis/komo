import { useRef, useEffect, FormEvent, useState, MouseEvent } from 'react';
import { initElement } from './register';
import { get, set, delete as del, has } from 'dot-prop';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitResetHandler,
  SubmitResetEvent
} from './types';
import { merge, log, normalizeValidator, isRadio, isCheckbox, isBooleanLike } from './utils';
import { ValidateOptions } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

const DEFAULTS: IOptions<any> = {
  model: {}
};

export type FormApi = ReturnType<typeof initForm>;

export function initForm<T extends IModel>(options: IOptions<T>) {

  const defaults = useRef({ ...options.model });
  const model = useRef({ ...options.model });
  const fields = useRef(new Set<IRegisteredElement<T>>());
  const touched = useRef(new Set<string>());
  const dirty = useRef(new Set<string>());
  const errors = useRef<ErrorModel<T>>({});
  const [, render] = useState({});
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => unref);
    };
  }, []);

  const validator = normalizeValidator(options.validationSchema);

  const api = {

    // Fields & Defaults
    defaults,
    fields,

    // Form
    validator,
    mounted,
    isFormDirty: false,
    isFormTouched: false,
    isFormValid: true,
    reset,
    handleReset,
    handleSubmit,

    // Model
    getDefault,
    setDefaultValue,
    getModel,
    setModel,
    validateModel,
    hasModelPath,

    // Touched
    touched,
    setTouched,
    removeTouched,
    clearTouched,
    isTouched,

    // Dirty
    dirty,
    setDirty,
    removeDirty,
    clearDirty,
    isDirty,

    // Errors
    setError,
    removeError,
    clearError,

    unref

  };

  function setDefaultValue(element: IRegisteredElement<T>) {

    let value;

    if (isRadio(element.type) || isCheckbox(element.type)) {

      if (isRadio(element.type)) {

        if (element.checked) {
          value = element.initValue = element.value;
          element.checked = true;
          // @ts-ignore
          element.defaultChecked = true;
        }

      }

      else {
        value = element.initValue = element.checked || isBooleanLike(element.initValue);
        // @ts-ignore
        element.defaultChecked = element.checked = value;
      }

    }

    else if (element.multiple) {

      // @ts-ignore
      element.defaultValue = element.initValue;

      value = [...element.initValue];

      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (value.includes(opt.value || opt.text)) {
          element.options[i].selected = true;
        }
      }

    }

    else {

      // @ts-ignore
      value = element.defaultValue = element.value = element.initValue;

    }

    // Update the model and set defaults.
    if (value)
      api.setModel(element.path, value, true);

  }

  function getDefault<K extends KeyOf<T>>(path: string);
  function getDefault<K extends KeyOf<T>>(key: K);
  function getDefault();
  function getDefault<K extends KeyOf<T>>(path?: K | string) {
    if (!path)
      return defaults.current;
    return get(defaults.current, path);
  }

  function setModel<K extends KeyOf<T>>(path: string, value: any, setDefault?: boolean);
  function setModel<K extends KeyOf<T>>(key: K, value: T[K]);
  function setModel(model: T);
  function setModel<K extends KeyOf<T>>(pathOrModel: string | K | T, value?: T[K], setDefault: boolean = false) {

    if (!pathOrModel) {
      log.error(`Cannot set model using key or model of undefined.`);
      return;
    }

    if (arguments.length >= 2) {
      model.current = set({ ...model.current }, pathOrModel as K, value);
      if (setDefault)
        defaults.current = set({ ...defaults.current }, pathOrModel as string, value);
    }

    else {
      model.current = { ...model.current, ...pathOrModel as T };
    }

  }

  function getModel<K extends KeyOf<T>>(path: string);
  function getModel<K extends KeyOf<T>>(key: K);
  function getModel();
  function getModel<K extends KeyOf<T>>(path?: K | string) {
    if (!path)
      return model.current;
    return get(model.current, path);
  }

  function hasModelPath<K extends KeyOf<T>>(path: string | K) {
    return has(model, path);
  }

  function validateModel(path: string | KeyOf<T>, value?: any, opts?: ValidateOptions);
  function validateModel(path: T, opts?: ValidateOptions);
  function validateModel(pathOrModel: string | KeyOf<T> | T, value?: any, opts?: ValidateOptions) {

    if (!options.validationSchema) {
      errors.current = {};
      return true;
    }

    if (arguments.length === 2) {
      //
    }

    else {
      //
    }

  }

  function setTouched(name: string) {
    if (!touched.current.has(name))
      touched.current.add(name);
    api.isFormTouched = !!touched.current.size;
  }

  function removeTouched(name: string) {
    const removed = touched.current.delete(name);
    api.isFormTouched = !!touched.current.size;
    return removed;
  }

  function clearTouched() {
    api.touched.current.clear();
  }

  function isTouched(name?: string) {
    if (name)
      return touched.current.has(name);
    return !!touched.current.size;
  }

  function setDirty(name: string) {
    if (!dirty.current.has(name))
      dirty.current.add(name);
    api.isFormDirty = !!dirty.current.size;
  }

  function removeDirty(name: string) {
    const removed = dirty.current.delete(name);
    api.isFormDirty = !!dirty.current.size;
    return removed;
  }

  function clearDirty() {
    api.dirty.current.clear();
  }

  function isDirty(name?: string) {
    if (name)
      return dirty.current.has(name);
    return !!dirty.current.size;
  }

  function setError(name: string, value: string) {
    errors.current = set({ ...errors.current }, name, value);
  }

  function removeError(name: string) {
    const clone = { ...errors.current };
    del(clone, name);
    errors.current = clone;
  }

  function clearError() {
    errors.current = {};
  }

  function findField(name: string) {
    return [...fields.current.values()].find(e => e.name === name || e.path === name);
  }

  function unref(element: string | IRegisteredElement<T>) {

    // If string find the element in fields.
    const _element = typeof element === 'string' ?
      findField(element as string) :
      element as IRegisteredElement<T>;

    if (!_element) {
      log.warn(`Failed to unref element of undefined.`);
      return;
    }

    // Remove any flags/errors that are stored.
    removeDirty(_element.path);
    removeTouched(_element.path);
    removeError(_element.path);

    // Unbind any listener events.
    _element.unbind();

    // Delete the element from fields collection.
    fields.current.delete(_element);

  }

  function reset(event?: SubmitResetEvent<T>) {

    // Reset all states.
    model.current = { ...defaults.current };
    clearDirty();
    clearTouched();
    api.isFormDirty = false;
    api.isFormTouched = false;
    api.isFormValid = true;

    // Reset all fields.
    [...fields.current.values()].forEach(e => {
      setDefaultValue(e);
    });

    // Rerender the form
    render({});

  }

  function handleReset(handler: SubmitResetHandler<T>): (event?: SubmitResetEvent<T>) => void;
  function handleReset(event: SubmitResetEvent<T>): void;
  function handleReset(): void;
  function handleReset(eventOrHandler?: SubmitResetEvent<T> | SubmitResetHandler<T>) {

    if (typeof eventOrHandler === 'function')
      return (event: FormEvent<HTMLFormElement>) => {
        const fn = eventOrHandler as SubmitResetHandler<T>;
        if (fn)
          fn(model.current, event, api);
        else
          reset(); // whoops should get here just in case reset for user.
      };

    if (options.onReset)
      return options.onReset(model.current, eventOrHandler, api);

    // If we get here just use internal reset.
    reset(eventOrHandler);

  }

  function handleSubmit(handler: SubmitResetHandler<T>): (event?: SubmitResetEvent<T>) => void;
  function handleSubmit(event: SubmitResetEvent<T>): void;
  function handleSubmit(eventOrHandler: SubmitResetEvent<T> | SubmitResetHandler<T>) {

    if (typeof eventOrHandler === 'function')
      return (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const fn = eventOrHandler as SubmitResetHandler<T>;
        fn(model.current, event, api);
      };

    const _event = eventOrHandler as FormEvent<HTMLFormElement>;
    _event.preventDefault();

    if (options.onSubmit)
      return options.onSubmit(model.current, eventOrHandler, api);

    // Submit called but no handler!!
    log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);

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
  const extend = { register: initElement<T>(baseApi as any) };

  const api = merge(baseApi, extend);

  return api;

}
