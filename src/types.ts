import { FormEvent, ChangeEvent } from 'react';
import { ObjectSchema } from 'yup';

// HELPERS //

export type KeyOf<T> = Extract<keyof T, string>;

export type ValueOf<T, K extends KeyOf<T>> = T[K];

// MODEL & VALIDATION //

export interface IModel { [key: string]: any; }

export type ValidateModelHandler<T extends IModel> = (model: T) => ErrorModel<T> | Promise<ErrorModel<T>>;

export type ValidationSchema<T extends IModel> = ObjectSchema<T> | ValidateModelHandler<T>;

export interface IValidatePromise<T extends IModel> extends Promise<T> {
  then<T1, T2 extends ErrorModel<T>>(
    onFullfilled?: (value: T) => T1 | PromiseLike<T1>,
    onRejected?: (error: any) => T2 | PromiseLike<T2>);
}

export type ValidateFieldHandler<T extends IModel> =
  (value?: any, path?: string, name?: KeyOf<T> | string) =>
    ErrorModel<T> | Promise<ErrorModel<T>>;

export interface IOptions<T extends IModel> {
  model: T;
  validationSchema?: ValidationSchema<T>;
  castSchema?: boolean;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: ValidateModelHandler<T>;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
}

// REGISTER //

export interface IRegisterElement extends Partial<HTMLElement> {
  name: string;
  type?: string;
  value?: string;
  checked?: boolean;
  options?: HTMLOptionsCollection;
  onChange?: (e: ChangeEvent) => void;
  onBlur?: (e: FocusEvent) => void;
}

export interface IRegisterOptions<T extends IModel> {
  path?: string;
  value?: any;
  onValidate?: ValidateFieldHandler<T>;
}

export interface IRegisteredElement<T extends IModel> extends IRegisterElement {
  name: KeyOf<T> | string;
  path?: string;
  initValue?: string;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: ValidateFieldHandler<T>;
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
