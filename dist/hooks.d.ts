import { IModel, KeyOf, IKomo, IUseFields, IUseField } from './types';
export declare function initHooks<T extends IModel>(komo: IKomo<T>): {
    useField: {
        <K extends string>(name: K, virtual: boolean): IUseField<Record<K, T>, import("./types").IRegister<Record<K, T>>>;
        (name: KeyOf<T>): IUseField<T>;
    };
    useFields: {
        <A extends string>(vanity: boolean, ...keys: A[]): IUseFields<A, IUseField<Record<A, T>, import("./types").IRegister<Record<A, T>>>>;
        <K_1 extends Extract<keyof T, string>>(...names: K_1[]): IUseFields<K_1, IUseField<T, import("./types").IRegister<T>>>;
    };
};
