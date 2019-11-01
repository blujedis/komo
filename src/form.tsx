import { useRef, useEffect, FormEvent, useState, MutableRefObject, useCallback, BaseSyntheticEvent } from 'react';
import { initElement } from './register';
import { get, set, delete as del, has } from 'dot-prop';
import mixin from 'mixin-deep';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitHandler,
  SubmitResetEvent,
  IValidator,
  ISchemaAst,
  ErrorKey,
  ResetHandler,
  IOptionsInternal
} from './types';
import { merge, createLogger, isObject, isString, me } from './utils';
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
export function initForm<T extends IModel>(options: IOptionsInternal<T>) {

  const defaults = useRef<T>({ ...options.model });
  const model = useRef<T>({ ...options.model });
  const fields = useRef(new Set<IRegisteredElement<T>>());
  const touched = useRef(new Set<KeyOf<T>>());
  const dirty = useRef(new Set<KeyOf<T>>());
  const errors = useRef<ErrorModel<T>>({} as any);
  const validator = useRef<IValidator<T>>();
  const schemaAst = useRef<ISchemaAst>();
  const mounted = useRef(false);
  const submitCount = useRef(0);
  const submitting = useRef(false);
  const submitted = useRef(false);
  const [getStatus, renderStatus] = useState({ status: 'init' });

  useEffect(() => {

    mounted.current = true;
    initSchema();

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => unref);
    };

  }, []);

  const log = createLogger(options.enableWarnings ? 'info' : 'error');

  function rerender(status: any) {
    status = status || Date.now();
    renderStatus({ status });
  }

  function initSchema() {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current)
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema as ObjectSchema<T>);

    schema = options.validationSchema as any;

    return schema;

  }

  function getDefault(path?: string) {
    if (!path)
      return defaults.current;
    return get(defaults.current, path);
  }

  function setModel(path: string, value: any, setDefault?: boolean);
  function setModel(model: T);
  function setModel(pathOrModel: string | T, value?: any, setDefault: boolean = false) {

    if (!pathOrModel) {
      log.error(`Cannot set model using key or model of undefined.`);
      return;
    }

    if (arguments.length >= 2) {
      if (value === '')
        value = undefined;
      model.current = set({ ...model.current }, pathOrModel as string, value);
      if (setDefault)
        defaults.current = set({ ...defaults.current }, pathOrModel as string, value);
    }

    else {
      model.current = { ...model.current, ...pathOrModel as T };
    }

  }

  function getModel(path: string): any;
  function getModel(): T;
  function getModel(path?: string) {
    if (!path)
      return model.current;
    return get(model.current, path);
  }

  function validateModel(name: KeyOf<T>, path: string, value: object, opts?: ValidateOptions): Promise<any>;
  function validateModel(model: T, opts?: ValidateOptions): Promise<T>;
  function validateModel(
    nameOrModel: KeyOf<T> | T, path?: string | ValidateOptions, value?: object, opts?: ValidateOptions) {

    const _validator = validator.current;

    if (!_validator) {
      errors.current = {} as any;
      if (typeof nameOrModel === 'string')
        return Promise.resolve(get(value, nameOrModel));
      return Promise.resolve(nameOrModel);
    }

    if (typeof nameOrModel === 'object') {
      opts = value;
      value = undefined;
    }

    opts = { abortEarly: false, ...opts };

    if (typeof nameOrModel === 'string') {
      return _validator
        .validateAt(path as string, value, opts)
        .catch(err => {
          setError(nameOrModel as ErrorKey<T>, err);
          return Promise.reject(errors.current);
        });
    }

    return _validator
      .validate(nameOrModel, opts)
      .catch(err => {
        setError(err, typeof nameOrModel === 'string');
        return Promise.reject(errors.current);
      });

  }

  function setTouched(name: KeyOf<T>) {
    if (!touched.current.has(name))
      touched.current.add(name);
  }

  function removeTouched(name: KeyOf<T>) {
    const removed = touched.current.delete(name);
    return removed;
  }

  function clearTouched() {
    touched.current.clear();
  }

  function isTouched(name?: KeyOf<T>) {
    if (name)
      return touched.current.has(name);
    return !!touched.current.size;
  }

  function setDirty(name: KeyOf<T>) {
    if (!dirty.current.has(name))
      dirty.current.add(name);
  }

  function removeDirty(name: KeyOf<T>) {
    const removed = dirty.current.delete(name);
    return removed;
  }

  function clearDirty() {
    dirty.current.clear();
  }

  function isDirty(name?: KeyOf<T>) {
    if (name)
      return dirty.current.has(name);
    return !!dirty.current.size;
  }

  function setError(name: ErrorKey<T>, value: any): ErrorModel<T>;
  function setError(errs: object): ErrorModel<T>;
  function setError(nameOrErrors: ErrorKey<T> | object, value?: any) {
    if (isString(nameOrErrors))
      errors.current = { ...errors.current, [nameOrErrors as ErrorKey<T>]: value };
    else
      errors.current = { ...nameOrErrors as ErrorModel<T> };
    rerender('seterror');
    return errors.current;
  }

  function removeError(name: ErrorKey<T>) {
    const clone = { [name]: undefined, ...errors.current };
    errors.current = clone;
  }

  function clearError() {
    errors.current = {} as any;
  }

  function isValid(name?: ErrorKey<T>) {
    if (name)
      return !has(errors, name);
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
    removeDirty(_element.name);
    removeTouched(_element.name);
    removeError(_element.name);

    // Unbind any listener events.
    _element.unbind();

    // Delete the element from fields collection.
    fields.current.delete(_element);

  }

  function reset(values?: T) {

    // Reset all states.
    model.current = { ...defaults.current, ...values };
    clearDirty();
    clearTouched();
    clearError();

    // Reset all fields.
    [...fields.current.values()].forEach(e => {
      e.resetElement();
    });

    submitCount.current = 0;
    submitting.current = false;
    submitted.current = false;

    // Rerender the form
    rerender('reset');

  }

  function handleReset(modelOrEvent?: ResetHandler<T> | BaseSyntheticEvent) {

    if (typeof modelOrEvent === 'function') {
      return (values?: T) => {
        reset(values);
      };
    }

    reset();
    rerender('reset');

  }

  function handleSubmit(handler: SubmitHandler<T>) {

    if (!handler) {
      // Submit called but no handler!!
      log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
      return;
    }

    return async (event: FormEvent<HTMLFormElement>) => {
      submitting.current = true;
      if (event) {
        event.preventDefault();
        event.persist();
      }
      if (!options.validateSubmit)
        return handler(model.current, {} as any, event);
      const { err } = await me(validateModel(model.current));
      await handler(model.current, err as any, event);
      submitting.current = false;
      submitted.current = true;
      submitCount.current = submitCount.current + 1;
      rerender('submit');
    };

  }

  return {

    // Common
    log,
    options,
    defaults,
    fields,
    unref,
    schemaAst,
    rerender,

    // Form
    mounted,
    reset: useCallback(reset, []),
    handleReset: useCallback(handleReset, []),
    handleSubmit: useCallback(handleSubmit, []),

    // Model
    getDefault,
    getModel,
    setModel,
    validateModel,

    // Touched
    setTouched,
    removeTouched,
    clearTouched,

    // Dirty
    setDirty,
    removeDirty,
    clearDirty,

    // Errors,
    errors: errors.current,
    setError,
    removeError,
    clearError,

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

  const _options: IOptionsInternal<T> = { ...DEFAULTS, ...options };

  // Check if schema is object or ObjectSchema,
  // if yes get the defaults.
  if (typeof options.validationSchema === 'object') {
    const schema = options.validationSchema as any;
    const defaults = schema._nodes ? schema.cast() : schema;
    _options.model = { ...defaults };
  }

  const api = initForm(_options);

  const extend = {
    register: useCallback(initElement<T>(api as any), []),
  };

  return merge(api, extend);

}

// register
// unregister
// renderBaseOnError
// setValueInternal
// executeValidation
// executeSchemaValidation
// triggerValidation
// setValue
// removeEventListenerAndRef
// reset