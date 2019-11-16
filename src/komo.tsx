import { useRef, useEffect, FormEvent, useState, useCallback, BaseSyntheticEvent } from 'react';
import { initElement } from './register';
import get from 'lodash.get';
import set from 'lodash.set';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitHandler,
  IValidator,
  ISchemaAst,
  IKomoBase,
  PromiseStrict,
  IKomo,
  IKomoForm,
  IFormState
} from './types';
import { initHooks } from './hooks';
import {
  debuggers, isString, me, isUndefined, isFunction,
  merge, extend, isPlainObject, isObject, isArray, isEqual, toDefault
} from './utils';
import {
  normalizeValidator, astToSchema, promisifyDefaults, parseYupDefaults, isYupSchema, normalizeCasting
} from './validate';
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
  validationSchemaPurge: true,
  validateNative: false
};

const { debug_api, debug_init } = debuggers;

function initApi<T extends IModel>(options: IOptions<T>) {

  const defaults = useRef<T>({} as T);
  const model = useRef<T>({} as T);
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
  const [currentStatus, renderStatus] = useState('init');

  let state: IFormState<T> = {} as any;
  let api: IKomoBase<T> = {} as any;

  // HELPERS //

  const render = (status: string) => {
    renderStatus(status);
    debug_api('rendered', status);
  };

  function _getElement(
    namePathOrElement: string | IRegisteredElement<T>,
    asGroup: boolean): Array<IRegisteredElement<T>>;
  function _getElement(namePathOrElement: string | IRegisteredElement<T>): IRegisteredElement<T>;
  function _getElement(namePathOrElement: string | IRegisteredElement<T>, asGroup: boolean = false) {
    if (isObject(namePathOrElement))
      return namePathOrElement;
    const filtered = [...fields.current.values()]
      .filter(e => e.name === namePathOrElement || e.path === namePathOrElement);
    if (asGroup)
      return filtered;
    return filtered[0];
  }
  const getElement = useCallback(_getElement, [fields]);

  const getRegistered = useCallback((asPath: boolean = false): Array<KeyOf<T>> => {
    return [...fields.current.values()].map(f => asPath ? f.path : f.name) as any;
  }, [fields]);

  const initSchema = useCallback(() => {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current)
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema as ObjectSchema<T>, getElement);

    schema = options.validationSchema as any;

    return schema;

  }, [defaults, options.validationSchema]);

  // MODEL //

  const getDefault = (path?: string) => {
    if (!path)
      return defaults.current;
    return get(defaults.current, path);
  };

  const setDefault = useCallback((pathOrModel: string | T, value?: any) => {

    if (!pathOrModel) {
      // tslint:disable-next-line: no-console
      console.error(`Cannot set default value using key or model of undefined.`);
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
      element.reinit();
    });

  }, []);

  const setModel = useCallback((pathOrModel: string | T, value?: any) => {

    if (!pathOrModel) {
      // tslint:disable-next-line: no-console
      console.error(`Cannot set default value using key or model of undefined.`);
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

  }, [defaults, model]);

  const getModel = (path?: string) => {
    if (!path)
      return model.current;
    return get<T>(model.current, path) as any;
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

  const isDirtyCompared = (name: KeyOf<T>, value?: any, defaultValue?: any) => {

    const element = getElement(name);
    value = toDefault(value, element.value);
    defaultValue = toDefault(defaultValue, getModel(element.path));

    // Probably need to look further into this
    // ensure common and edge cases are covered.
    // NOTE: we check array here as value could
    // be multiple option group in some cases.
    return isArray(defaultValue)
      ? !isEqual(defaultValue, value)
      : !isEqual(defaultValue + '', value + '');

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
    render('error:set');
    debug_api('seterror', errors.current);
    return errors.current;
  }, [options.validationSchema]);

  const removeError = useCallback((name: KeyOf<T>) => {
    const exists = errors.current.hasOwnProperty(name);
    // causes a render to trigger then we set below.
    setError(name, undefined);
    const errs: Partial<ErrorModel<T>> = {};
    for (const k in errors.current) {
      // if (typeof errors.current[k] !== 'undefined' || k !== name)
      if (!isUndefined(errors.current[k]) || k !== name)
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

    opts = { ...opts, ...{ strict: false, abortEarly: false } };

    return _validator.validate(model.current, opts);

  }, [options.validationSchema, setError]);

  const validateModelAt = useCallback((
    nameOrElement: KeyOf<T> | IRegisteredElement<T>,
    opts?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>> => {

    const _validator = validator.current;
    const element = isString(nameOrElement) ?
      getElement(nameOrElement as KeyOf<T>) : nameOrElement as IRegisteredElement<T>;

    if (!element) {
      // tslint:disable-next-line: no-console
      console.error(`validateModelAt failed using missing or unknown element.`);
      return;
    }

    const currentValue = getModel(element.path);

    if (!_validator)
      return Promise.resolve(currentValue) as Promise<Partial<T>>;

    opts = { ...opts, ...{ strict: false, abortEarly: false } };

    return _validator.validateAt(element.path, model.current);

  }, [options.validationSchema, setError]);

  const isValidatable = () => isYupSchema(options.validationSchema) || isFunction(options.validationSchema);

  const isValidateChange = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = getElement(nameOrElement as KeyOf<T>);
    // if a virtual check the name it's mapped to.
    if (element.virtual)
      element = getElement(element.virtual);
    return isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
  };

  const isValidateBlur = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = getElement(nameOrElement as KeyOf<T>);
    if (element.virtual)
      element = getElement(element.virtual);
    return isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
  };

  const unregister = useCallback((element: KeyOf<T> | IRegisteredElement<T>) => {

    // Nothing to unregister.
    if (!fields.current.size)
      return;

    // If string find the element in fields.
    const _element = isString(element) ?
      getElement(element as string) :
      element as IRegisteredElement<T>;

    if (!_element) {
      // tslint:disable-next-line: no-console
      console.warn(`Failed to unregister element of undefined.`);
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

  state = {

    get model() {
      return model.current;
    },

    get mounted() {
      return !!mounted.current;
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

  api = {

    // Common
    options,
    defaults,
    fields,
    unregister,
    schemaAst,
    render,
    getElement,
    getRegistered,
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
    isDirtyCompared,

    // Errors,
    errors,
    setError,
    removeError,
    clearError,

    submitCount, submitting,
    submitted

  };

  return api;

}

/**
 * Use form hook exposes Komo form hook API.
 * 
 * @param options form api options.
 */
function initForm<T extends IModel>(options?: IOptions<T>) {

  const base = initApi(options);

  const {
    options: formOptions, defaults, render, clearDirty, clearTouched, clearError, setModel,
    fields, submitCount, submitting, submitted, validateModel, getModel, syncDefaults, state,
    isValidatable, errors, setError, unregister, mounted, initSchema, model, getRegistered
  } = base;

  useEffect(() => {

    const init = async () => {

      if (mounted.current)
        return;

      debug_init('fields', getRegistered());
      debug_init('schema', options.validationSchema);

      const { err, data } = await me(options.defaults as Promise<Partial<T>>);

      debug_init('defaults', data);
      if (err && isPlainObject(err))
        debug_init('err', err);

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
          }).finally(() => {
            mounted.current = true;
            render('form:effect:validate'); // this may not be needed.
          });
      }
      else {
        mounted.current = true;
        render('form:effect');
      }

    };

    init();

    return () => {
      mounted.current = false;
      [...fields.current.values()].forEach(e => {
        unregister(e);
      });

    };

  }, []);

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
    render('form:reset');

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

    if (isFunction(valuesOrEvent))
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
      // tslint:disable-next-line: no-console
      console.warn(`Cannot handleSubmit using submit handler of undefined.\n      Pass handler as "onSubmit={handleSubmit(your_submit_handler)}".\n      Or pass in options as "options.onSubmit".`);
      return;
    }

    const handleCallback = (m, e, ev) => {

      const errorKeys = Object.keys(errors.current);

      if (errorKeys.length && formOptions.validateSubmitExit) {
        // tslint:disable-next-line: no-console
        console.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
        return;
      }

      submitting.current = false;
      submitted.current = true;
      submitCount.current = submitCount.current + 1;
      errors.current = e || errors.current;
      render('form:submit');

      handler(m, e || {}, ev);

    };

    return async (event: FormEvent<HTMLFormElement>) => {

      submitting.current = true;

      if (event) {
        event.preventDefault();
        event.persist();
      }

      // Can't validate or is disabled.
      if (!isValidatable() || !formOptions.validateSubmit) {
        await handleCallback(model.current, {} as any, event);
        return;
      }

      clearError();

      const { err } = await me<T, ErrorModel<T>>(validateModel());

      if (err)
        setError(err);

      await handleCallback(model.current, err as any, event);

    };

  }

  const reset = useCallback(_resetForm, []);
  const handleReset = useCallback(_handleReset, []);
  const handleSubmit = useCallback(_handleSubmit, []);

  const api = {

    // Elements
    register: useCallback(initElement<T>(base as any), []),
    unregister: base.unregister,

    // Form
    render,
    reset,
    handleReset,
    handleSubmit,
    state,

    // Model
    getDefault: base.getDefault,
    getElement: base.getElement,
    getModel: base.getModel,
    setModel: base.setModel,
    validateModel: base.validateModel,
    validateModelAt: base.validateModelAt,

    setTouched: base.setTouched,
    removeTouched: base.removeTouched,
    clearTouched: base.clearTouched,
    isTouched: base.isTouched,

    setDirty: base.setDirty,
    removeDirty: base.removeDirty,
    clearDirty: base.clearDirty,
    isDirty: base.isDirty,

    setError: base.setError,
    removeError: base.removeError,
    clearError: base.clearError

  };

  return api as IKomoForm<T>;

}

/**
 * Initializes Komo.
 * 
 * @param options the komo options.
 */
export function initKomo<T extends IModel>(options?: IOptions<T>) {

  options = { ...DEFAULTS, ...options } as IOptions<T>;

  const normalizeYup = parseYupDefaults(options.validationSchema, options.validationSchemaPurge);
  options.validationSchema = normalizeYup.schema;
  options.defaults = promisifyDefaults(options.defaults, normalizeYup.defaults) as Promise<T>;
  options.castHandler = normalizeCasting(options.castHandler);

  const api = initForm<T>(options);

  function initWithKomo<F extends (komo: IKomo<T>) => any>(handler: F) {
    return handler(api);
  }

  api.withKomo = initWithKomo;
  const hooks = initHooks<T>(api);
  const komo = extend(api, hooks);

  return komo as IKomo<T>;

}
