import { useRef, useEffect, FormEvent, useState, useCallback, BaseSyntheticEvent } from 'react';
import { initElement } from './register';
import { get, set } from 'dot-prop';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitHandler,
  IValidator,
  ISchemaAst,
  IOptionsInternal,
  IBaseApi,
  PromiseStrict,
  IKomo,
  IKomoExtended
} from './types';
import { initHooks } from './hooks';
import { createLogger, isString, me, isUndefined, isFunction, merge, extend } from './utils';
import { normalizeValidator, astToSchema, normalizeDefaults } from './validate';
import { ValidateOptions, ObjectSchema, InferType } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

const DEFAULTS: IOptions<any> = {
  defaults: {},
  validateSubmit: true,
  validateBlur: true,
  validateChange: false,
  validateInit: false,
  enableNativeValidation: false,
  enableWarnings: true
};

function initApi<T extends IModel>(options: IOptionsInternal<T>) {

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

  // HELPERS //

  const log = createLogger(options.enableWarnings ? 'info' : 'error');

  const render = (status?: any) => {
    if (!status)
      return getStatus.status;
    renderStatus({ status });
  };

  const getElement = useCallback((namePathOrElement: string | IRegisteredElement<T>) => {
    if (typeof namePathOrElement === 'object')
      return namePathOrElement;
    return [...fields.current.values()].find(e => e.name === namePathOrElement || e.path === namePathOrElement);
  }, []);

  const initSchema = useCallback(() => {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current)
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema as ObjectSchema<T>, getElement);

    schema = options.validationSchema as any;

    return schema;

  }, []);

  // MODEL //

  const getDefault = (path?: string) => {
    if (!path)
      return defaults.current;
    return get(defaults.current, path);
  };

  const setDefault = useCallback((pathOrModel: string | T, value?: any) => {

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

  }, []);

  const syncDefaults = useCallback((defs: T) => {

    defaults.current = merge({ ...defaults.current }, { ...defs });
    model.current = merge({ ...defs }, { ...model.current });

    // Iterate bound elements and update default values.
    [...fields.current.values()].forEach(element => {
      element.rebind();
    });

  }, []);

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

  }, [defaults.current, model.current]);

  const getModel = useCallback((path?: string) => {
    if (!path)
      return model.current;
    return get<T>(model.current, path);
  }, [defaults]);

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

  const isTouched = useCallback((name?: KeyOf<T>) => {
    if (name)
      return touched.current.has(name);
    return !!touched.current.size;
  }, []);

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

  const isDirty = useCallback((name?: KeyOf<T>) => {
    if (name)
      return dirty.current.has(name);
    return !!dirty.current.size;
  }, []);

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
    for (const k in errors.current) {
      if (isUndefined(errors.current[k]))
        delete errors.current[k];
    }
    render('seterror');
    return errors.current;
  }, [options.validationSchema]);

  const removeError = useCallback((name: KeyOf<T>) => {
    const exists = errors.current.hasOwnProperty(name);
    // causes a render to trigger then we set below.
    // saves us a render actually.
    setError(name, undefined);
    const errs: Partial<ErrorModel<T>> = {};
    for (const k in errors.current) {
      if (typeof errors.current[k] !== 'undefined' || k !== name)
        errs[k] = errors.current[k];
    }
    errors.current = errs as any;
    // Just so we know if something actually deleted.
    if (exists)
      return true;
    return false;
  }, [options.validationSchema, setError]);

  const clearError = () => {
    errors.current = {} as any;
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
      getElement(nameOrElement as KeyOf<T>) : nameOrElement as IRegisteredElement<T>;

    if (!element) {
      log.error(`validateModelAt failed using missing or unknown element.`);
      return;
    }

    let currentValue = getModel(element.path);

    if (!_validator)
      return Promise.resolve(currentValue) as Promise<Partial<T>>;

    opts = { abortEarly: false, ...opts };

    if (isFunction(options.validationSchema))
      return _validator.validateAt(element.path, model.current);

    currentValue = (currentValue as any) === '' ? undefined : currentValue;

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
      element = getElement(nameOrElement as KeyOf<T>);
    return isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
  };

  const isValidateBlur = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = getElement(nameOrElement as KeyOf<T>);
    return isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
  };

  const unregister = useCallback((element: KeyOf<T> | IRegisteredElement<T>) => {

    // Nothing to unregister.
    if (!fields.current.size)
      return;

    // If string find the element in fields.
    const _element = typeof element === 'string' ?
      getElement(element as string) :
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

    get model() {
      return model.current;
    },

    get isMounted() {
      return mounted.current;
    },

    get errors() {
      return errors.current;
    },

    get touched() {
      return [...touched.current.keys()];
    },

    get dirty() {
      return [...dirty.current.keys()];
    },

    get valid() {
      return !Object.entries(errors.current).length;
    },

    get invalid() {
      return !!Object.entries(errors.current).length;
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
    getElement,
    initSchema,

    // Form
    mounted,
    state,

    // Model
    model,
    getDefault,
    setDefault,
    syncDefaults,
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
export function initForm<T extends IModel>(options?: IOptions<T>) {

  const _options: IOptionsInternal<T> = { ...DEFAULTS, ...options as any };

  const base = initApi(_options);

  const {
    options: formOptions, log, defaults, render, clearDirty, clearTouched, clearError, setModel,
    fields, submitCount, submitting, submitted, validateModel, getModel, syncDefaults,
    isValidatable, errors, setError, unregister, mounted, initSchema, model
  } = base;

  useEffect(() => {

    // May need to update model defaults
    // again from user here.
    mounted.current = true;

    // [...fields.current.values()].map(e => console.log(e.name))

    const init = async () => {

      const normalized = normalizeDefaults(options.defaults, options.validationSchema) as Promise<T>;
      const { err, data } = await me(normalized);

      // Err and data both 
      syncDefaults({ ...err, ...data });

      // Init normalize the validation schema.
      initSchema();

      // validate form before touched.
      if (options.validateInit) {
        validateModel()
          .catch(valErr => {
            if (valErr)
              setError(valErr);
          });
      }

    };

    init();

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => {
        unregister(e);
      });
    };

  }, [unregister]);

  /**
   * Manually resets model, dirty touched and clears errors.
   * 
   * @param values new values to reset form with.
   */
  function _resetForm(values: T = {} as any) {

    // Reset all states.
    setModel({ ...defaults.current, ...values });
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

  }

  /**
   * Default form reset.
   * 
   * @param event the form's reset event.
   */
  function _handleReset(event: BaseSyntheticEvent): Promise<void>;

  /**
   * Resets the form with new values.
   * 
   * @param values new values to update the form with.
   */
  function _handleReset(values: T): (event: BaseSyntheticEvent) => Promise<void>;
  function _handleReset(valuesOrEvent?: T | BaseSyntheticEvent) {

    const handleCallback = async (event, values?: T) => {
      if (event) {
        event.preventDefault();
        event.persist();
      }
      await reset(values);
    };

    if (typeof valuesOrEvent === 'function')
      return (event: BaseSyntheticEvent) => {
        return handleCallback(event, valuesOrEvent as T);
      };

    return handleCallback(valuesOrEvent);

  }

  /**
   * Handles form submission.
   * 
   * @param handler submit handler function.
   */
  function _handleSubmit(handler: SubmitHandler<T>) {

    if (!handler) {
      // Submit called but no handler!!
      log.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
      return;
    }

    const handleCallback = (m, e, ev) => {

      const errorKeys = Object.keys(errors.current);

      if (errorKeys.length && formOptions.validateSubmitExit) {
        log.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
        return;
      }

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

      const _model = getModel();

      // Can't validate or is disabled.
      if (!isValidatable() || !formOptions.validateSubmit) {
        await handleCallback(model, {} as any, event);
        return;
      }

      clearError();

      const { err } = await me<T, ErrorModel<T>>(validateModel(_model));

      if (err)
        setError(err);

      await handleCallback(_model, err as any, event);

    };

  }

  const reset = useCallback(_resetForm, []);
  const handleReset = useCallback(_handleReset, []);
  const handleSubmit = useCallback(_handleSubmit, []);

  return {

    // Elements
    register: useCallback(initElement<T>(base as any), []),
    unregister: base.unregister,

    // Form
    render,
    state: base.state,
    reset,
    handleReset,
    handleSubmit,

    // Model
    getElement: base.getElement,
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
    clearError: base.clearError

  };

}

/**
 * Initializes Komo.
 * 
 * @param options the komo options.
 */
export function initKomo<T extends IModel>(options?: IOptions<T>) {
  const api = initForm<T>(options) as IKomoExtended<T>;
  function initWithKomo<F extends (komo: IKomo<T>) => any>(handler: F) {
    return handler(api);
  }
  api.withKomo = initWithKomo;
  const hooks = initHooks(api);
  const komo = extend(api, hooks);
  return komo as IKomo<T>;
}
