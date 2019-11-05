import { IModel, KeyOf, IKomo, UseFields } from './types';

export function initHooks<T extends IModel>(komo: IKomo<T>) {

  function isErrorProp(prop: KeyOf<T>) {
    return typeof komo.state.errors[prop] !== 'undefined';
  }

  function isTouched(prop: KeyOf<T>) {
    return komo.state.touched.includes(prop);
  }

  function isDirty(prop: KeyOf<T>) {
    return komo.state.dirty.includes(prop);
  }

  function hasError(prop: KeyOf<T>) {
    if (!isTouched(prop))
      return false;
    return isErrorProp(prop);
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
   * @param def the default message value, typically empty string ''.
   */
  function useField(name: KeyOf<T>, def: string = '') {

    return {

      get element() {
        return komo.getElement(name);
      },

      get touched() {
        return isTouched(name);
      },

      get dirty() {
        return isDirty(name);
      },

      get errors() {
        return komo.state.errors;
      },

      get message() {
        if (!this.errors || typeof this.errors[name] === 'undefined')
          return def;
        return this.errors[name][0].message;
      },

      get valid() {
        return !hasError(name);
      },

      get invalid() {
        return hasError(name);
      }

    };

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
  function useFields<K extends KeyOf<T>>(...name: K[]) {
    return name.reduce((result, prop) => {
      result[prop as any] = useField(prop);
      return result;
    }, {}) as UseFields<K, ReturnType<typeof useField>>;
  }

  return {
    useField,
    useFields
  };

}