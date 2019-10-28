import { useRef, useEffect, FormEvent, useState, MutableRefObject } from 'react';
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
import { merge, createLogger, isObject } from './utils';
import { normalizeValidator, astToSchema } from './validate';
import { ValidateOptions, ObjectSchema, InferType } from 'yup';

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

// export function initForm<T extends IModel>(options: IOptions<T>) {
export function initForm<T extends IModel>(options: IOptions<T>) {

  type Model = ReturnType<typeof initSchema>;

  const defaults = useRef({ ...options.model });
  const model = useRef({ ...options.model });
  const fields = useRef(new Set<IRegisteredElement<T>>());
  const touched = useRef(new Set<string>());
  const dirty = useRef(new Set<string>());
  const errors = useRef<ErrorModel<T>>({});
  const validator = useRef<IValidator<T>>();
  const schemaAst = useRef<ISchemaAst>();
  const mounted = useRef(false);
  const [, render] = useState({});

  useEffect(() => {

    mounted.current = true;

    // AST provided merge or create schema.
    // if (schemaAst.current)
    //   options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    // validator.current = normalizeValidator(options.validationSchema);

    initSchema();

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => unref);
    };

  }, []);

  const log = createLogger(options.enableWarnings ? 'info' : 'error');

  function initSchema() {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current)
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema);

    schema = options.validationSchema as any;

    return schema;

  }

  function setRef<R, K extends KeyOf<R>>(ref: MutableRefObject<R>, path: K, value: R[K]): R;
  function setRef<R>(ref: MutableRefObject<R>, model: object): R;
  function setRef<R>(ref: MutableRefObject<R>, pathOrModel: string | object, value?: any) {
    if (!setRef)
      return log.error(`Cannot setRef using ref of undefined.`);
    if (value)
      ref.current = ref[pathOrModel as string] = value;
    else
      ref.current = value;
    return ref.current;
  }

  function getRef<R, K extends KeyOf<R>>(ref: MutableRefObject<R>, path?: K): R[K];
  function getRef<R>(ref: MutableRefObject<R>): R;
  function getRef<R>(ref: MutableRefObject<R>, path?: string) {
    if (!path)
      return ref.current;
    return ref.current[path];
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
      if (value === '')
        value = undefined;
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

  function validateModel(path: string | KeyOf<T>, value: object, opts?: ValidateOptions): Promise<any>;
  function validateModel(model: T, opts?: ValidateOptions): Promise<T>;
  function validateModel(pathOrModel: string | KeyOf<T> | T, value?: object, opts?: ValidateOptions) {

    const _validator = validator.current;

    if (!_validator) {
      errors.current = {};
      if (typeof pathOrModel === 'string')
        return Promise.resolve(get(value, pathOrModel));
      return Promise.resolve(pathOrModel);
    }

    if (typeof pathOrModel === 'object') {
      opts = value;
      value = undefined;
    }

    opts = { abortEarly: false, ...opts };

    if (typeof pathOrModel === 'string')
      return _validator
        .validateAt(pathOrModel, value, opts)
        .catch(err => {
          setError(err, typeof pathOrModel === 'string');
        });

    return _validator
      .validate(pathOrModel, opts)
      .catch(err => {
        setError(err, typeof pathOrModel === 'string');
      });

  }

  function setTouched(path: string) {
    if (!touched.current.has(path))
      touched.current.add(path);
  }

  function removeTouched(path: string) {
    const removed = touched.current.delete(path);
    return removed;
  }

  function clearTouched() {
    touched.current.clear();
  }

  function isTouched(path?: string) {
    if (path)
      return touched.current.has(path);
    return !!touched.current.size;
  }

  function setDirty(path: string) {
    if (!dirty.current.has(path))
      dirty.current.add(path);
  }

  function removeDirty(path: string) {
    const removed = dirty.current.delete(path);
    return removed;
  }

  function clearDirty() {
    dirty.current.clear();
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
    render({});
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

  function isValid(path?: string) {
    if (path)
      return !has(errors, path);
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
    clearError();

    // Reset all fields.
    [...fields.current.values()].forEach(e => {
      e.resetElement();
    });

    // Rerender the form
    render({});

  }

  return {

    // Common
    log,
    options,
    defaults,
    fields,
    unref,
    schemaAst,

    // Form
    mounted,
    reset,

    // Model
    getDefault,
    getModel,
    setModel,
    validateModel,

    // Touched
    setTouched,
    removeTouched,
    clearTouched,
    isTouchedPath: (path: string) => isTouched(path),

    // Dirty
    setDirty,
    removeDirty,
    clearDirty,
    isDirtyPath: (path: string) => isDirty(path),

    // Errors
    errors: errors.current,
    setError,
    removeError,
    clearError,
    isValidPath: (path: string) => isValid(path),

    // Getters

    get isValidatedByUser() {
      return validator.current && typeof options.validationSchema === 'function';
    },

    get isValidatedByYup() {
      return validator.current && typeof options.validationSchema === 'object';
    }

  };

}

/**
 * Use form hook exposes Komo form hook API.
 * 
 * @param options form api options.
 */
export default function useForm<T extends IModel>(options?: IOptions<T>) {

  options = { ...DEFAULTS, ...options };

  const api = initForm(options);

  const { getModel, reset, validateModel, clearError, log } = api;

  function handleReset(handler: SubmitResetHandler<T>): (event?: SubmitResetEvent<T>) => void;
  function handleReset(event: SubmitResetEvent<T>): void;
  function handleReset(): void;
  function handleReset(eventOrHandler?: SubmitResetEvent<T> | SubmitResetHandler<T>) {

    if (typeof eventOrHandler === 'function')
      return (event: FormEvent<HTMLFormElement>) => {
        const fn = eventOrHandler as SubmitResetHandler<T>;
        if (fn)
          fn(getModel(), event, api as any);
        else
          reset(); // whoops should get here just in case reset for user.
      };

    if (options.onReset)
      return options.onReset(getModel(), eventOrHandler, api as any);

    // If we get here just use internal reset.
    reset(eventOrHandler);

  }

  function handleSubmit(handler: SubmitResetHandler<T>): (event?: SubmitResetEvent<T>) => void;
  function handleSubmit(event: SubmitResetEvent<T>): void;
  function handleSubmit(eventOrHandler: SubmitResetEvent<T> | SubmitResetHandler<T>) {

    clearError();

    const handleFinal = (handler: SubmitResetHandler<T>, event: SubmitResetEvent<T>) => {

      if (!options.validateSubmit)
        return handler(getModel(), event, api as any);

      validateModel(getModel())
        .finally(() => {
          handler(getModel(), event, api as any);
        });

    };

    if (typeof eventOrHandler === 'function')
      return (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleFinal(eventOrHandler as SubmitResetHandler<T>, event);
      };

    const _event = eventOrHandler as FormEvent<HTMLFormElement>;
    _event.preventDefault();

    if (options.onSubmit) {
      return handleFinal(options.onSubmit, _event);
    }

    // Submit called but no handler!!
    log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);

  }

  const extend = {
    register: initElement<T>(api as any),
    handleReset,
    handleSubmit
  };

  return merge(api, extend);

}
