import { IRegisterElement, IRegisterOptions, IModel, IBaseApi } from './types';
import { LegacyRef } from 'react';
declare type RegisterElement = (element: IRegisterElement) => LegacyRef<HTMLElement>;
export declare function initElement<T extends IModel>(api?: IBaseApi<T>): {
    (path: string, options?: IRegisterOptions<T>): RegisterElement;
    (options: IRegisterOptions<T>): RegisterElement;
    (element: IRegisterElement): void;
};
export {};
