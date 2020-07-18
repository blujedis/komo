import { IModel, IFormState } from '..';
export default function useCustomHook<T extends IModel>(state: IFormState<T>): (prop: Extract<keyof T, string>, def?: string) => {
    readonly message: string;
    readonly valid: boolean;
    readonly invalid: boolean;
};
