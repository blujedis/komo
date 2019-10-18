
import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel } from './types';
import { FormApi } from './form';
import { EVENT_CHANGE_MAP } from './constants';
import { log, isRadio, isCheckbox, addListener } from './utils';

type RegisterElement = (element: IRegisterElement) => void;

export function initElement<T extends IModel>(api: FormApi) {

  function unbindElement(element: IRegisteredElement<T>) {
    //
  }

  // Binds to events, sets initial values.
  function bindElement(element: IRegisteredElement<T>) {

    if (!element || api.fields.current.has(element)) return;

    element.path = element.path || element.name;

    const modelVal = api.getModel(element.path);
    const hasModelPath = api.hasModelPath(element.path);

    element.initValue = element.initValue || element.value || modelVal;

    element.validateChange = element.onChange ? false :
      typeof element.validateChange === 'undefined' ? true : element.validateChange;

    element.validateBlur = element.onBlur ? false :
      typeof element.validateBlur === 'undefined' ? true : element.validateBlur;

    if (!element.name) {
      log.warn(`${element.tagName} could NOT be registered using name of undefined.`);
      return;
    }

    // Options passed value.
    if (element.initValue) {

      if (isRadio(element.type)) {

        if (element.value === element.initValue)
          element.checked = true;
      }

      else {

        let val;

        if (isCheckbox(element.type)) {
          val = /(false|0)/.test(element.initValue) ? false : true;
          element.checked = val;
        }
        else {
          val = element.value = element.initValue;
        }

        api.setModel(element.path, val);

      }

    }

    else {
      api.setModel(element.path, '');
    }

    // Attach blur event.
    if (element.validateBlur)
      addListener(element, 'blur', (e) => {
        api.handleBlur(e, element);
      });

    if (element.validateChange)
      console.log(element.name, element.type, EVENT_CHANGE_MAP[element.type])

    // Attach change event.
    if (element.validateChange)
      addListener(element, EVENT_CHANGE_MAP[element.type], (e) => {
        api.handleChange(e, element);
      });

    // add the element to fields.
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
