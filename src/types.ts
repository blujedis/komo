import { FormEvent, ChangeEvent, MouseEvent } from 'react';
import { ObjectSchema, ValidateOptions } from 'yup';

// HELPERS //

export type KeyOf<T> = Extract<keyof T, string>;

export type ValueOf<T, K extends KeyOf<T>> = T[K];

// MODEL & VALIDATION //

export interface IModel { [key: string]: any; }

export type ValidateModelHandler<T extends IModel> = (model: T) => ErrorModel<T> | Promise<T>;

export type ValidationSchema<T extends IModel> = ObjectSchema<T> | ValidateModelHandler<T>;

export interface IValidator<T extends IModel> {
  validate(model: T, options?: ValidateOptions): ErrorModel<T> | Promise<T>;
  validateAt?(path: string, value: any, options?: ValidateOptions): ErrorModel<T> | Promise<T>;
}

export type ValidateFieldHandler<T extends IModel> =
  (value?: any, path?: string, name?: KeyOf<T> | string) =>
    ErrorModel<T> | Promise<T>;

export type SubmitResetEvent<T extends IModel> =
  FormEvent<HTMLFormElement> | SubmitResetHandler<T> | MouseEvent<HTMLInputElement>;

export type SubmitResetHandler<T extends IModel> = (model: T, event?: SubmitResetEvent<T>, komo?) => void;

export interface IOptions<T extends IModel> {
  model: T;
  validationSchema?: ValidationSchema<T>;
  castSchema?: boolean;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: ValidateModelHandler<T>;
  onSubmit?: SubmitResetHandler<T>;
  onReset?: SubmitResetHandler<T>;
}

// REGISTER //

export interface IRegisterElement extends Partial<HTMLElement> {
  name?: string;
  type?: string;
  value?: string;
  checked?: boolean;
  options?: HTMLOptionsCollection;
  multiple?: boolean;
  min?: string | number;
  max?: string | number;
  pattern?: string | RegExp;
  required?: boolean;
  onChange?: (e: ChangeEvent) => void;
  onBlur?: (e: FocusEvent) => void;
}

export interface IRegisterOptions<T extends IModel> {
  path?: string;
  defaultValue?: any;
  defaultChecked?: boolean;
  onValidate?: ValidateFieldHandler<T>;
}

export interface IRegisteredElement<T extends IModel> extends IRegisterElement {
  name: KeyOf<T> | string;
  path?: string;
  initValue?: any;
  initChecked?: boolean;
  defaultValue?: any;
  defaultChecked?: boolean;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: ValidateFieldHandler<T>;
  unbind?: () => void;
  unregister?: () => void;
  resetElement?: () => void;
}

// ERRORS //

export type ErrorModel<T extends IModel> = {
  [K in keyof T]?: T[K] extends any[]
  ? T[K][number] extends object
  ? Array<ErrorModel<T[K][number]>> | string | string[]
  : string | string[]
  : T[K] extends object
  ? ErrorModel<T[K]>
  : string;
};

// TOUCHED & DIRTY //

export type TouchedModel<T extends IModel> = {
  [K in keyof T]?: T[K] extends any[]
  ? T[K][number] extends object
  ? Array<TouchedModel<T[K][number]>>
  : boolean
  : T[K] extends object
  ? TouchedModel<T[K]>
  : boolean;
};
