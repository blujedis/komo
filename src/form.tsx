import { useRef, useEffect, FormEvent, useState, MouseEvent } from 'react';
import { initElement } from './register';
import { get, set, delete as del, has } from 'dot-prop';
import mixin from 'mixin-deep';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitResetHandler,
  SubmitResetEvent,
  IValidator,
  ISchemaAst
} from './types';
import { merge, log, isUndefined, isObject } from './utils';
import { normalizeValidator, astToSchema } from './validate';
import { ValidateOptions, ObjectSchema } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

const DEFAULTS: IOptions<any> = {
  model: {},
  validateSubmit: true,
  validateBlur: true,
  validateChange: true
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

  const schemaAst: ISchemaAst = undefined;
  const validator: IValidator<T> = undefined;
  const isSchemaUser = validator && typeof options.validationSchema === 'function';
  const isSchemaYup = validator && typeof options.validationSchema === 'object';

  const api = {

    // Common
    options,
    warn,
    defaults,
    fields,
    unref,

    // Schema
    schemaAst,
    isSchemaYup,
    isSchemaUser,
    validator,

    // Form
    mounted,
    isFormDirty: false,
    isFormTouched: false,
    isFormValid: true,
    reset,
    handleReset,
    handleSubmit,

    // Model
    getDefault,
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
    isValid

  };

  useEffect(() => {

    mounted.current = true;

    let schema: ObjectSchema<T>;

    // AST provided merge or create schema.
    if (api.schemaAst) {
      const currentSchema = options.validationSchema as ObjectSchema<T>;
      schema = astToSchema(api.schemaAst, currentSchema);
    }

    // Create the validator.
    api.validator = normalizeValidator(schema);

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => unref);
    };

  }, []);

  function warn(...args: any[]) {
    if (!options.enableWarnings) return;
    log.warn(...args);
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

  function validateModel(path: string | KeyOf<T>, value: object, opts?: ValidateOptions): Promise<any>;
  function validateModel(model: T, opts?: ValidateOptions): Promise<T>;
  function validateModel(pathOrModel: string | KeyOf<T> | T, value?: object, opts?: ValidateOptions) {

    if (!api.validator) {
      errors.current = {};
      if (typeof pathOrModel === 'string')
        return Promise.resolve(get(value, pathOrModel));
      return Promise.resolve(pathOrModel);
    }

    if (typeof pathOrModel === 'string')
      return api.validator.validateAt(pathOrModel, value, opts);

    return api.validator.validate(pathOrModel, opts);

  }

  function validateSetError(path: string | KeyOf<T>, value: object, opts?: ValidateOptions): Promise<any>;
  function validateSetError(model: T, opts?: ValidateOptions): Promise<T>;
  function validateSetError(pathOrModel: string | KeyOf<T> | T, value?: object, opts?: ValidateOptions): Promise<any> {
    return validateModel(pathOrModel as any, value, opts)
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        setError(err, typeof pathOrModel === 'string');
      });
  }

  function setTouched(path: string) {
    if (!touched.current.has(path))
      touched.current.add(path);
    api.isFormTouched = !!touched.current.size;
  }

  function removeTouched(path: string) {
    const removed = touched.current.delete(path);
    api.isFormTouched = !!touched.current.size;
    return removed;
  }

  function clearTouched() {
    api.touched.current.clear();
  }

  function isTouched(path?: string) {
    if (path)
      return touched.current.has(path);
    return !!touched.current.size;
  }

  function setDirty(path: string) {
    if (!dirty.current.has(path))
      dirty.current.add(path);
    api.isFormDirty = !!dirty.current.size;
  }

  function removeDirty(path: string) {
    const removed = dirty.current.delete(path);
    api.isFormDirty = !!dirty.current.size;
    return removed;
  }

  function clearDirty() {
    api.dirty.current.clear();
  }

  function isDirty(path?: string) {
    if (path)
      return dirty.current.has(path);
    return !!dirty.current.size;
  }

  function setError(errs: object, isMixin?: boolean): ErrorModel<T>;
  function setError(path: string, value: any): ErrorModel<T>;
  function setError(pathOrErrors: string | object, value?: any) {
    if (isObject(pathOrErrors)) {
      if (value === true)
        errors.current = mixin(errors.current, pathOrErrors);
      else
        errors.current = pathOrErrors as object;
    }
    else {
      errors.current = set({ ...errors.current }, pathOrErrors as any, value);
    }
    return errors.current;
  }

  function removeError(path: string) {
    const clone = { ...errors.current };
    del(clone, path);
    errors.current = clone;
  }

  function clearError() {
    errors.current = {};
  }

  function isValid(path: string) {
    if (path)
      return !isUndefined(errors[path]);
    return !Object.entries(errors).length;
  }

  function findField(nameOrPath: string) {
    return [...fields.current.values()].find(e => e.name === nameOrPath || e.path === nameOrPath);
  }

  function unref(element: string | IRegisteredElement<T>) {

    // If string find the element in fields.
    const _element = typeof element === 'string' ?
      findField(element as string) :
      element as IRegisteredElement<T>;

    if (!_element) {
      warn(`Failed to unref element of undefined.`);
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
    clearError();
    api.isFormDirty = false;
    api.isFormTouched = false;
    api.isFormValid = true;

    // Reset all fields.
    [...fields.current.values()].forEach(e => {
      e.resetElement();
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

    const handleFinal = (handler: SubmitResetHandler<T>, event: SubmitResetEvent<T>) => {

      clearError();

      if (!options.validateSubmit)
        return handler(model.current, errors.current, event, api as any);

      validateSetError(model.current)
        .finally(() => {
          handler(model.current, errors.current, event, api as any);
        });

    };

    if (typeof eventOrHandler === 'function')
      return (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleFinal(eventOrHandler as SubmitResetHandler<T>, event);
      };

    const _event = eventOrHandler as FormEvent<HTMLFormElement>;
    _event.preventDefault();

    if (options.onSubmit)
      return handleFinal(options.onSubmit, _event);

    // Submit called but no handler!!
    warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);

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

  const baseApi = initForm(options);
  const extend = { register: initElement<T>(baseApi as any) };
  const api = merge(baseApi, extend);

  return api;

}
