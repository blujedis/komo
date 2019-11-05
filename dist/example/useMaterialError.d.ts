import { IModel, IFormState } from '../types';
export declare function useMaterialError<T extends IModel>(state: IFormState<T>): (prop: Extract<keyof T, string>, def?: string) => {
    readonly message: string;
    readonly valid: boolean;
    readonly invalid: boolean;
};
