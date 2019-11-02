import { ChangeEvent, BaseSyntheticEvent, MutableRefObject } from 'react';
import { ObjectSchema, ValidateOptions, ValidationError } from 'yup';
import { createLogger } from './utils';
export declare type KeyOf<T> = Extract<keyof T, string>;
export declare type ValueOf<T, K extends KeyOf<T>> = T[K];
export interface IModel {
    [key: string]: any;
}
export declare type ValidateModelHandler<T extends IModel> = (model: T) => ErrorModel<T> | Promise<T>;
export declare type ValidationSchema<T extends IModel> = ObjectSchema<T> | ValidateModelHandler<T>;
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
export declare type ValidateFieldHandler<T extends IModel> = (value?: any, path?: string, name?: KeyOf<T> | string) => ErrorModel<T> | Promise<T>;
export declare type SubmitHandler<T extends IModel> = (model?: T, errors?: ErrorModel<T>, event?: BaseSyntheticEvent) => void;
export declare type ResetHandler<T extends IModel> = (model?: T) => void;
export interface IParsedPath<T extends IModel> {
    key?: KeyOf<T>;
    suffix?: string;
    segments?: string[];
    path?: string;
    toPath?: (key: KeyOf<T>, suffix: string) => string;
    valid: boolean;
}
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
export interface IValidationError extends Pick<ValidationError, 'type' | 'name' | 'path' | 'value' | 'message'> {
}
export declare type ErrorKeys<T extends IModel> = keyof T;
export declare type ErrorModel<T extends IModel> = {
    [K in ErrorKeys<T>]: IValidationError[];
};
export declare type ErrorKey<T extends IModel> = KeyOf<T>;
declare type Logger = ReturnType<typeof createLogger>;
export interface IBaseApi<T extends IModel> {
    log: Logger;
    fields: MutableRefObject<Set<IRegisteredElement<T>>>;
    schemaAst: MutableRefObject<ISchemaAst>;
    mounted: MutableRefObject<boolean>;
    render(status?: string): void;
    render(): string;
    getDefault(path?: string): any;
    getModel(path: string): any;
    getModel(): T;
    setModel(path: string, value: any, setDefault?: boolean): void;
    setModel(model: T): void;
    isValidateable(): boolean;
    validateModel(name: KeyOf<T>, path: string, value: object, opts?: ValidateOptions): Promise<any>;
    validateModel(model: T, opts?: ValidateOptions): Promise<T>;
    setTouched(name: KeyOf<T>): void;
    removeTouched(name: KeyOf<T>): void;
    clearTouched(): void;
    isTouched(name?: KeyOf<T>): boolean;
    setDirty(name: KeyOf<T>): void;
    removeDirty(name: KeyOf<T>): boolean;
    clearDirty(): void;
    isDirty(name?: KeyOf<T>): boolean;
    setError(name: ErrorKey<T>, value: any): ErrorModel<T>;
    setError(errs: object): ErrorModel<T>;
    removeError(name: ErrorKey<T>): boolean;
    isError(name?: ErrorKey<T>): boolean;
    findField(nameOrPath: string): IRegisteredElement<T>;
    unref(element: string | IRegisteredElement<T>): void;
    reset(values?: T): void;
    handleReset(modelOrEvent?: ResetHandler<T> | BaseSyntheticEvent<object, any, any>): (values?: T) => void;
    handleSubmit(handler: SubmitHandler<T>): (event: BaseSyntheticEvent) => Promise<void>;
}
export {};
