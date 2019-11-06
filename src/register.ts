
import {
  isRadio, isCheckbox, addListener, isTextLike, removeListener,
  initObserver, isBooleanLike, isEqual, isString, isUndefined, isNullOrUndefined, me, isFunction,
  isObject,
  toDefault,
  isArray
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
export function initElement<T>(api?: IBaseApi<T>) {

  const {
    options: formOptions, log, schemaAst, fields, unregister, setModel,
    getModel, getDefault, isTouched, isDirty, setDefault, mounted,
    setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange,
    validateModelAt, isValidatable, removeError, setError, getElement, render
  } = api;

  /**
   * Checks if the element is a duplicate and should be ignored.
   * Radio groups never return true.
   */
  function isBound(element: IRegisteredElement<T>) {
    return fields.current.has(element) || element.komo;
  }

  /**
   * Resets the element to its defaults value and/or checked.
   * 
   * @param element the element to be reset.
   */
  function setElementDefault(element: IRegisteredElement<T>) {

    let value;

    if (isRadio(element.type)) {
      element.checked = element.defaultCheckedPersist;
      if (element.checked)
        value = element.value;
    }

    else if (isCheckbox(element.type)) {
      element.checked = element.defaultChecked = isBooleanLike(element.defaultCheckedPersist);
    }

    else if (element.multiple) {

      value = [...element.defaultValuePersist];

      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (value.includes(opt.value) || value.includes(opt.text)) {
          opt.setAttribute('selected', 'true');
          opt.selected = true;
        }

      }

    }

    else {
      value = element.defaultValuePersist;
      element.value = value;
    }

    setModel(element.path, value);

    return value;

  }

  /**
   * Updates the element on event changes.
   * 
   * @param element the registered element to be updated.
   * @param isBlur indicates the update event is of type blur.
   */
  function updateElement(element: IRegisteredElement<T>) {

    // Previous value & flags.
    const defaultValue = getDefault(element.path);
    const prevTouched = isTouched(element.name);
    const prevDirty = isDirty(element.name);

    let value: any;
    let dirty = false;

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

    dirty = isArray(defaultValue)
      ? !isEqual(defaultValue, value)
      : !isEqual(defaultValue + '', value + '');

    if (dirty)
      setDirty(element.name);

    if (!!dirty || prevTouched)
      setTouched(element.name);

    if (!dirty && prevDirty)
      removeDirty(element.name);

    // Updating the model here so if 
    // empty string set to undefined.
    if (value === '')
      value = undefined;

    // Set the model value.
    setModel(element.path, value);

  }

  /**
   * Parses the element for native validators building up an ast for use with Yup.
   * 
   * @param element the element to be parsed.
   */
  function parseNativeValidators(element: IRegisteredElement<T>) {

    const allowNative = !isUndefined(element.enableNativeValidation) ?
      element.enableNativeValidation : formOptions.enableNativeValidation;

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
  }

  /**
   * Attaches blur/change events for element.
   * 
   * @param element the element to attach events for.
   */
  function attachEvents(element: IRegisteredElement<T>) {

    let events = [];

    const handleBlur = async (e: Event) => {
      updateElement(element);
      if (isValidateBlur(element)) {
        await me(element.validate());
      }
    };

    const handleChange = async (e: Event) => {
      updateElement(element);
      if (isValidateChange(element)) {
        await me(element.validate());
      }
    };

    if (element.enableModelUpdate !== false) {

      // Attach blur
      addListener(element, 'blur', handleBlur);
      events = [['blur', handleBlur]];

      // Attach change.
      const changeEvent = isTextLike(element.type) ? 'input' : 'change';
      addListener(element, changeEvent, handleChange);
      events = [...events, [changeEvent, handleChange]];

    }

    // Bind mutation observer.
    initObserver(element as any, element.unregister.bind(element));

    return events;

  }

  /**
   * Extends the element with bound events.
   * 
   * @param element the element to be extended.
   */
  function extendEvents(element: IRegisteredElement<T>, rebind: boolean = false) {

    let events = [];

    // Attach events return array of attach for unbinding.
    // skip if just rebinding.
    if (!rebind)
      events = attachEvents(element);

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
      render();
      return Promise.resolve(data);

    };

    // Reset the element to initial values.
    element.reset = () => {
      setElementDefault(element);
    };

    element.reinit = (options?: { defaultValue?: any, defaultChecked?: boolean }) => {
      bindElement(element, true);
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

  }

  /**
   * Initializes the default values for the specified element.
   * 
   * @param element the element to initialize default values vor.
   */
  function initDefaults(element: IRegisteredElement<T>) {

    // Normalize path, get default values.

    element.path = element.path || element.name;

    // Get the model by key.

    const modelVal = getModel(element.path);

    if (isRadio(element.type)) {
      element.defaultValue = element.defaultValuePersist =
        element.initValue || element.value || modelVal || '';
      element.defaultChecked = element.defaultCheckedPersist =
        element.initChecked || element.checked || modelVal === element.value;
    }

    else if (isCheckbox(element.type)) {
      element.defaultValue = element.defaultValuePersist =
        element.initValue || element.value || element.checked || modelVal || false;
      element.defaultChecked = element.defaultCheckedPersist = element.defaultValue || false;
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
        if (opt.selected && (!(arr.includes(opt.value) || arr.includes(opt.text))) {
          arr.push(opt.value || opt.text);
        }
      }

      element.defaultValue = element.defaultValuePersist = arr;

    }

    else {

      element.defaultValue = element.defaultValuePersist = element.initValue || element.value || modelVal || '';

    }

  }

  /**
   * Binds and element and attaches specified event listeners.
   * 
   * @param element the element to be bound.
   */
  function bindElement(element: IRegisteredElement<T>, rebind: boolean = false) {

    if (!element || (isBound(element) && !rebind)) return;

    if (!element.name) {
      log.warn(`Element of tag "${element.tagName}" could NOT be registered using name of undefined.`);
      return;
    }

    // Normalizes the element and defaults for use with Komo.
    initDefaults(element);

    // NOTE: This should probably be refactored to
    // own file for greater flexibility/options.
    if (!rebind)
      parseNativeValidators(element);

    // Set the Initial Value.
    const value = setElementDefault(element);

    setDefault(element.path, value);

    // Attach/extend element with events.
    extendEvents(element, rebind);

    // Set element as bound to Komo.
    element.komo = true;

    // Add to current field to the collection.
    if (!rebind)
      fields.current.add(element as IRegisteredElement<any>);

  }

  /**
   * Registers and element with Komo context returning function which receive the element to be registered.
   * 
   * @param options options to register element with.
   */
  function registerElement(options: IRegisterOptions<T>): RegisterElement;

  /**
   * Registers an element with Komo context.
   */
  function registerElement(element: IRegisterElement): void;
  function registerElement(
    elementOrOptions: string | IRegisterElement | IRegisterOptions<T>,
    options?: IRegisterOptions<T>) {

    if (isNullOrUndefined(elementOrOptions))
      return;

    const hasElement = arguments.length === 1 && isObject(elementOrOptions) &&
      (elementOrOptions as any).nodeName ? elementOrOptions as IRegisterElement : null;

    // No element just config return callback to get element.
    if (!hasElement) {

      if (!isString(elementOrOptions)) {
        options = elementOrOptions as IRegisterOptions<T>;
        elementOrOptions = undefined;
      }

      options = options || {};

      return (element: IRegisterElement) => {

        // Extend element with options.

        const _element = element as IRegisteredElement<T>;

        if (!_element || isBound(_element))
          return;

        _element.name = options.name || _element.name;
        _element.path = options.path || _element.name;
        _element.initValue = options.defaultValue;
        _element.initChecked = options.defaultChecked;
        _element.validateChange = options.validateChange;
        _element.validateBlur = options.validateBlur;
        _element.enableNativeValidation = options.enableNativeValidation;
        _element.enableModelUpdate = options.enableModelUpdate;

        if (options.required)
          _element.required = options.required || _element.required;

        if (options.min)
          _element.min = options.min;

        if (options.max)
          _element.max = options.max;

        if (options.pattern)
          _element.pattern = options.pattern;

        // let minLength = _element.minLength === -1 ? undefined : _element.minLength;
        // minLength = options.minLength || minLength;

        // let maxLength = _element.maxLength === -1 ? undefined : _element.maxLength;
        // maxLength = options.maxLength || maxLength;

        if (options.minLength)
          _element.minLength = options.minLength;

        if (options.maxLength)
          _element.maxLength = options.maxLength;

        bindElement(_element);

      };

    }

    if (!elementOrOptions || isBound(elementOrOptions as IRegisteredElement<T>))
      return;

    // ONLY element was passed.
    bindElement(elementOrOptions as IRegisteredElement<T>);

  }

  return registerElement;

}
