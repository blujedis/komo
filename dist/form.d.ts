import { MutableRefObject, SetStateAction, Dispatch } from 'react';
import { ObjectSchema } from 'yup';
import { ErrorStates, KeyOf, FormState, IErrorState } from './types';
export interface IFormOptions<T extends object> {
    ref?: MutableRefObject<HTMLFormElement>;
    model: T;
}
export interface IFormState<T extends object> extends IFormOptions<T> {
    pristine?: Array<KeyOf<T>>;
    touched?: Array<KeyOf<T>>;
    error?: ErrorStates<T>;
}
export interface IFormApi<T extends object> {
    model: T;
    ref: MutableRefObject<HTMLFormElement>;
    state: IFormOptions<T>;
    setState: Dispatch<SetStateAction<IFormOptions<T>>>;
    setModel<K extends KeyOf<T>>(key: K, value: T[K]): void;
    setModel(model: Partial<T>): void;
    pristine: Array<KeyOf<T>>;
    setPristine(key: KeyOf<T>): void;
    removePristine(key: KeyOf<T>): boolean;
    resetPristine(): void;
    isPristine(): boolean;
    touched: Array<KeyOf<T>>;
    setTouched(key: KeyOf<T>): void;
    removeTouched(key: KeyOf<T>): boolean;
    resetTouched(): void;
    isTouched(): boolean;
    error: ErrorStates<T>;
    setError(key: KeyOf<T>, state: IErrorState): void;
    removeError(key: KeyOf<T>, state: IErrorState): boolean;
    resetError(): void;
    isValid(schema?: ObjectSchema<T>): boolean;
    clear(type: FormState): void;
    reset(): void;
    register<K extends KeyOf<T>>(key: K, initialValue?: T[K]): [T[K], ((value: T[K]) => void)];
    unregister(name: string): boolean;
}
export declare function useForm<T extends object>(options: IFormOptions<T>): IFormApi<T>;
