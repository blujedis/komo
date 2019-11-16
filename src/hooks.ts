import { IModel, KeyOf, IKomo, IUseFields } from './types';
import { useCallback, BaseSyntheticEvent } from 'react';

export function initHooks<T extends IModel>(komo: IKomo<T>) {

  const {
    state, getElement, getModel, setModel, validateModelAt,
    isTouched, isDirty, getDefault
  } = komo;

  function getErrors(prop: KeyOf<T>) {
    if (!state.errors || !state.errors[prop] || !state.errors[prop].length)
      return [];
    return state.errors[prop];
  }

  /**
   * Creates hook to form field element.
   * 
   * @example
   * const firstName= useField('firstName');
   * 
   * @example
   * <input name="firstName" type="text" error={firstName.invalid} required />
   * <span>{firstName.required}</span>
   * 
   * @param name the name of the field to create hook for.
   */
  function useField(name: KeyOf<T>) {

    const unavailableMsg = prop => {
      if (prop)
        return `Prop "${prop}" undefined, element ${name} is unavailable or not mounted.`;
      return `Element "${name}" is unavailable or not mounted.`;
    };

    const getElementOrProp = (prop?: string, message?: string, def: any = null) => {
      const element = getElement(name);
      message = message || unavailableMsg(prop);
      if (!element && state.mounted) {
        // tslint:disable-next-line: no-console
        console.warn(message);
        return def;
      }
      if (!prop)
        return element || def;
      return element[prop] || def;
    };

    const field = {

      register: komo.register.bind(komo),

      // Getters //

      get mounted() {
        return state.mounted;
      },

      get element() {
        return getElementOrProp();
      },

      get errors() {
        return getErrors(name);
      },

      get valid() {
        return !field.errors.length;
      },

      get invalid() {
        return !!field.errors.length;
      },

      get touched() {
        return isTouched(name);
      },

      get dirty() {
        return isDirty(name);
      },

      get name() {
        return name;
      },

      get path() {
        return getElementOrProp('path');
      },

      get value() {
        return getElementOrProp('value');
      },

      get data() {
        return getModel(field.path);
      },

      get default() {
        return getDefault(field.path);
      },

      get message() {
        if (field.valid) return null;
        return state.errors[name][0].message;
      },

      get messages() {
        if (field.valid)
          return null;
        return field.errors.map(e => e.message);
      },

      // Setters //

      set value(value: any) {
        const element = getElementOrProp();
        if (!element)
          return;
        element.value = value + '';
      },

      set data(value: any) {
        setModel(field.path, value);
      },

      // Events //

      focus(e?: BaseSyntheticEvent) {
        const element = getElementOrProp();
        if (element)
          element.focus();
      },

      blur(e?: BaseSyntheticEvent) {
        const element = getElementOrProp();
        if (element)
          element.blur();
      },

      update(value: T[KeyOf<T>], modelValue?: any, validate: boolean = true) {
        const element = getElementOrProp();
        if (element)
          element.update(value, modelValue, validate);
      },

      validate() {
        const element = getElementOrProp();
        if (element)
          return validateModelAt(element);
      }

    };

    return field;

  }

  /**
   * Creates and object containing use field hooks for form.
   * 
   * @example
   * const { firstName, lastName } = useFields('firstName', 'lastName');
   * 
   * @example
   * <input name="firstName" type="text" error={firstName.invalid} required />
   * <span>{firstName.required}</span>
   * 
   * @param names the field names you wish to create hooks for.
   */
  function useFields<K extends KeyOf<T>>(...names: K[]) {
    return names.reduce((result, prop) => {
      result[prop as any] = useField(prop);
      return result;
    }, {}) as IUseFields<K, ReturnType<typeof useField>>;
  }

  return {
    useField: useCallback(useField, []),
    useFields: useCallback(useFields, [useField])
  };

}
