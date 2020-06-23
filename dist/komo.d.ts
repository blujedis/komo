import { IOptions, IModel, IKomo } from './types';
export declare type Options<T, D> = Omit<IOptions<T, D>, 'promisifiedDefaults' | 'yupDefaults'>;
/**
 * Initializes Komo.
 *
 * @param options the komo options.
 */
export declare function initKomo<T extends IModel, D extends IModel = {}>(options?: Options<T, D>): IKomo<T & Partial<D>>;
