import { IModel, IKomo, UseFields } from './types';
export declare function initHooks<T extends IModel>(komo: IKomo<T>): {
    useField: (name: Extract<keyof T, string>, def?: string) => {
        readonly element: import("./types").IRegisteredElement<T>;
        readonly touched: boolean;
        readonly dirty: boolean;
        readonly errors: import("./types").ErrorModel<T>;
        readonly message: string;
        readonly valid: boolean;
        readonly invalid: boolean;
    };
    useFields: <K extends Extract<keyof T, string>>(...name: K[]) => UseFields<K, {
        readonly element: import("./types").IRegisteredElement<T>;
        readonly touched: boolean;
        readonly dirty: boolean;
        readonly errors: import("./types").ErrorModel<T>;
        readonly message: string;
        readonly valid: boolean;
        readonly invalid: boolean;
    }>;
};
