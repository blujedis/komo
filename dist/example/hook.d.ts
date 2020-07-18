import { IModel, IFormState, KeyOf } from '..';
export default function useCustomHook<T extends IModel>(state: IFormState<T>): (prop: KeyOf<T>, def?: string) => {
    readonly message: string;
    readonly valid: boolean;
    readonly invalid: boolean;
};
