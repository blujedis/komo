
import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel } from './types';
import { FormApi } from './form';
import { log, isRadio, isCheckbox } from './utils';
import { lchown } from 'fs';

type RegisterElement = (element: IRegisterElement) => void;

const DEFAULTS: IRegisteredElement<any> = {
  name: ''
};

export function initRegister<T extends IModel>(api: FormApi) {

  function setCheckbox(element: IRegisteredElement<T>) {

  }

  function setRadio(element: IRegisteredElement<T>) {

  }

  // Binds to events, sets initial values.
  function bindElement(element: IRegisteredElement<T>) {

    if (!element || api.fields.current.has(element as any)) return;

    element.path = element.path || element.name;

    const { name, type, tagName, value, checked, options } = element;

    console.log({
      name,
      type,
      tagName,
      value,
      checked,
      options
    });

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
