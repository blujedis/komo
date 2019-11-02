import { ValidationError, ObjectSchema } from 'yup';
import { IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement, ISchemaAst } from './types';
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 */
export declare function yupToErrors<T extends IModel>(error: ValidationError): ErrorModel<T>;
/**
 * Converts AST type schema to Yup Schema or merges with existing Yup Schema.
 *
 * @param ast the schema ast to convert.
 * @param schema optional existing schema.
 */
export declare function astToSchema<T extends IModel>(ast: ISchemaAst, schema?: ObjectSchema<T>): ObjectSchema<T>;
/**
 * Normalizes the schema into common interface.
 *
 * @param schema the yup schema or user function for validation.
 */
export declare function normalizeValidator<T extends IModel>(schema: ValidationSchema<T>): IValidator<T>;
/**
 * Gets list of native validation keys.
 *
 * @param element the element to be inspected.
 */
export declare function getNativeValidators(element: IRegisteredElement<any>): string[];
/**
 * Checks if element has native validation keys.
 *
 * @param element the element to be inspected.
 */
export declare function hasNativeValidators(element: IRegisteredElement<any>): boolean;
