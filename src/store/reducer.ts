import { Type, ActionType } from './actions';
import { Model } from '../types';

export interface IReducerAction<P = any> {
  type: ActionType;
  payload?: P;
}

export interface IFormState<T extends object> {
  model: Model<T>;
}

export function formReducer<T extends object>(state: IFormState<T>, action: IReducerAction<any>) {

  switch (action.type) {

    ///////////////////////////////
    // Model Actions
    ////////////////////////////////



    ////////////////////////////////
    // Form Actions
    ////////////////////////////////

    case Type.FORM_SUBMIT: {
      return { ...state };
    }

    case Type.FORM_FAIL: {
      return { ...state };
    }

    case Type.FORM_SUCCESS: {
      return { ...state };
    }

    case Type.FORM_RESET: {
      return { ...state };
    }

    default: {
      break;
    }

  }

}
