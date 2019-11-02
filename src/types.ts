import { BaseSyntheticEvent, MutableRefObject } from 'react';
import { ObjectSchema, ValidateOptions, ValidationError } from 'yup';
import { createLogger } from './utils';

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
  validateAt?(path: string, value: any, options?: ValidateOptions): Promise<Partial<T>>;
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

export type SubmitHandler<T extends IModel> =
  (model?: T, errors?: ErrorModel<T>, event?: BaseSyntheticEvent) => void;

export type ResetHandler<T extends IModel> = (model?: T) => void;

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
  validationSchema?: T | ValidationSchema<T>;
  validateChange?: boolean;
  validateBlur?: boolean;
  validateSubmit?: boolean;
  enableWarnings?: boolean;
}

export interface IOptionsInternal<T extends IModel> extends IOptions<T> {
  model?: T;
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
}

export interface IRegisterOptions<T extends IModel> {
  path?: string;
  defaultValue?: any;
  defaultChecked?: boolean;
  onValidate?: ValidateFieldHandler<T>;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
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
  validate?: () => Promise<any>;
  unbind?: () => void;
  unregister?: () => void;
  reset?: () => void;
}

// ERRORS //

export interface IValidationError
  extends Pick<ValidationError, 'type' | 'name' | 'path' | 'value' | 'message'> { }

export type ErrorKeys<T extends IModel> = keyof T;

export type ErrorModel<T extends IModel> = { [K in ErrorKeys<T>]: IValidationError[] };

// API //

type Logger = ReturnType<typeof createLogger>;

export interface IBaseApi<T extends IModel> {

  log: Logger;
  fields: MutableRefObject<Set<IRegisteredElement<T>>>;
  schemaAst: MutableRefObject<ISchemaAst>;
  defaults: MutableRefObject<T>;
  model: MutableRefObject<T>;
  errors: MutableRefObject<ErrorModel<T>>;
  mounted: MutableRefObject<boolean>;
  submitCount: MutableRefObject<number>;
  submitting: MutableRefObject<boolean>;
  submitted: MutableRefObject<boolean>;

  state: {
    errors: ErrorModel<T>;
    isSubmitting: boolean;
    isSubmitted: boolean;
    submitCount: number;
    isValid: boolean;
    isDirty: boolean;
    isTouched: boolean;
  };

  render(status: string): void;
  render(): string;

  // Model

  getDefault(path?: string): any;

  setDefault(path: string, value: any, extend?: boolean): void;
  setDefault(model: T): void;

  getModel(path: string): any;
  getModel(): T;

  setModel(path: string, value: any, extend?: boolean): void;
  setModel(model: T): void;

  // Validation

  validator: IValidator<T>;
  isValidatable(): boolean;
  isValidateChange(element: IRegisteredElement<T>): boolean;
  isValidateChange(name: KeyOf<T>): boolean;

  isValidateBlur(element: IRegisteredElement<T>): boolean;
  isValidateBlur(name: KeyOf<T>): boolean;

  validateModelAt(element: IRegisteredElement<T>, opts?: ValidateOptions): Promise<Partial<T>>;
  validateModelAt(name: KeyOf<T>, opts?: ValidateOptions): Promise<Partial<T>>;
  validateModel(model: T, opts?: ValidateOptions): Promise<T>;

  // Touched

  setTouched(name: KeyOf<T>): void;
  removeTouched(name: KeyOf<T>): void;
  clearTouched(): void;
  isTouched(name?: KeyOf<T>): boolean;

  // Dirty

  setDirty(name: KeyOf<T>): void;
  removeDirty(name: KeyOf<T>): boolean;
  clearDirty(): void;
  isDirty(name?: KeyOf<T>): boolean;

  // Error

  setError(name: KeyOf<T>, value: any): ErrorModel<T>;
  setError(errors: ErrorModel<T>, merge?: boolean): ErrorModel<T>;
  removeError(name: KeyOf<T>): boolean;
  isError(name?: KeyOf<T>): boolean;
  clearError(): void;

  // Element

  findField(element: IRegisteredElement<T>): IRegisteredElement<T>;
  findField(nameOrPath: string): IRegisteredElement<T>;
  unregister(element: string | IRegisteredElement<T>): void;

}
