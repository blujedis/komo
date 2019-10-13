import { FormEvent, ChangeEvent } from 'react';
import { ObjectSchema } from 'yup';

// HELPERS //

export type KeyOf<T> = Extract<keyof T, string>;

export type ValueOf<T, K extends KeyOf<T>> = T[K];

// FORM //

export interface IModel { [key: string]: any; }

export type ValidationHandler<T extends IModel> = ((model: T) => boolean | Promise<boolean>);

export type Schema<T extends IModel> = ObjectSchema<T> | ValidationHandler<T>;

export interface IOptions<T extends IModel> {
  model: T;
  validationSchema?: Schema<T>;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: (model?: T) => IErrors<T>;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
}

export interface IErrors<T extends object> { }

// REGISTER //

export interface IRegisterElement extends Partial<HTMLElement> {
  name: string;
  type?: string;
  value?: string;
  checked?: boolean;
  options?: HTMLOptionsCollection;
  onChange?: (e: ChangeEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  __registered?: boolean;
}

export interface IRegisterOptions<T extends IModel> {
  path?: string;
  value?: any;
  onValidate?: <K extends KeyOf<T>>(value?: T[K], name?: K, path?: string) => boolean;
}

export interface IRegisteredElement<T extends IModel> extends IRegisterElement {
  name: KeyOf<T> | string;
  path?: string;
  initValue?: string;
  validateChange?: boolean;
  validateBlur?: boolean;
  onValidate?: <K extends KeyOf<T>>(value?: T[K], name?: K, path?: string) => boolean;
}

// ERRORS //

export type ValidationModel<T extends IModel> = {
  [K in keyof T]?: T[K] extends any[]
  ? T[K][number] extends object
  ? Array<ValidationModel<T[K][number]>> | string | string[]
  : string | string[]
  : T[K] extends object
  ? ValidationModel<T[K]>
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
