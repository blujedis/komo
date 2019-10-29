
import { FormApi } from './form';
import {
  isRadio, isCheckbox, addListener, isTextLike, removeListener,
  initObserver, isBooleanLike, isEqual, parsePath, isString, isUndefined, isNullOrUndefined, isObject
} from './utils';
import { getNativeValidators } from './validate';
import { get } from 'dot-prop';
import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel, INativeValidators, KeyOf } from './types';
import { LegacyRef } from 'react';

type RegisterElement = (element: IRegisterElement) => LegacyRef<HTMLElement>;

export function initElement<T extends IModel>(api?: FormApi) {

  const {
    log, schemaAst, fields, unref, mounted, setModel,
    getModel, getDefault, isTouchedPath, isDirtyPath,
    setDirty, setTouched, removeDirty, isValidatedByUser
  } = api;

  function resetElement(element: IRegisteredElement<T>) {

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

    // Update the model and set defaults.
    if (value)
      setModel(element.path, value, true);

  }

  function updateElement(element: IRegisteredElement<T>, isBlur: boolean = false) {

    // Previous value & flags.
    const defaultValue = getDefault(element.path);
    const prevTouched = isTouchedPath(element.path);
    const prevDirty = isDirtyPath(element.path);

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
      setDirty(element.path);

    if (touched)
      setTouched(element.path);

    if (!dirty && prevDirty)
      removeDirty(element.path);

    // Set the model value.
    setModel(element.path, value);

  }

  // Binds to events, sets initial values.
  function bindElement(element: IRegisteredElement<T>) {

    if (!element || fields.current.has(element)) return;

    if (!element.name) {
      log.warn(`Element of tag "${element.tagName}" could NOT be registered using name of undefined.`);
      return;
    }

    // Normalize path, get default values.

    element.path = element.path || element.name;

    if (!element.type)
      element.setAttribute('type', 'text');

    const parsed = parsePath<T>(element.path);

    if (!parsed.valid) {
      log.error(`Failed to parse path "${element.path}" for element "${element.name}" of type "${element.type}".`);
      return;
    }

    // Store the model key.

    element.key = parsed.key;

    // Get the model by key.

    const model = getModel(parsed.key);

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

    element.validateChange = element.onChange ? false :
      isUndefined(element.validateChange) ? true : element.validateChange;

    element.validateBlur = element.onBlur ? false :
      isUndefined(element.validateBlur) ? true : element.validateBlur;

    const nativeValidators = getNativeValidators(element);

    if (nativeValidators.length) {

      if (isValidatedByUser)
        throw new Error(`Field ${element.name} contains native validation keys ${nativeValidators.join(', ')}. Cannot use native validators with user defined schema function.`);

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

    resetElement(element);

    // Bind events & add to fields

    let events = [];

    const handleBlur = (e: Event) => { updateElement(element, true); };
    const handleChange = (e: Event) => { updateElement(element); };

    if (element.validateBlur) {
      addListener(element, 'blur', handleBlur);
      events = [['blur', handleBlur]];
    }

    if (element.validateChange) {
      const changeEvent = isTextLike(element.type) ? 'input' : 'change';
      addListener(element, changeEvent, handleChange);
      events = [...events, [changeEvent, handleChange]];
    }

    // Reset the element to initial values.
    element.resetElement = () => {
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
      unref(element);
    };

    // Bind mutation observer.
    initObserver(element as any, element.unregister.bind(element));

    // Add to current fields collection.
    fields.current.add(element);

  }

  function registerElement(path: string, options?: IRegisterOptions<T>): RegisterElement;
  function registerElement(options: IRegisterOptions<T>): RegisterElement;
  function registerElement(element: IRegisterElement): void;
  function registerElement(
    pathElementOrOptions: string | IRegisterElement | IRegisterOptions<T>,
    options?: IRegisterOptions<T>) {

    if (isNullOrUndefined(pathElementOrOptions))
      return;

    const hasElement = arguments.length === 1 && isObject(pathElementOrOptions) &&
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

        bindElement(_element);

      };

    }

    // ONLY element was passed.
    bindElement(pathElementOrOptions as IRegisteredElement<T>);

  }

  return registerElement;

}
