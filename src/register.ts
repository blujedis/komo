
import {
  isRadio, isCheckbox, addListener, isTextLike, removeListener,
  initObserver, isBooleanLike, isEqual, isString, isUndefined, isNullOrUndefined, me
} from './utils';
import { getNativeValidators } from './validate';
import {
  IRegisterElement, IRegisterOptions, IRegisteredElement,
  IModel, INativeValidators, KeyOf, IBaseApi, ErrorModel
} from './types';
import { LegacyRef } from 'react';

type RegisterElement = (element: IRegisterElement) => LegacyRef<HTMLElement>;

export function initElement<T extends IModel>(api?: IBaseApi<T>) {

  const {
    log, schemaAst, fields, unregister, mounted, setModel,
    getModel, getDefault, isTouched, isDirty, setDefault,
    setDirty, setTouched, removeDirty, isValidateBlur, isValidateChange,
    validateModelAt, isValidatable, removeError, state, setError
  } = api;

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

  // Binds to events, sets initial values.
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

    const nativeValidators = getNativeValidators(element);

    if (nativeValidators.length) {

      schemaAst.current = schemaAst.current || {};
      schemaAst.current[element.path] = schemaAst.current[element.path] || [];
      const type = element.type === 'number' || element.type === 'range' ? 'number' : 'string';

      // Set the type.
      schemaAst.current[element.path] = [[type, undefined]];

      // Extend AST with each native validator.
      nativeValidators.forEach(k => {
        schemaAst.current[element.path] = [...schemaAst.current[element.path],
        [k as KeyOf<INativeValidators>, element[k]]];
      });

    }

    // Set the Initial Value.

    resetElement(element, true);

    // Bind events

    let events = [];

    element.validate = async () => {
      const currentValue = getModel(element.path);
      if (!isValidatable())
        return Promise.resolve(currentValue);
      const { err } = await me<Partial<T>, ErrorModel<T>>(validateModelAt(element));
      if (err) {
        setError(element.name, err[element.name]);
        return Promise.reject(err);
      }
      removeError(element.name);
      return Promise.resolve(currentValue);
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
      // if (isValidateBlur(element)) {
      //   const { err } = await me(element.validate());
      // }
    };

    const handleChange = async (e: Event) => {
      updateElement(element);
      if (isValidateChange(element)) {
        const { err } = await me(element.validate());
      }
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

  function registerElement(path: string, options?: IRegisterOptions<T>): RegisterElement;
  function registerElement(options: IRegisterOptions<T>): RegisterElement;
  function registerElement(element: IRegisterElement): void;
  function registerElement(
    pathElementOrOptions: string | IRegisterElement | IRegisterOptions<T>,
    options?: IRegisterOptions<T>) {

    if (isNullOrUndefined(pathElementOrOptions))
      return;

    const hasElement = arguments.length === 1 && typeof pathElementOrOptions === 'object' &&
      (pathElementOrOptions as any).nodeName ? pathElementOrOptions as IRegisterElement : null;

    // No element just config return callback to get element.
    if (!hasElement) {

      if (!isString(pathElementOrOptions)) {
        options = pathElementOrOptions as IRegisterOptions<T>;
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
        _element.onValidate = options.onValidate;
        // _element.required = options.required || _element.required;
        // _element.min = options.min || _element.min;
        // _element.max = options.max || _element.max;
        // _element.pattern = options.pattern || _element.pattern;

        // const minLength = _element.minLength === -1 ? undefined : _element.minLength;
        // const maxLength = _element.maxLength === -1 ? undefined : _element.maxLength;
        // _element.minLength = options.minLength || minLength;
        // _element.maxLength = options.maxLength || maxLength;

        bindElement(_element);

      };

    }

    // ONLY element was passed.
    bindElement(pathElementOrOptions as IRegisteredElement<T>);

  }

  return registerElement;

}
