import { IModel, KeyOf, IKomo, IUseFields, IUseField, IRegisteredElement, IValidationError } from './types';
import { useCallback, BaseSyntheticEvent } from 'react';
import { isUndefined, isString, isObject } from './utils';

export function initHooks<T extends IModel>(komo: IKomo<T>) {

  const {
    state, getElement, getModel, setModel, validateModelAt,
    isTouched, isDirty, getDefault, render, removeError, removeTouched,
    removeDirty
  } = komo;

  function getErrors(prop: KeyOf<T>): IValidationError[] {
    if (!state.errors || !state.errors[prop] || !state.errors[prop].length)
      return [];
    return state.errors[prop];
  }

  /**
   * Creates hook to form field element.
   * 
   * @example
   * const firstName= useField('key', true);
   * 
   * @example
   * <input name="firstName" type="text" error={firstName.invalid} required />
   * <span>{firstName.required}</span>
   * 
   * @param name the name of the field to create hook for.
   * @param virtual when true is virtual property.
   */
  function useField<K extends string>(name: K, virtual: boolean): IUseField<Record<K, T>>;

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
  function useField(name: KeyOf<T>): IUseField<T>;

  function useField<K extends string>(virtualOrName: K | KeyOf<T>, virtual?: boolean): any {

    const name = virtual ? virtualOrName as KeyOf<Record<K, T>> : virtualOrName as KeyOf<T>;

    const unavailableMsg = prop => {
      if (prop)
        return `Prop "${prop}" undefined, element "${name}" is unavailable or not mounted.`;
      return `Element "${name}" is unavailable or not mounted.`;
    };

    function getElementOrProp(prop: string, def?: any): any;
    function getElementOrProp(): IRegisteredElement<T>;
    function getElementOrProp(prop?: string, def: any = null) {

      const element = getElement(name);

      if (!element && !state.mounted) return;

      if (!element && state.mounted) {
        if (!virtual)
          // tslint:disable-next-line: no-console
          console.warn(unavailableMsg(prop));
        return def;
      }

      if (isUndefined(prop))
        return element || def;

      const val = element[prop];
      return isUndefined(val) ? def : val;

    }

    const field = {

      // register: komo.register.bind(komo),

      register: (elementOrOptions) => {

        // binds hidden prop so we know this 
        // is a hooked element or virtual.
        if (isObject(elementOrOptions)) {

          elementOrOptions.__hooked__ = true;
          elementOrOptions.virtual = virtual;

          // Virtual props must use same name.
          if (elementOrOptions.virtual)
            elementOrOptions.name = name;

        }

        return komo.register(elementOrOptions);

      },

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
        const element = getElementOrProp();
        if (!element)
          return '';
        if (element.type !== 'checkbox')
          return element.value || '';
        return element.checked;
      },

      get data() {
        if (!field.path)
          return null;
        return getModel(field.path);
      },

      get default() {
        if (!field.path)
          return null;
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
        if (!field.path) return;
        setModel(field.path, value);
      },

      // Events //

      reset() {
        const element = getElementOrProp();
        if (element) {
          // TODO: Use timeout here so we don't trigger
          // too many renders, maybe we should add
          // a "noRender" arg to removeError which calls
          // setError. 
          setTimeout(() => {
            removeDirty(name);
            removeTouched(name);
            removeError(name);
            element.reset();
          });

        }
      },

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

      update(value: any, modelValue?: any, validate: boolean = true) {
        const element = getElementOrProp();
        if (element)
          element.update(value, modelValue, validate);
      },

      // updateAt(key: string, value: any, modelValue?: any, validate: boolean = true) {
      //   const element = getElement(key);
      //   if (!element)
      //     // tslint:disable-next-line: no-console
      //     console.warn(`Cannot UPDATE unknown element at "${key}".`);
      //   else
      //     element.update(value, modelValue, validate);
      // },

      // setValueAt(key: string, value: any) {
      //   const el = getElement(key);
      //   if (!el)
      //     // tslint:disable-next-line: no-console
      //     console.warn(`Cannot set VALUE for known element at "${key}".`);
      //   else
      //     el.value = value;
      // },

      // setDataAt(nameOrPath: string, value: any) {
      //   const element = getElement(nameOrPath);
      //   if (!element)
      //     // tslint:disable-next-line: no-console
      //     console.warn(`Cannot set DATA for known element at "${nameOrPath}".`);
      //   else
      //     element.value = value;
      // },

      validate() {
        const element = getElementOrProp();
        if (element)
          return validateModelAt(element);
      },

      validateAt(...names: string[]) {

        const promises = names.reduce((a, c) => {
          const el = getElement(c);
          if (!el) {
            // tslint:disable-next-line: no-console
            console.warn(`Cannot validate at unknown element "${c}".`);
            return a;
          }
          a = [...a, validateModelAt(el)];
        }, []);

        return Promise.all(promises);

      },

      render

    };

    return field;

  }

  /**
   * Creates and object containing use field hooks for form.
   * 
   * @example
   * const { firstName, lastName } = useFields(true, 'firstName', 'lastName');
   * 
   * @example
   * <input name="firstName" type="text" error={firstName.invalid} required />
   * <span>{firstName.required}</span>
   * 
   * @param keys the field names you wish to create hooks for.
   */
  function useFields<A extends string>(vanity: boolean, ...keys: A[]): IUseFields<A, IUseField<Record<A, T>>>;

  /**
   * Creates and object containing use field hooks for form.
   * 
   * @example
   * const { firstName, lastName } = useFields(true, 'firstName', 'lastName');
   * 
   * @example
   * <input name="firstName" type="text" error={firstName.invalid} required />
   * <span>{firstName.required}</span>
   * 
   * @param names the field names you wish to create hooks for.
   */
  function useFields<K extends KeyOf<T>>(...names: K[]): IUseFields<K, IUseField<T>>;

  function useFields<K extends KeyOf<T>>(vanity: string | boolean, ...names: K[]) {
    if (isString(vanity)) {
      names.unshift(vanity as any);
      vanity = undefined;
    }
    return names.reduce((result, prop) => {
      result[prop as any] = useField(prop, vanity as any);
      return result;
    }, {});
  }

  return {
    useField: useCallback(useField, []),
    useFields: useCallback(useFields, [useField])
  };

}
