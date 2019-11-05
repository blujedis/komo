import { IModel, IFormState, KeyOf } from '..';

export default function useCustomHook<T extends IModel>(state: IFormState<T>) {

  return (prop: KeyOf<T>, def: string = '') => {

    function hasError() {
      if (!state.touched.includes(prop))
        return false;
      return state.errors.hasOwnProperty(prop);
    }

    return {

      get message() {
        if (!state.errors || typeof state.errors[prop] === 'undefined')
          return def;
        return state.errors[prop][0].message;
      },

      get valid() {
        return !hasError();
      },

      get invalid() {
        return hasError();
      }

    };

  };

}
