import { ValidationError, ObjectSchema } from 'yup';
import { IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement, ISchemaAst, KeyOf, IGetElement, ErrorMessageModel, CastHandler } from './types';
import { MutableRefObject } from 'react';
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 * @param getElement a method which gets an element.
 */
export declare function yupToErrors<T extends IModel>(error: ValidationError, getElement?: IGetElement<T>): ErrorModel<T>;
/**
 * Converts AST type schema to Yup Schema or merges with existing Yup Schema.
 *
 * @param ast the schema ast to convert.
 * @param schema optional existing schema.
 */
export declare function astToSchema<T extends IModel>(ast: ISchemaAst, schema?: ObjectSchema<T>): ObjectSchema<T>;
/**
 * Converts error message model to standard error model.
 *
 * @param errors the collection of errors as ErrorModel or ErrorMessageModel.
 */
export declare function ensureErrorModel<T extends IModel>(errors: ErrorModel<T> | ErrorMessageModel<T>): ErrorModel<T>;
/**
 * Normalizes the schema into common interface.
 * Always returns object of model or object of key value whe using validateAT.
 *
 * @param schema the yup schema or user function for validation.
 */
export declare function normalizeValidator<T extends IModel>(schema: ValidationSchema<T>, findField: IGetElement<T>, fields: MutableRefObject<Set<IRegisteredElement<T>>>, vanities: string[]): IValidator<T>;
/**
 * Gets list of native validation keys.
 *
 * @param element the element to be inspected.
 */
export declare function getNativeValidators(element: IRegisteredElement<any>): string[];
/**
 * Gets list of validatable types.
 *
 * @param element the element to be inpsected.
 */
export declare function getNativeValidatorTypes(element: IRegisteredElement<any>): string[];
/**
 * Checks if element has native validation keys.
 *
 * @param element the element to be inspected.
 */
export declare function hasNativeValidators(element: IRegisteredElement<any>): boolean;
/**
 * Normalizes default values.
 *
 * @param defaults user defined defaults.
 * @param schema a yup validation schema or user defined function.
 * @param purge when true purge defaults from yup schema
 */
export declare function promisifyDefaults<T extends IModel>(defaults: T, yupDefaults?: Partial<T>): Promise<T>;
/**
 * Checks if object is a Yup Schema.
 *
 * @param schema the value to inspect if is a yup schema.
 */
export declare function isYupSchema(schema: any): any;
/**
 * If is a Yup Schema parses defaults then stores original source.
 * This allows for re-populating your defaults on next time your route is resolved.
 *
 * @param schema the provided validation schema.
 */
export declare function parseYupDefaults<T extends IModel>(schema: ValidationSchema<T>, purge: boolean): {
    schema: any;
    defaults: any;
};
/**
 * If object or array shallow clone otherwise return value.
 *
 * @param value the value to be cloned.
 */
export declare function simpleClone(value: any): any;
/**
 * Uses yup to try and cast value to type or calls back for user defined casting.
 *
 * @param value the value to be cast.
 */
export declare function castValue(value: any): any;
/**
 * Normalizes the cast handler so the same signature can be called.
 * When the handler is disabled a noop is created returning the original value.
 *
 * @param handler the cast handler or whether the handler is enabled.
 */
export declare function normalizeCasting<T extends IModel>(handler: boolean | CastHandler): (value: any, path: string, name: KeyOf<T>) => void;
/**
 * Parses the element for native validators building up an ast for use with Yup.
 * Only a minimal subset of yup validations are supported in converting from native
 * validators or element type values.
 *
 * Parser supports converting type="element_type" for the following input.
 *
 * text = string
 * number = number
 * checkbox = boolean
 *
 * ONLY The following native validators are supported.
 *
 * email, url, range, required
 * min, max, minLength, maxLength,
 * pattern.
 *
 * @param element the element to be parsed.
 */
export declare function parseNativeValidators<T extends IModel>(element: IRegisteredElement<T>, schemaAst: ISchemaAst): ISchemaAst;
