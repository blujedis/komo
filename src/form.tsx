import { useRef, useEffect, FormEvent, useState, MutableRefObject } from 'react';
import { initElement } from './register';
import { get, set, delete as del, has } from 'dot-prop';
import mixin from 'mixin-deep';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitResetHandler,
  SubmitResetEvent,
  IValidator,
  ISchemaAst,
  ErrorKey
} from './types';
import { merge, createLogger, isObject, isString } from './utils';
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

  const defaults = useRef({ ...options.model });
  const model = useRef({ ...options.model });
  const fields = useRef(new Set<IRegisteredElement<T>>());
  const touched = useRef(new Set<KeyOf<T>>());
  const dirty = useRef(new Set<KeyOf<T>>());
  const errors = useRef<ErrorModel<T>>({} as any);
  const validator = useRef<IValidator<T>>();
  const schemaAst = useRef<ISchemaAst>();
  const mounted = useRef(false);
  const [, render] = useState({});

  useEffect(() => {

    mounted.current = true;
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
      model.current = set({ ...model.current }, pathOrModel as K, value);
      if (setDefault)
        defaults.current = set({ ...defaults.current }, pathOrModel as string, value);
    }

    else {
      model.current = { ...model.current, ...pathOrModel as T };
    }

  }

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

    if (typeof nameOrModel === 'string')
      return _validator
        .validateAt(path as string, value, opts)
        .catch(err => {
          setError(nameOrModel as ErrorKey<T>, err);
        });

    return _validator
      .validate(nameOrModel, opts)
      .catch(err => {
        setError(err, typeof nameOrModel === 'string');
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

    render({});
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
    isTouchedPath: (name: ErrorKey<T>) => isTouched(name),

    // Dirty
    setDirty,
    removeDirty,
    clearDirty,
    isDirtyPath: (name: ErrorKey<T>) => isDirty(name),

    // Errors
    errors: errors.current,
    setError,
    removeError,
    clearError,
    isValidPath: (name: ErrorKey<T>) => isValid(name),

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
