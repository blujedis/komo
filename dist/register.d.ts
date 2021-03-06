import { IRegisterElement, IRegisterOptions, IRegisteredElement, IModel, IKomoBase, RegisterElement } from './types';
/**
 * Creates initialized methods for binding and registering an element.
 *
 * @param api the base form api.
 */
export declare function initElement<T extends IModel>(api?: IKomoBase<T>): {
    (options: IRegisterOptions<T>): RegisterElement<T>;
    (element: IRegisterElement): IRegisteredElement<T>;
};
