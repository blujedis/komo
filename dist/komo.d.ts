import { FormEvent, BaseSyntheticEvent } from 'react';
import { IOptions, IModel, IRegisteredElement, ErrorModel, SubmitHandler, PromiseStrict, IKomoExtended } from './types';
import { ValidateOptions } from 'yup';
/**
 * Use form hook exposes Komo form hook API.
 *
 * @param options form api options.
 */
export declare function initForm<T extends IModel>(options?: IOptions<T>): {
    register: {
        (options: import("./types").IRegisterOptions<T>): import("./types").RegisterElement;
        (element: import("./types").IRegisterElement): void;
    };
    unregister: {
        (element: IRegisteredElement<T>): void;
        (name: Extract<keyof T, string>): void;
    };
    render: {
        (status: string): void;
        (): string;
    };
    state: import("./types").IFormState<T>;
    reset: (values?: T) => void;
    handleReset: {
        (event: BaseSyntheticEvent<object, any, any>): Promise<void>;
        (values: T): (event: BaseSyntheticEvent<object, any, any>) => Promise<void>;
    };
    handleSubmit: (handler: SubmitHandler<T>) => (event: FormEvent<HTMLFormElement>) => Promise<void>;
    getElement: {
        (element: IRegisteredElement<T>): IRegisteredElement<T>;
        (nameOrPath: string): IRegisteredElement<T>;
    };
    getModel: {
        (path: string): any;
        (): T;
    };
    setModel: {
        (path: string, value: any): void;
        (model: T, extend?: boolean): void;
    };
    validateModel: (options?: ValidateOptions) => PromiseStrict<T, ErrorModel<T>>;
    validateModelAt: {
        (element: IRegisteredElement<T>, options?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>>;
        (name: Extract<keyof T, string>, options?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>>;
    };
    setTouched: (name: Extract<keyof T, string>) => void;
    removeTouched: (name: Extract<keyof T, string>) => void;
    clearTouched: () => void;
    setDirty: (name: Extract<keyof T, string>) => void;
    removeDirty: (name: Extract<keyof T, string>) => boolean;
    clearDirty: () => void;
    setError: {
        (name: Extract<keyof T, string>, value: any): ErrorModel<T>;
        (errors: ErrorModel<T>, extend?: boolean): ErrorModel<T>;
    };
    removeError: (name: Extract<keyof T, string>) => boolean;
    clearError: () => void;
};
/**
 * Initializes Komo.
 *
 * @param options the komo options.
 */
export declare function initKomo<T extends IModel>(options?: IOptions<T>): IKomoExtended<T> & {
    useField: (name: Extract<keyof T, string>, def?: string) => {
        readonly element: IRegisteredElement<T>;
        readonly touched: boolean;
        readonly dirty: boolean;
        readonly errors: ErrorModel<T>;
        readonly message: string;
        readonly valid: boolean;
        readonly invalid: boolean;
    };
    useFields: <K extends Extract<keyof T, string>>(...name: K[]) => import("./types").UseFields<K, {
        readonly element: IRegisteredElement<T>;
        readonly touched: boolean;
        readonly dirty: boolean;
        readonly errors: ErrorModel<T>;
        readonly message: string;
        readonly valid: boolean;
        readonly invalid: boolean;
    }>;
};
