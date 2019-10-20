
import { FormApi } from './form';
import isEqual from 'lodash.isequal';
import { log, isRadio, isCheckbox, addListener, isTextLike, removeListener } from './utils';
import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel } from './types';

type RegisterElement = (element: IRegisterElement) => void;

export function initElement<T extends IModel>(api: FormApi) {

  function setElement(element: IRegisteredElement<T>, isBlur: boolean = false) {

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

    // Normalize path, initialValue and events.

    element.path = element.path || element.name;

    const modelVal = api.getModel(element.path);

    element.initValue = isRadio(element.type) ?
      element.initValue || modelVal || '' :
      element.initValue || element.value || modelVal || '';

    element.validateChange = element.onChange ? false :
      typeof element.validateChange === 'undefined' ? true : element.validateChange;

    element.validateBlur = element.onBlur ? false :
      typeof element.validateBlur === 'undefined' ? true : element.validateBlur;

    // Set the Initial Value.

    api.setDefaultValue(element);

    // Bind events & add to fields

    let events = [];

    const handleBlur = (e: Event) => { setElement(element, true); };
    const handleChange = (e: Event) => { setElement(element); };

    if (element.validateBlur) {
      addListener(element, 'blur', handleBlur);
      events = [['blur', handleBlur]];
    }

    if (element.validateChange) {
      const changeEvent = isTextLike(element.type) ? 'input' : 'change';
      addListener(element, changeEvent, handleChange);
      events = [...events, [changeEvent, handleChange]];
    }

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
        options = pathElementOrOptions;
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

        const _element = element as IRegisteredElement<T>;

        if (options.value)
          _element.initValue = options.value;

        _element.path = options.path || _element.name;

        if (options.onValidate)
          _element.onValidate = options.onValidate;

        bindElement(_element);

      };

    }

    // ONLY element was passed.
    bindElement(pathElementOrOptions as IRegisteredElement<T>);

  }

  return registerElement;

}
