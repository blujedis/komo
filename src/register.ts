
import { FormApi } from './form';
import {
  log, isRadio, isCheckbox, addListener, isTextLike, removeListener,
  initObserver, isBooleanLike, isEqual
} from './utils';
import { getNativeValidators } from './validate';
import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel, INativeValidators, KeyOf } from './types';
import { LegacyRef } from 'react';

type RegisterElement = (element: IRegisterElement) => LegacyRef<HTMLElement>;

export function initElement<T extends IModel>(api?: FormApi) {

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
      api.setModel(element.path, value, true);

  }

  function updateElement(element: IRegisteredElement<T>, isBlur: boolean = false) {

    // Previous value & flags.
    const defaultValue = api.getDefault(element.path);
    const prevTouched = api.isTouched(element.path);
    const prevDirty = api.isDirty(element.path);

    let value: any;
    let touched = false;
    let dirty = false;

    // On change always set local touched.
    if (!isBlur)
      touched = true;

    if (isRadio(element.type)) {

      const radios =
        [...api.fields.current.values()]
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
      api.setDirty(element.path);

    if (touched)
      api.setTouched(element.path);

    if (!dirty && prevDirty)
      api.removeDirty(element.path);

    // Set the model value.
    api.setModel(element.path, value);

  }

  // Binds to events, sets initial values.
  function bindElement(element: IRegisteredElement<T>) {

    if (!element || api.fields.current.has(element)) return;

    if (!element.name) {
      log.warn(`${element.tagName} could NOT be registered using name of undefined.`);
      return;
    }

    // Normalize path, get default values.

    element.path = element.path || element.name;

    if (!element.type)
      element.setAttribute('type', 'text');

    const modelVal = api.getModel(element.path);

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

      arr = arr.filter(v => typeof v !== 'undefined');

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
      typeof element.validateChange === 'undefined' ? true : element.validateChange;

    element.validateBlur = element.onBlur ? false :
      typeof element.validateBlur === 'undefined' ? true : element.validateBlur;

    const nativeValidators = getNativeValidators(element);

    if (nativeValidators.length) {

      if (api.isSchemaUser)
        throw new Error(`Field ${element.name} contains native validation keys ${nativeValidators.join(', ')}. Cannot use native validators with user defined schema function.`);

      api.schemaAst = api.schemaAst || {};
      api.schemaAst[element.path] = api.schemaAst[element.path] || [];
      const type = element.type === 'number' || element.type === 'range' ? 'number' : 'string';

      // Set the type.
      api.schemaAst[element.path] = [[type, undefined]];

      // Extend AST with each native validator.
      nativeValidators.forEach(k => {
        api.schemaAst[element.path] = [...api.schemaAst[element.path],
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
      api.unref(element);
    };

    // Bind mutation observer.
    initObserver(element as any, element.unregister.bind(element));

    // Add to current fields collection.
    api.fields.current.add(element);

  }

  function registerElement(path: string, options?: IRegisterOptions<T>): RegisterElement;
  function registerElement(options: IRegisterOptions<T>): RegisterElement;
  function registerElement(element: IRegisterElement): void;
  function registerElement(
    pathElementOrOptions: string | IRegisterElement | IRegisterOptions<T>,
    options?: IRegisterOptions<T>) {

    if (pathElementOrOptions === null || typeof pathElementOrOptions === 'undefined')
      return;

    const hasElement = arguments.length === 1 && typeof pathElementOrOptions === 'object' &&
      (pathElementOrOptions as any).nodeName ? pathElementOrOptions as IRegisterElement : null;

    // No element just config return callback to get element.
    if (!hasElement) {

      if (typeof pathElementOrOptions !== 'string') {
        options = pathElementOrOptions as IRegisterOptions<T>;
        pathElementOrOptions = undefined;
      }

      options = options || {};
      options.path = pathElementOrOptions as string;

      return (element: IRegisterElement) => {

        if (!element) {
          if (!api.mounted.current) // only show warning if not mounted.
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
