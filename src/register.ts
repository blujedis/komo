
import {
  isRadio, isCheckbox, addListener, isTextLike, removeListener,
  initObserver, isBooleanLike, isEqual, isString, isUndefined, isNullOrUndefined, me, isFunction,
  isObject
} from './utils';
import { getNativeValidators, getNativeValidatorTypes } from './validate';
import {
  IRegisterElement, IRegisterOptions, IRegisteredElement,
  IModel, INativeValidators, KeyOf, IBaseApi, RegisterElement
} from './types';

const typeMap = {
  range: 'number',
  number: 'number',
  email: 'string',
  url: 'string',
  checkbox: 'boolean'
};

/**
 * Creates initialized methods for binding and registering an element.
 * 
 * @param api the base form api.
 */
export function initElement<T extends IModel>(api?: IBaseApi<T>) {

  const {
    options: formOptions, log, schemaAst, fields, unregister, mounted, setModel,
    getModel, getDefault, isTouched, isDirty, setDefault,
    setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange,
    validateModelAt, isValidatable, removeError, setError
  } = api;

  /**
   * Resets the element to its defaults.
   * 
   * @param element the element to be reset.
   * @param isInit when true is setting initial defaults.
   */
  function resetElement(element: IRegisteredElement<T>, isInit: boolean = false) {

    let value;

    if (isRadio(element.type)) {
      element.checked = element.defaultChecked;
      if (element.checked)
        value = element.value;

    }

    else if (isCheckbox(element.type)) {
      value = element.defaultChecked = isBooleanLike(element.defaultChecked);
      element.checked = value;
    }

    else if (element.multiple) {

      value = [...element.defaultValue];

      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (value.includes(opt.value || opt.text))
          opt.setAttribute('selected', 'true');
      }

    }

    else {
      value = element.defaultValue;
    }

    if (!isUndefined(value)) {
      setModel(element.path, value);
      if (isInit)
        setDefault(element.path, value);
    }

  }

  /**
   * Updates the element on event changes.
   * 
   * @param element the registered element to be updated.
   * @param isBlur indicates the update event is of type blur.
   */
  function updateElement(element: IRegisteredElement<T>, isBlur: boolean = false) {

    // Previous value & flags.
    const defaultValue = getDefault(element.path);
    const prevTouched = isTouched(element.name);
    const prevDirty = isDirty(element.name);

    let value: any;
    let touched = false;
    let dirty = false;

    // On change always set local touched.
    if (!isBlur)
      touched = true;

    if (isRadio(element.type)) {

      const radios =
        [...fields.current.values()]
          .filter(e => isRadio(e.type) && e.name === element.name);

      const checked = radios.find(e => e.checked);
      value = (checked && checked.value) || '';
    }

    else if (isCheckbox(element.type)) {
      value = element.checked;
    }

    else if (element.multiple) {

      value = [];

      // tslint:disable-next-line
      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (opt.selected)
          value.push(opt.value || opt.text);
      }

    }

    else {
      value = element.value;
    }

    dirty = !isEqual(defaultValue + '', value + '');

    // If is dirty on blur then
    // it is also touched.
    if (isBlur)
      touched = !!dirty || prevTouched;

    if (dirty)
      setDirty(element.name);

    if (touched)
      setTouched(element.name);

    if (!dirty && prevDirty)
      removeDirty(element.name);

    // Set the model value.
    setModel(element.path, value);

  }

  /**
   * Binds and element and attaches specified event listeners.
   * 
   * @param element the element to be bound.
   */
  function bindElement(element: IRegisteredElement<T>) {

    if (!element || fields.current.has(element as IRegisteredElement<any>)) return;

    if (!element.name) {
      log.warn(`Element of tag "${element.tagName}" could NOT be registered using name of undefined.`);
      return;
    }

    // Normalize path, get default values.

    element.path = element.path || element.name;

    if (!element.type)
      element.setAttribute('type', 'text');

    // Get the model by key.

    const modelVal = getModel(element.path);

    if (isRadio(element.type)) {
      element.defaultValue = element.initValue || element.value || modelVal || '';
      element.defaultChecked = element.initChecked || element.checked || modelVal === element.value;
    }

    else if (isCheckbox(element.type)) {
      element.defaultValue = element.initValue || element.value || element.checked || modelVal || false;
      element.defaultChecked = element.defaultValue || false;

    }

    else if (element.multiple) {

      let arr = element.defaultValue = element.initValue || element.value || modelVal || [];

      if (!Array.isArray(arr))
        arr = [element.defaultValue];

      arr = arr.filter(v => !isUndefined(v));

      // Ensure initial value includes
      // any default selected values in options.
      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (opt.selected) {
          if (!arr.includes(opt.value || opt.text))
            arr.push(opt.value || opt.text);
        }
      }

      element.defaultValue = arr;

    }

    else {
      element.defaultValue = element.value || modelVal || '';
    }

    const allowNative = !isUndefined(element.enableNativeValidation) ?
      element.enableNativeValidation : formOptions.enableNativeValidation;

    // NOTE: This should probably be refactored to
    // own file for greater flexibility/options.
    if (allowNative && !isFunction(formOptions.validationSchema)) {

      const nativeValidators = getNativeValidators(element);
      const nativeValidatorTypes = getNativeValidatorTypes(element);

      if (nativeValidators.length || nativeValidatorTypes.length) {

        schemaAst.current = schemaAst.current || {};
        schemaAst.current[element.path] = schemaAst.current[element.path] || [];

        const baseType = typeMap[element.type];

        // Set the type.
        schemaAst.current[element.path] = [[baseType || 'string', undefined]];

        // These are basically sub types of string
        // like email or string.
        if (nativeValidatorTypes.length) {
          schemaAst.current[element.path].push([element.type as any, undefined]);
        }

        // Extend AST with each native validator.
        if (nativeValidators.length)
          nativeValidators.forEach(k => {
            schemaAst.current[element.path].push([k as KeyOf<INativeValidators>, element[k]]);
          });

      }

    }

    // Set the Initial Value.

    resetElement(element, true);

    // Bind events

    let events = [];

    element.validate = async () => {

      const currentValue = getModel(element.path);

      if (!isValidatable())
        return Promise.resolve(currentValue);

      const { err, data } = await me(validateModelAt(element));

      if (err) {
        setError(element.name, err[element.name]);
        return Promise.reject(err);
      }

      removeError(element.name);
      return Promise.resolve(data);

    };

    // Reset the element to initial values.
    element.reset = () => {
      resetElement(element);
    };

    // Unbind events helper.
    element.unbind = () => {
      if (!events.length)
        return;
      events.forEach(tuple => {
        const [event, handler] = tuple;
        removeListener(element, event, handler);
      });
    };

    // Unbind any events and then unref
    // the lement from any collections.
    element.unregister = () => {
      unregister(element as IRegisteredElement<any>);
    };

    const handleBlur = async (e: Event) => {
      updateElement(element, true);
      if (isValidateBlur(element))
        await me(element.validate());
    };

    const handleChange = async (e: Event) => {
      updateElement(element);
      if (isValidateChange(element))
        await me(element.validate());
    };

    // Attach blur
    addListener(element, 'blur', handleBlur);
    events = [['blur', handleBlur]];

    // Attach change.
    const changeEvent = isTextLike(element.type) ? 'input' : 'change';
    addListener(element, changeEvent, handleChange);
    events = [...events, [changeEvent, handleChange]];

    // Bind mutation observer.
    initObserver(element as any, element.unregister.bind(element));

    // Add to current fields collection.
    fields.current.add(element as IRegisteredElement<any>);

  }

  /**
   * Registers and element with Komo context returning function which receive the element to be registered.
   * 
   * @param options options to register element with.
   */
  function registerElement(options: IRegisterOptions): RegisterElement;

  /**
   * Registers an element with Komo context.
   */
  function registerElement(element: IRegisterElement): void;
  function registerElement(
    pathElementOrOptions: string | IRegisterElement | IRegisterOptions,
    options?: IRegisterOptions) {

    if (isNullOrUndefined(pathElementOrOptions))
      return;

    const hasElement = arguments.length === 1 && isObject(pathElementOrOptions) &&
      (pathElementOrOptions as any).nodeName ? pathElementOrOptions as IRegisterElement : null;

    // No element just config return callback to get element.
    if (!hasElement) {

      if (!isString(pathElementOrOptions)) {
        options = pathElementOrOptions as IRegisterOptions;
        pathElementOrOptions = undefined;
      }

      options = options || {};
      options.path = pathElementOrOptions as string;

      return (element: IRegisterElement) => {

        if (!element) {
          if (!mounted.current) // only show warning if not mounted.
            log.warn(`Failed to register unknown element using options ${JSON.stringify(options)}.`);
          return;
        }

        // Extend element with options.

        const _element = element as IRegisteredElement<T>;

        _element.path = options.path || _element.name;
        _element.initValue = options.defaultValue;
        _element.initChecked = options.defaultChecked;
        _element.required = options.required || _element.required;
        _element.min = options.min || _element.min;
        _element.max = options.max || _element.max;
        _element.pattern = options.pattern || _element.pattern;
        _element.validateChange = options.validateChange;
        _element.validateBlur = options.validateBlur;
        _element.enableNativeValidation = options.enableNativeValidation;

        let minLength = _element.minLength === -1 ? undefined : _element.minLength;
        minLength = options.minLength || minLength;

        let maxLength = _element.maxLength === -1 ? undefined : _element.maxLength;
        maxLength = options.maxLength || maxLength;

        if (minLength)
          _element.minLength = minLength;

        if (maxLength)
          _element.maxLength = maxLength;

        bindElement(_element);

      };

    }

    // ONLY element was passed.
    bindElement(pathElementOrOptions as IRegisteredElement<T>);

  }

  return registerElement;

}
