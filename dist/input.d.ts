import { HTMLAttributes } from 'react';
import { IFormApi } from './form';
import { KeyOf } from './types';
interface IInputAttributes extends HTMLAttributes<any> {
    [key: string]: any;
}
export declare function useFormInput<T extends object = any, K extends KeyOf<T> = any>(name: K, initialValue?: T[K], attributes?: IInputAttributes, form?: IFormApi<T>): {
    value: T[K];
    setValue: (value: T[K]) => void;
    attributes: IInputAttributes;
};
export {};
