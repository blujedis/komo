import { useRef, useEffect, FormEvent, useState, useCallback, BaseSyntheticEvent } from 'react';
import { initElement } from './register';
import { get, set, has } from 'dot-prop';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitHandler,
  IValidator,
  ISchemaAst,
  ResetHandler,
  IOptionsInternal,
  IBaseApi,
  PromiseStrict
} from './types';
import { createLogger, isString, me, isUndefined, isFunction } from './utils';
import { normalizeValidator, astToSchema } from './validate';
import { ValidateOptions, ObjectSchema, InferType } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

const DEFAULTS: IOptions<any> = {
  defaults: {},
  validateSubmit: true,
  validateBlur: true,
  validateChange: true,
  validateInit: false,
  enableNativeValidation: true,
  enableWarnings: true
};

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

    // validate form before touched.
    if (options.validateInit) {
      validateModel()
        .catch(err => {
          if (err)
            setError(err);
        });
    }

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => unregister);
    };

  }, []);

  // HELPERS //

  const log = createLogger(options.enableWarnings ? 'info' : 'error');

  const render = (status?: any) => {
    if (!status)
      return getStatus.status;
    renderStatus({ status });
  };

  const findField = (namePathOrElement: string | IRegisteredElement<T>) => {
    if (typeof namePathOrElement === 'object')
      return namePathOrElement;
    return [...fields.current.values()].find(e => e.name === namePathOrElement || e.path === namePathOrElement);
  };

  const initSchema = () => {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current)
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema as ObjectSchema<T>, findField);

    schema = options.validationSchema as any;

    return schema;

  };

  // MODEL //

  const getDefault = (path?: string) => {
    if (!path)
      return defaults.current;
    return get(defaults.current, path);
  };

  const setDefault = (pathOrModel: string | T, value?: any) => {

    if (!pathOrModel) {
      log.error(`Cannot set default value using key or model of undefined.`);
      return;
    }

    let current = { ...defaults.current };

    if (isString(pathOrModel)) {

      if (value === '')
        value = undefined;

      set(current, pathOrModel as string, value);
      defaults.current = current;

    }

    else {

      if (value)
        current = { ...current, ...pathOrModel as T };
      else
        current = pathOrModel as T;

      defaults.current = current;

    }

  };

  const setModel = useCallback((pathOrModel: string | T, value?: any) => {

    if (!pathOrModel) {
      log.error(`Cannot set default value using key or model of undefined.`);
      return;
    }

    let current = { ...model.current };

    if (isString(pathOrModel)) {

      if (value === '')
        value = undefined;

      set(current, pathOrModel as string, value);
      model.current = current;

    }

    else {

      if (value)
        current = { ...current, ...pathOrModel as T };
      else
        current = pathOrModel as T;

      model.current = current;

    }

  }, []);

  const getModel = (path?: string) => {
    if (!path)
      return model.current;
    return get<T>(model.current, path);
  };

  // TOUCHED //

  const setTouched = (name: KeyOf<T>) => {
    if (!touched.current.has(name))
      touched.current.add(name);
  };

  const removeTouched = (name: KeyOf<T>) => {
    const removed = touched.current.delete(name);
    return removed;
  };

  const clearTouched = () => {
    touched.current.clear();
  };

  const isTouched = (name?: KeyOf<T>) => {
    if (name)
      return touched.current.has(name);
    return !!touched.current.size;
  };

  // DIRTY //

  const setDirty = (name: KeyOf<T>) => {
    if (!dirty.current.has(name))
      dirty.current.add(name);
  };

  const removeDirty = (name: KeyOf<T>) => {
    const removed = dirty.current.delete(name);
    return removed;
  };

  const clearDirty = () => {
    dirty.current.clear();
  };

  const isDirty = (name?: KeyOf<T>) => {
    if (name)
      return dirty.current.has(name);
    return !!dirty.current.size;
  };

  // ERRORS //

  const setError = useCallback((nameOrErrors: KeyOf<T> | ErrorModel<T>, value?: any) => {
    const currentErrors = { ...errors.current };
    if (isString(nameOrErrors)) {
      errors.current = { ...currentErrors, [nameOrErrors as KeyOf<T>]: value };
    }
    else {
      if (value) // extend/merge errors.
        errors.current = { ...currentErrors, ...nameOrErrors as ErrorModel<T> };
      else
        errors.current = { ...nameOrErrors as ErrorModel<T> };
    }
    render('seterror');
    return errors.current;
  }, [options.validationSchema]);

  const removeError = (name: KeyOf<T>) => {
    setError(name, undefined); // this just causes a render to trigger.
    const clone = { ...errors.current };
    delete clone[name];
    errors.current = clone;
    return true;
  };

  const clearError = () => {
    errors.current = {} as any;
  };

  const isError = (name?: KeyOf<T>) => {
    if (name)
      return !has(errors, name);
    return !Object.entries(errors).length;
  };

  // VALIDATION //

  const validateModel = useCallback((opts?: ValidateOptions): PromiseStrict<T, ErrorModel<T>> => {

    const _validator = validator.current;

    if (!_validator)
      return Promise.resolve(model.current);

    opts = { abortEarly: false, ...opts };

    return _validator.validate(model.current, opts);

  }, [options.validationSchema, setError]);

  const validateModelAt = useCallback((
    nameOrElement: KeyOf<T> | IRegisteredElement<T>,
    opts?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>> => {

    const _validator = validator.current;
    const element = isString(nameOrElement) ?
      findField(nameOrElement as KeyOf<T>) : nameOrElement as IRegisteredElement<T>;

    if (!element) {
      log.error(`validateModelAt failed using missing or unknown element.`);
      return;
    }

    const currentValue = getModel(element.path);

    if (!_validator)
      return Promise.resolve(currentValue) as Promise<Partial<T>>;

    opts = { abortEarly: false, ...opts };

    if (isFunction(options.validationSchema))
      return _validator.validateAt(element.path, model.current);

    return _validator.validateAt(element.path, currentValue, opts);

  }, [options.validationSchema, setError]);

  const isValidatable = () => {
    return (typeof options.validationSchema === 'object' &&
      typeof (options.validationSchema as any)._nodes) !== 'undefined' ||
      typeof options.validationSchema === 'function';
  };

  const isValidateChange = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = findField(nameOrElement as KeyOf<T>);
    return isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
  };

  const isValidateBlur = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = findField(nameOrElement as KeyOf<T>);
    return isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
  };

  const unregister = useCallback((element: KeyOf<T> | IRegisteredElement<T>) => {

    // If string find the element in fields.
    const _element = typeof element === 'string' ?
      findField(element as string) :
      element as IRegisteredElement<T>;

    if (!_element) {
      log.warn(`Failed to unregister element of undefined.`);
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

  }, []);

  const state = {

    get isMounted() {
      return mounted.current;
    },

    get errors() {
      return errors.current;
    },

    get isSubmitting() {
      return submitting.current;
    },

    get isSubmitted() {
      return submitted.current;
    },

    get submitCount() {
      return submitCount.current;
    },

    get isValid() {
      return isError();
    },

    get isDirty() {
      return isDirty();
    },

    get isTouched() {
      return isTouched();
    }

  };

  const api: IBaseApi<T> = {

    // Common
    options,
    log,
    defaults,
    fields,
    unregister,
    schemaAst,
    render,
    findField,

    // Form
    mounted,
    state,

    // Model
    model,
    getDefault,
    setDefault,
    getModel,
    setModel,
    validator: validator.current,
    validateModel,
    validateModelAt,
    isValidatable,
    isValidateBlur,
    isValidateChange,

    // Touched
    setTouched,
    removeTouched,
    clearTouched,
    isTouched,

    // Dirty
    setDirty,
    removeDirty,
    clearDirty,
    isDirty,

    // Errors,
    errors,
    setError,
    removeError,
    clearError,
    isError,

    submitCount,
    submitting,
    submitted

  };

  return api;

}

/**
 * Use form hook exposes Komo form hook API.
 * 
 * @param options form api options.
 */
export default function useForm<T extends IModel>(options?: IOptions<T>) {

  const _options: IOptionsInternal<T> = { ...DEFAULTS, ...options as any };

  // Check if schema is object or ObjectSchema,
  // if yes get the defaults.
  if (typeof options.validationSchema === 'object') {
    const schema = options.validationSchema as any;
    const _defaults = schema._nodes ? schema.cast() : schema;
    _options.model = { ..._defaults };
  }

  if (_options.defaults)
    _options.model = { ..._options.defaults, ..._options.model };

  const base = initForm(_options);

  const {
    options: formOptions, log, defaults, render, clearDirty, clearTouched, clearError, setModel,
    fields, submitCount, submitting, submitted, validateModel, getModel,
    isValidatable, errors, setError
  } = base;

  const reset = useCallback((values: T = {} as any) => {

    // Reset all states.
    setModel({ ...defaults.current, ...values }, true);
    clearDirty();
    clearTouched();
    clearError();

    // Reset all fields.
    [...fields.current.values()].forEach(e => {
      e.reset();
    });

    submitCount.current = 0;
    submitting.current = false;
    submitted.current = false;

    // Rerender the form
    render('reset');

  }, []);

  const handleReset = useCallback((modelOrEvent?: ResetHandler<T> | BaseSyntheticEvent) => {

    if (typeof modelOrEvent === 'function') {
      return (values?: T) => {
        reset(values);
      };
    }

    reset();
    render('reset');

  }, []);

  const handleSubmit = useCallback((handler: SubmitHandler<T>) => {

    if (!handler) {
      // Submit called but no handler!!
      log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
      return;
    }

    const handleCallback = (m, e, ev) => {

      submitting.current = false;
      submitted.current = true;
      submitCount.current = submitCount.current + 1;
      errors.current = e || errors.current;
      render('submit');

      handler(m, e || {}, ev);

    };

    return async (event: FormEvent<HTMLFormElement>) => {

      submitting.current = true;

      if (event) {
        event.preventDefault();
        event.persist();
      }

      const model = getModel();
      clearError();

      // Can't validate or is disabled.
      if (!isValidatable() || !formOptions.validateSubmit) {
        await handleCallback(model, {} as any, event);
        return;
      }

      const { err } = await me<T, ErrorModel<T>>(validateModel(model));

      if (err)
        setError(err);

      await handleCallback(model, err as any, event);

    };

  }, []);

  return {

    // Elements
    register: useCallback(initElement<T>(base as any), []),
    unregister: base.unregister,

    // Form
    state: base.state,
    reset,
    handleReset,
    handleSubmit,

    // Model
    getModel: base.getModel,
    setModel: base.setModel,
    validateModel: base.validateModel,
    validateModelAt: base.validateModelAt,

    setTouched: base.setTouched,
    removeTouched: base.removeTouched,
    clearTouched: base.clearTouched,

    setDirty: base.setDirty,
    removeDirty: base.removeDirty,
    clearDirty: base.clearDirty,

    setError: base.setError,
    removeError: base.removeError,
    clearError: base.clearError,

  };

}
