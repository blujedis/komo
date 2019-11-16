import { IOptions, IModel, IKomo } from './types';
/**
 * Initializes Komo.
 *
 * @param options the komo options.
 */
export declare function initKomo<T extends IModel, D extends IModel = {}>(options?: IOptions<T, D>): IKomo<T & Partial<D>>;
