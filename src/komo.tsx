import {
  useRef, useEffect, FormEvent, useState, useCallback,
  BaseSyntheticEvent
} from 'react';
import { initElement } from './register';
import get from 'lodash.get';
import set from 'lodash.set';
import has from 'lodash.has';
import {
  IOptions, IModel, KeyOf, IRegisteredElement, ErrorModel,
  SubmitHandler,
  IValidator,
  ISchemaAst,
  IKomoBase,
  PromiseStrict,
  IKomo,
  IFormState,
  IKomoInternal
} from './types';
import { initHooks } from './hooks';
import {
  debuggers, isString, promise, isUndefined, isFunction,
  merge, extend, isPlainObject, isObject, isArray, isEqual, toDefault
} from './utils';
import {
  normalizeValidator, astToSchema, promisifyDefaults, parseDefaults as parseSchema, isYupSchema, normalizeCasting
} from './validate';
import { ValidateOptions, ObjectSchema, InferType } from 'yup';

/**
 * Native Validation reference.
 * @see https://www.html5rocks.com/en/tutorials/forms/constraintvalidation/
 */

const DEFAULTS: IOptions<any> = {
  validateSubmit: true,
  validateBlur: true,
  validateChange: false,
  validateInit: false,
  validationSchemaPurge: true,
  validateNative: false,
  cleanVanities: false
};

const { debug_api, debug_init } = debuggers;

function initApi<T extends IModel>(options: IOptions<T>) {

  const defaults = useRef<T>({} as T);
  const defaultKeys = useRef<string[]>([]);
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
  const [currentStatus, renderStatus] = useState({ status: 'init' });

  let state: IFormState<T> = {} as any;
  let api: IKomoBase<T> = {} as any;

  // HELPERS //

  const render = (status: string) => {
    renderStatus({ ...currentStatus, status });
    debug_api('rendered', status);
  };

  function _getElement(
    namePathOrElement: string | IRegisteredElement<T>,
    asGroup: boolean): IRegisteredElement<T>[];
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

  const getRegistered = useCallback((asPath: boolean = false): KeyOf<T>[] => {
    return [...fields.current.values()].map(f => asPath ? f.path : f.name) as any;
  }, [fields]);

  const initSchema = () => {

    let schema: T & InferType<typeof options.validationSchema>;

    if (schemaAst.current) {
      options.validationSchema = astToSchema(schemaAst.current, options.validationSchema as ObjectSchema<T>);
    }

    // Create the validator.
    validator.current = normalizeValidator(options.validationSchema as ObjectSchema<T>, getElement, fields, vanities(), schemaAst.current);

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

  };

  const syncDefaults = (defs: T, isReinit = false) => {

    defaults.current = merge({ ...defaults.current }, { ...defs });

    // When reinitializing defaults should
    // be favored over the current model.
    if (isReinit)
      model.current = merge({ ...model.current }, { ...defs });

    // If not mounted then defaults should override the current model.
    else if (!mounted.current)
      model.current = merge({ ...model.current }, { ...defs });

    // If we get here model wins.
    else
      model.current = merge({ ...defs }, { ...model.current });

    const keys = Object.keys(defs);

    defaultKeys.current = keys;

    // Iterate bound elements and update default values.
    [...fields.current.values()].forEach(element => {

      if (keys.includes(element.name) && element.virtual)
        // tslint:disable-next-line: no-console
        console.error(`Attempted to set bound property "${element.name}" as vanity, try useField('${element.name}') NOT useField('${element.name}', true).`);

      element.reinit();

    });

  };

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

  }, [defaults.current, model]);

  const hasModel = (path?: string) => {
    return has(model.current, path);
  };

  const vanities = () => {
    return Object.keys(model.current).filter(k => !defaultKeys.current.includes(k));
  };

  const cleanModel = (m) => {
    const _model = {} as any;
    for (const k in m) {
      if (!m.hasOwnProperty(k) || !defaultKeys.current.includes(k)) continue;
      _model[k] = m[k];
    }
    return _model;
  };

  const getModel = (path?: string | boolean, clean: boolean = false) => {
    if (typeof path === 'boolean') {
      clean = true;
      path = undefined;
    }
    if (!path) {
      if (clean)
        return cleanModel(model.current);
      return model.current;
    }

    return get<T>(model.current, path as any) as any;
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

  const prepareCompare = (value) => {

    if (isArray(value))
      value.sort();

    if (isPlainObject(value)) {
      value = Object.keys(value).sort().reduce((a, c) => {
        a[c] = value[c];
        return a;
      }, {});
    }

    return String(value);

  };

  // If not compare value the model value is used.
  const isDirtyCompared = (name: KeyOf<T>, value: any, compareValue?: any) => {
    const element = getElement(name);
    const modelValue = getModel(element.path);
    compareValue = toDefault(compareValue, modelValue);
    value = prepareCompare(value);
    compareValue = prepareCompare(compareValue);
    return !isEqual(value, compareValue);
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
    return isUndefined(element.validateChange) ? options.validateChange : element.validateChange;
  };

  const isValidateBlur = (nameOrElement: KeyOf<T> | IRegisteredElement<T>) => {
    let element = nameOrElement as IRegisteredElement<T>;
    if (isString(nameOrElement))
      element = getElement(nameOrElement as KeyOf<T>);
    return isUndefined(element.validateBlur) ? options.validateBlur : element.validateBlur;
  };

  const unregister = (element: KeyOf<T> | IRegisteredElement<T>) => {

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

  };

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

    get vanities() {
      return vanities();
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
    hasModel,
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
function initForm<T extends IModel>(options: IOptions<T>) {

  const base = initApi(options);

  const {
    options: formOptions, defaults, render, clearDirty, clearTouched, clearError, setModel,
    fields, submitCount, submitting, submitted, validateModel, validateModelAt, syncDefaults, state, hasModel, isValidatable, errors, setError, unregister, mounted, initSchema, model, getRegistered, getModel, removeError, isDirty, isTouched, getDefault, getElement
  } = base;

  async function init(defs?, isReinit = false, validate = false) {

    if (typeof defs === 'boolean') {
      validate = isReinit;
      isReinit = defs;
      defs = undefined;
    }

    if (mounted.current && !isReinit)
      return;

    debug_init('mount:fields', getRegistered());
    debug_init('mount:schema', options.validationSchema);

    let _defaults = options.promisifiedDefaults as Promise<Partial<T>>;

    // TODO: Need to fix typings so .yupDefaults exists.
    if (defs)
      _defaults = promisifyDefaults(defs, options.normalizedDefaults) as Promise<T>;

    const { err, data } = await promise(_defaults);

    debug_init('mount:defaults', data);

    if (err && isPlainObject(err))
      debug_init('err', err);

    // Err and data both 
    syncDefaults({ ...err, ...data });

    // Init normalize the validation schema.
    if (!isReinit)
      initSchema();

    // if not reinit just use options
    // otherwise check if user wants
    // to validate. (default: false)
    const shouldValidate = !isReinit ? options.validateInit : validate;

    // validate form before touched.
    if (shouldValidate) {
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

  }

  const update = (m: Partial<T>, validate: boolean = false) => {
    setModel(m as T);
    init(m, true, validate);
  };

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

    const handleCallback = (_model, _errors, _event) => {

      const errorKeys = Object.keys(errors.current);

      if (errorKeys.length && formOptions.validateSubmitExit) {
        // tslint:disable-next-line: no-console
        console.warn(`Failed to submit invalid form with the following error properties: "${errorKeys.join(', ')}"`);
        return;
      }

      submitting.current = false;
      submitted.current = true;
      submitCount.current = submitCount.current + 1;
      errors.current = _errors || errors.current;
      render('form:submit');

      handler(_model, _errors || {}, _event);

    };

    return async (event: FormEvent<HTMLFormElement>) => {

      submitting.current = true;

      if (event) {
        event.preventDefault();
        event.persist();
      }

      // Clean properties not defined in
      // original model.
      const _model = formOptions.cleanVanities ? getModel(true) : model.current;

      // Can't validate or is disabled.
      if (!isValidatable() || !formOptions.validateSubmit) {
        await handleCallback(_model, {} as any, event);
        return;
      }

      clearError();


      const { err, data } = await promise<T, ErrorModel<T>>(validateModel());

      if (err)
        setError(err);

      await handleCallback(_model, err as any, event);

    };

  }

  const reset = _resetForm;
  const handleReset = _handleReset;
  const handleSubmit = _handleSubmit;

  const api: IKomoInternal<T> = {

    // Elements
    mounted,
    register: initElement<T>(base as any),
    unregister,

    // Form
    render,
    init,
    reinit: (defs?) => init(defs, true),
    reset,
    handleReset,
    handleSubmit,
    state,
    fields,

    // Model
    getDefault,
    getElement,
    hasModel,
    getModel,
    setModel,
    validateModel,
    validateModelAt,
    update,

    isTouched,
    isDirty,

    setError,
    removeError,
    clearError

  };

  return api;

}

export type Options<T, D> = Omit<IOptions<T, D>, 'promisifiedDefaults' | 'normalizedDefaults'>;



/**
 * Initializes Komo.
 * 
 * @param options the komo options.
 */
export function initKomo<T extends IModel, D extends IModel = {}>(options?: Options<T, D>) {

  type Model = T & Partial<D>;

  const initDefaults = useRef(null);

  const _options = { ...DEFAULTS, ...options } as IOptions<Model>;

  const normalizedSchema = parseSchema(_options.validationSchema, _options.validationSchemaPurge);
  _options.validationSchema = normalizedSchema.schema;
  _options.normalizedDefaults = normalizedSchema.defaults;
  _options.promisifiedDefaults = promisifyDefaults(options.defaults, normalizedSchema.defaults) as Promise<Model>;
  _options.castHandler = normalizeCasting(_options.castHandler);

  const api = initForm<Model>(_options);

  // Override setModel so exposed method
  // causes render.
  const { render, setModel } = api;

  api.setModel = (pathOrModel, value?) => { setModel(pathOrModel, value); render(`model:set`); };

  const hooks = initHooks<Model>(api);
  const komo = extend(api, hooks);

  // Init after effect.
  useEffect(() => {

    if (initDefaults.current === null)
      initDefaults.current = options.defaults;

    if (!api.mounted.current) {
      api.init();
    }
    else if (api.mounted.current) {
      initDefaults.current = options.defaults;
      api.init(options.defaults as any, true);
    }

    return () => {
      api.mounted.current = false;
      [...api.fields.current.values()].forEach(e => {
        api.unregister(e);
      });

    };

  }, [options.defaults && options.defaults !== initDefaults.current]);

  return komo as IKomo<Model>;

}
