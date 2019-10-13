export declare type KeyOf<T> = Extract<keyof T, string>;
export declare type ValueOf<T, K extends KeyOf<T>> = T[K];
export declare type FormState = 'pristine' | 'touched' | 'error';
export interface IErrorState {
    value: any;
    message: string;
    validator: string;
}
export declare type ErrorStates<T extends object> = {
    [K in keyof T]: IErrorState[];
};
