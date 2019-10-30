import { FormEvent, ChangeEvent, MouseEvent } from 'react';
import { ObjectSchema, ValidateOptions } from 'yup';
import { FormApi } from './form';

// HELPERS //

export type KeyOf<T> = Extract<keyof T, string>;

export type ValueOf<T, K extends KeyOf<T>> = T[K];

// export type FieldValues = Record<string, any>;

// export type RawFieldName<V extends FieldValues> = KeyOf<V>;

// export type FieldName<V extends FieldValues> = RawFieldName<V> | string;

// export type FieldValue<V extends FieldValues> = V[FieldName<V>];

// export type DefaultModel<V extends FieldValues> = Record<FieldName<V>, FieldValue<V>>;

// export type Model<V extends FieldValues> = Partial<Record<FieldName<V>, FieldValue<V>>>;

// MODEL & VALIDATION //

export interface IModel { [key: string]: any; }

export type ValidateModelHandler<T extends IModel> = (model: T) => ErrorModel<T> | Promise<T>;

export type ValidationSchema<T extends IModel> = ObjectSchema<T> | ValidateModelHandler<T>;

export interface IValidator<T extends IModel> {
  validate(model: T, options?: ValidateOptions): Promise<T>;
  validateAt?(path: string, value: any, options?: ValidateOptions): Promise<T>;
}

export interface INativeValidators {
  string?: undefined;
  number?: undefined;
  boolean?: undefined;
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  maxLength?: number | string;
  minLength?: number | string;
  pattern?: string | RegExp;
}

export interface ISchemaAst {
  [key: string]: Array<[KeyOf<INativeValidators>, INativeValidators[KeyOf<INativeValidators>]]>;
}

export type ValidateFieldHandler<T extends IModel> =
  (value?: any, path?: string, name?: KeyOf<T> | string) =>
    ErrorModel<T> | Promise<T>;

export type SubmitResetEvent<T extends IModel> =
  FormEvent<HTMLFormElement> | SubmitResetHandler<T> | MouseEvent<HTMLInputElement>;

export type SubmitResetHandler<T extends IModel> =
  (model: T, event?: SubmitResetEvent<T>, komo?: FormApi) => void;

export interface IParsedPath<T extends IModel> {
  key?: KeyOf<T>;
  suffix?: string;
  segments?: string[];
  path?: string;
  toPath?: (key: KeyOf<T>, suffix: string) => string;
  valid: boolean;
}

// OPTIONS //

export interface IOptions<T extends IModel> {
  model?: T;
  validationSchema?: ValidationSchema<T>;
  validateChange?: boolean;
  validateBlur?: boolean;
  validateSubmit?: boolean;
  enableWarnings?: boolean;
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
  required?: boolean;
  min?: string | number;
  max?: string | number;
  pattern?: string | RegExp;
  minLength?: string | number;
  maxLength?: string | number;
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
  name: KeyOf<T>;
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

export type ErrorModel<T extends IModel> = { [K in keyof T]: string[]; };

export type ErrorKey<T> = KeyOf<ErrorModel<T>>;

// API //

export interface IApi {

}
