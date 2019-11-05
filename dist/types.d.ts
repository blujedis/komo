import { BaseSyntheticEvent, MutableRefObject, LegacyRef, FormEvent } from 'react';
import { ObjectSchema, ValidateOptions } from 'yup';
import { createLogger } from './utils';
/**
 * Extracts key from type as string.
 */
export declare type KeyOf<T> = Extract<keyof T, string>;
/**
 * Extracts value from type using key of type as string.
 */
export declare type ValueOf<T, K extends KeyOf<T>> = T[K];
/**
 * Object contiaing useField hooks for convenience.
 */
export declare type UseFields<Fields extends string, T> = {
    [P in Fields]: T;
};
/**
 * Infers the return type of a passed function.
 */
export declare type InferReturn<F extends Function> = F extends (...args: any[]) => infer R ? R : never;
/**
 * The form model.
 */
export interface IModel {
    [key: string]: any;
}
/**
 * Validation handler function for user defined validationSchema.
 */
export declare type ValidateModelHandler<T extends IModel> = (model: T) => null | undefined | ErrorMessageModel<T> | ErrorModel<T> | PromiseStrict<T, ErrorModel<T> | ErrorMessageModel<T>>;
/**
 * Generic type for either yup ObjectSchema or user defined Validation Schema handler function.
 */
export declare type ValidationSchema<T extends IModel> = ObjectSchema<T> | ValidateModelHandler<T>;
/**
 * Promise type restricting return type and typed reason for errors.
 */
export interface PromiseStrict<T, E = any> {
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: E) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: E) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Called after thenable and catch.
     *
     * @param onfinally on final handler of promise.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}
/**
 * Typed model for Error Model promises.
 */
export declare type PromiseErrorModel<T extends IModel> = PromiseStrict<T, ErrorModel<T>>;
export interface IValidator<T extends IModel> {
    /**
     * Method to validate model schema.
     *
     * @param model the model to be validated.
     * @param options optional yup options used upon validation.
     */
    validate(model: T, options?: ValidateOptions): PromiseErrorModel<T>;
    /**
     * Validates model value at path.
     *
     * @param path the path in the model to validate.
     * @param value the value to be validated.
     * @param options optional yup options used upon validation.
     */
    validateAt?(path: string, value: object, options?: ValidateOptions): PromiseErrorModel<Partial<T>>;
    /**
     * Validates using user defined model function extracts at path for result.
     *
     * @param path the path in the model to validate.
     * @param model the current model
     */
    validateAt?(path: string, model: T): PromiseErrorModel<Partial<T>>;
}
/**
 * HTML5 Native validation properties to convert to yup ObjectSchema.
 */
export interface INativeValidators {
    string?: undefined;
    number?: undefined;
    boolean?: undefined;
    email?: undefined;
    url?: undefined;
    required?: boolean | string;
    min?: number | string;
    max?: number | string;
    maxLength?: number | string;
    minLength?: number | string;
    pattern?: string | RegExp;
}
/**
 * Array of configuration AST to convert to yup ObjectSchema.
 */
export interface ISchemaAst {
    [key: string]: Array<[KeyOf<INativeValidators>, INativeValidators[KeyOf<INativeValidators>]]>;
}
/**
 * Handler type for form submission.
 */
export declare type SubmitHandler<T extends IModel> = (model?: T, errors?: ErrorModel<T>, event?: BaseSyntheticEvent) => void;
/**
 * Interface for finding elements.
 */
export interface IFindField<T extends IModel> {
    /**
     * Simply returns element here for normalization.
     *
     * @param element when provided just returns element.
     */
    (element: IRegisteredElement<T>): IRegisteredElement<T>;
    /**
     * Looks up the element by it's path or name.
     *
     * @param nameOrPath the path or name used to lookup the element.
     */
    (nameOrPath: string): IRegisteredElement<T>;
}
export interface IOptions<T extends IModel> {
    /**
     * Default model values (default: {})
     */
    defaults?: Partial<T> | Promise<Partial<T>>;
    /**
     * A Yup ObjectSchema or custom function for validating form (default: undefined)
     */
    validationSchema?: ValidationSchema<T>;
    /**
     * When true validation is triggered on change (default: false)
     */
    validateChange?: boolean;
    /**
     * When true validation is triggered on blur (default: true)
     */
    validateBlur?: boolean;
    /**
     * When true validation is triggered on submit (default: true)
     */
    validateSubmit?: boolean;
    /**
     * When true validation is triggered on submit if error halts submit (default: false)
     * Defaults to false so user opts in can see submissions are working.
     */
    validateSubmitExit?: boolean;
    /**
     * When true validation is triggered when form is first initialized (default: false)
     */
    validateInit?: boolean;
    /**
     * When true internal warnings are logged to console (default: true)
     */
    enableWarnings?: boolean;
    /**
     * When true and validationSchema is NOT user function native validation converted to yup ObjectSchema (default: true)
     */
    enableNativeValidation?: boolean;
}
/**
 * Internal options interface.
 */
export interface IOptionsInternal<T extends IModel> extends IOptions<T> {
    /**
     * Komo populates initial model from defaults, or cast schema defaults.
     */
    model?: T;
}
/**
 * Type which when called returns an React ref of HTMLElement.
 */
export declare type RegisterElement = (element: IRegisterElement) => LegacyRef<HTMLElement>;
/**
 * Interface for registering an element, extends HTMLElement.
 */
export interface IRegisterElement extends Partial<HTMLElement> {
    /**
     * The name of the HTMLElement name="some_name".
     */
    name?: string;
    /**
     * The type of the element type="text".
     */
    type?: string;
    /**
     * The value of the element value="some_value".
     */
    value?: string;
    /**
     * Whether the element when checkbox or radio is checked.
     */
    checked?: boolean;
    /**
     * The HTMLOptionsCollection present when element is a select/multiple.
     */
    options?: HTMLOptionsCollection;
    /**
     * True when element is a select tagged with multiple="true"
     */
    multiple?: boolean;
    /**
     * True when element is required.
     */
    required?: boolean;
    /**
     * When element should be a min of this value min="5".
     */
    min?: string | number;
    /**
     * When element should be a max of this value man="5".
     */
    max?: string | number;
    /**
     * When element should match this pattern.
     */
    pattern?: string | RegExp;
    /**
     * When element string to be a min of this length.
     */
    minLength?: string | number;
    /**
     * When element string to be a max of this length.
     */
    maxLength?: string | number;
}
/**
 * Interface for custom registrations of an element.
 */
export interface IRegisterOptions<T extends IModel> {
    /**
     * The name of the element.
     */
    name?: KeyOf<T>;
    /**
     * Alertnate path in model to get/set data from for element value.
     */
    path?: string;
    /**
     * The default value to use on resets.
     */
    defaultValue?: any;
    /**
     * The default value to use when is element type using "checked".
     */
    defaultChecked?: boolean;
    /**
     * Whether the element should be initialized as required.
     */
    required?: boolean;
    /**
     * Default for element should be a min of this value min="5".
     */
    min?: number;
    /**
     * Default for element should be a max of this value min="5".
     */
    max?: number;
    /**
     * Default element string should be a max of this length.
     */
    maxLength?: number;
    /**
     * Default element string should be a min of this length.
     */
    minLength?: number;
    /**
     * Default element should match this pattern.
     */
    pattern?: RegExp;
    /**
     * Whether element should validate on change overrides main options.
     */
    validateChange?: boolean;
    /**
     * Whether element should validate on blur, overrides main options.
     */
    validateBlur?: boolean;
    /**
     * Whether or not native validation should be enabled, overrides main options.
     */
    enableNativeValidation?: boolean;
    /**
     * When true element auto updates the model on blur or change. This is not to be confused
     * with validateChange or validateBlur. Set to false to update your model manually.
     */
    enableModelUpdate?: boolean;
}
/**
 * The initialized registered element interface.
 */
export interface IRegisteredElement<T extends IModel> extends IRegisterElement {
    /**
     * The name of the element.
     */
    name: KeyOf<T>;
    /**
     * The alternate model path for getting/setting field value.
     */
    path?: string;
    /**
     * The initialized value if any.
     */
    initValue?: any;
    /**
     * The initialized checked value if any.
     */
    initChecked?: boolean;
    /**
     * The default value used when reset is called.
     */
    defaultValue?: any;
    /**
     * The default checked value when reset is called if applicable.
     */
    defaultChecked?: boolean;
    /**
     * Same as defaultValue but some libs
     * override defaultValue.
     */
    defaultValuePersist?: any;
    /**
     * Same as defaultChecked but some libs
     * override defaultChecked.
     */
    defaultCheckedPersist?: boolean;
    /**
     * Whether element should validate on change overrides main options.
     */
    validateChange?: boolean;
    /**
     * Whether element should validate on blur, overrides main options.
     */
    validateBlur?: boolean;
    /**
     * Whether or not native validation should be enabled, overrides main options.
     */
    enableNativeValidation?: boolean;
    /**
     * When true element auto updates the model on blur or change. This is not to be confused
     * with validateChange or validateBlur. Set to false to update your model manually.
     */
    enableModelUpdate?: boolean;
    /**
     * Validates the element using initialized validation configuration.
     */
    validate?: () => PromiseStrict<Partial<T>, Partial<ErrorModel<T>>>;
    /**
     * Unbinds events for the element.
     */
    unbind?: () => void;
    /**
     * Rebind defaults values.
     */
    rebind?: () => void;
    /**
     * Unbinds and unregisters element from Komo.
     */
    unregister?: () => void;
    /**
     * Resets the element to the default value.
     */
    reset?: () => void;
}
/**
 * Form field/element validation error interface.
 */
export interface IValidationError {
    /**
     * The type of validation error e.g. "ValidationError".
     */
    type?: string;
    /**
     * The which triggered the validation error e.g. "required".
     */
    name?: string;
    /**
     * The model path which caused the error e.g. "user.email".
     */
    path?: string;
    /**
     * The current model value at the specified path.
     */
    value?: any;
    /**
     * The validation error message.
     */
    message?: string;
}
/**
 * Gets top level list of error keys from model.
 */
export declare type ErrorKeys<T extends IModel> = keyof T;
/**
 * Using top level model keys creates type with value of IValidationErrors in array.
 */
export declare type ErrorModel<T extends IModel> = {
    [K in ErrorKeys<T>]: IValidationError[];
};
/**
 * Used for user defined validation, allows returning simple errors as string or array of string.
 * Result for each key then converted to IValidationError array.
 */
export declare type ErrorMessageModel<T extends IModel> = {
    [K in ErrorKeys<T>]: string | string[];
};
/**
 * Simple internal logger.
 */
declare type Logger = ReturnType<typeof createLogger>;
export interface IFormState<T extends IModel> {
    /**
     * The data model.
     */
    model: T;
    /**
     * Object containing current error model.
     */
    errors: ErrorModel<T>;
    /**
     * Array of current touched fields.
     */
    touched: Array<KeyOf<T>>;
    /**
     * Array of current dirty fields.
     */
    dirty: Array<KeyOf<T>>;
    /**
     * Boolean indicating if is mounted.
     */
    isMounted: boolean;
    /**
     * Boolean indicating if form is submitting.
     */
    isSubmitting: boolean;
    /**
     * Boolean indicating if form is submitted.
     */
    isSubmitted: boolean;
    /**
     * The number count of submissions.
     */
    submitCount: number;
    /**
     * Boolean indicating if the form is valid.
     */
    valid: boolean;
    /**
     * Boolean indicating if the form is invalid.
     */
    invalid: boolean;
    /**
     * Boolean indicating if the form is dirty.
     */
    isDirty: boolean;
    /**
     * Boolean indicating if the form has been touched.
     */
    isTouched: boolean;
}
/**
 * The base API interface used by form field elements and form submit, reset handlers.
 */
export interface IBaseApi<T extends IModel> {
    /**
     * Simple internal logger.
     */
    log: Logger;
    /**
     * React MutableRefObject of registered elements.
     */
    fields: MutableRefObject<Set<IRegisteredElement<T>>>;
    /**
     * React MutableRefObject of native validation AST schema configurations.
     */
    schemaAst: MutableRefObject<ISchemaAst>;
    /**
     * React MutableRefObject of default model values.
     */
    defaults: MutableRefObject<T>;
    /**
     * React MutableRefObject of active model values.
     */
    model: MutableRefObject<T>;
    /**
     * React MutableRefObject of errors.
     */
    errors: MutableRefObject<ErrorModel<T>>;
    /**
     * React MutableRefObject indicating if form/Komo is mounted.
     */
    mounted: MutableRefObject<boolean>;
    /**
     * React MutableRefObject indicating the form submission count.
     */
    submitCount: MutableRefObject<number>;
    /**
     * React MutableRefObject indicating if form is submitting.
     */
    submitting: MutableRefObject<boolean>;
    /**
     * React MutableRefObject indicating if form has submitted.
     */
    submitted: MutableRefObject<boolean>;
    /**
     * Komo initialization options.
     */
    options: IOptions<T>;
    /**
     * Object containing active state of the form.
     */
    state: IFormState<T>;
    /**
     * Initializes and normalizes the schema.
     */
    initSchema(): T;
    /**
     * Triggers rerendering of the form.
     *
     * @param status optional status or tag event that's calling the rerender.
     */
    render(status: string): void;
    /**
     * Triggers rerendering of the form.
     */
    render(): string;
    /**
     * Gets the default value at a given model path or all default model values.
     *
     * @param path the path to get the default for.
     */
    getDefault(path?: string): any;
    /**
     * Sets the default value at the specified. path.
     *
     * @param path the path to be set.
     * @param value the value to be set at path.
     */
    setDefault(path: string, value: any): void;
    /**
     * Sets the default model.
     *
     * @param model the model complete model to be set.
     * @param extend whether to merge/extend with existing model.
     */
    setDefault(model: T, extend?: boolean): void;
    /**
     * Updaetes default values from synchronizing with model and elements.
     *
     * @param defaults
     */
    syncDefaults(defaults: T): void;
    /**
     * Gets the model value at the specified path.
     *
     * @param path the path to get model at.
     */
    getModel(path: string): any;
    /**
     * Gets the entire model.
     */
    getModel(): T;
    /**
     * Sets model value at the specified path.
     *
     * @param path the path to set value at.
     * @param value the value to be sat at path.
     */
    setModel(path: string, value: any): void;
    /**
     * Sets the complete model.
     *
     * @param model the model to be set.
     * @param extend when true extends/merges with existing model.
     */
    setModel(model: T, extend?: boolean): void;
    /**
     * The normalized validation interface used to validate model and model paths.
     */
    validator: IValidator<T>;
    /**
     * Indicates if form supports validation.
     */
    isValidatable(): boolean;
    /**
     * Inspect element and checks if validation change is enabled.
     *
     * @param element the element to be inspected.
     */
    isValidateChange(element: IRegisteredElement<T>): boolean;
    /**
     * Inspect element and checks if validation change is enabled looking up by field name.
     *
     * @param name the element name to be looked up.
     */
    isValidateChange(name: KeyOf<T>): boolean;
    /**
     * Inspect element and checks if validation blur is enabled.
     *
     * @param element the element to be inspected.
     */
    isValidateBlur(element: IRegisteredElement<T>): boolean;
    /**
     * Inspect element and checks if validation change is enabled looking up by field name.
     *
     * @param name the element name to be looked up.
     */
    isValidateBlur(name: KeyOf<T>): boolean;
    /**
     * Validates model for the specified element.
     *
     * @param element the element to be validated.
     * @param options the yup validation options if any to pass.
     */
    validateModelAt(element: IRegisteredElement<T>, options?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>>;
    /**
     * Validates model for the specified element.
     *
     * @param name the name of the element to lookup and validate.
     * @param options the yup validation options if any to pass.
     */
    validateModelAt(name: KeyOf<T>, options?: ValidateOptions): PromiseStrict<Partial<T>, Partial<ErrorModel<T>>>;
    /**
     * Validates the specified model.
     *
     * @param options the yup validation options if any to pass.
     */
    validateModel(options?: ValidateOptions): PromiseStrict<T, ErrorModel<T>>;
    /**
     * Sets form field/element as touched.
     *
     * @param name the name of the form field/element.
     */
    setTouched(name: KeyOf<T>): void;
    /**
     * Removes form field/element as touched.
     */
    removeTouched(name: KeyOf<T>): void;
    /**
     * Clears all touched field/elements.
     */
    clearTouched(): void;
    /**
     * Checks if field/element is touched.
     *
     * @param name the name of the form field/element.
     */
    isTouched(name?: KeyOf<T>): boolean;
    /**
     * Sets form field/element as dirty.
     *
     * @param name the name of the form field/element.
     */
    setDirty(name: KeyOf<T>): void;
    /**
     * Removes form field/element as dirty.
     */
    removeDirty(name: KeyOf<T>): boolean;
    /**
     * Clears all dirty field/elements.
     */
    clearDirty(): void;
    /**
     * Checks if field/element is dirty.
     *
     * @param name the name of the form field/element.
     */
    isDirty(name?: KeyOf<T>): boolean;
    /**
     * Sets field/element error.
     *
     * @param name the field/element name to set error for.
     * @param value the error value to be set.
     */
    setError(name: KeyOf<T>, value: any): ErrorModel<T>;
    /**
     * Sets complete error model.
     *
     * @param errors the error model to be set.
     * @param extend whether to extend/merge with existing errors.
     */
    setError(errors: ErrorModel<T>, extend?: boolean): ErrorModel<T>;
    /**
     * Removes error for the specified field/element by name.
     *
     * @param name the name of the field/element to remove error for.
     */
    removeError(name: KeyOf<T>): boolean;
    /**
     * Clears all errors from error model.
     */
    clearError(): void;
    /**
     * Finds field by element used here for normalization.
     *
     * @param element a registered element.
     */
    getElement(element: IRegisteredElement<T>): IRegisteredElement<T>;
    /**
     * Finds a field/element by name or path.
     *
     * @param nameOrPath the name or path used to lookup element.
     */
    getElement(nameOrPath: string): IRegisteredElement<T>;
    /**
     * Unregisters an element by instance.
     *
     * @param element the element to be unregistered.
     */
    unregister(element: IRegisteredElement<T>): void;
    /**
     * Unregisters an element by name or path.
     *
     * @param name the element name to lookup to be unregistered.
     */
    unregister(name: KeyOf<T>): void;
}
declare type BasePicked = 'render' | 'state' | 'getModel' | 'setModel' | 'validateModel' | 'validateModelAt' | 'setTouched' | 'removeTouched' | 'clearTouched' | 'setDirty' | 'removeDirty' | 'clearDirty' | 'setError' | 'removeError' | 'clearError' | 'getElement';
export interface IKomoExtended<T extends IModel> extends Pick<IBaseApi<T>, BasePicked> {
    register: {
        (options: IRegisterOptions<T>): RegisterElement;
        (element: IRegisterElement): void;
    };
    reset(values?: T): void;
    handleReset(event: BaseSyntheticEvent): Promise<void>;
    handleReset(values: T): (event: BaseSyntheticEvent) => Promise<void>;
    handleSubmit(handler: SubmitHandler<T>): (event: FormEvent<HTMLFormElement>) => Promise<void>;
    withKomo?<R, H extends (hook: IKomo<T>) => R>(hook: H): InferReturn<H>;
}
export interface IKomo<T extends IModel> extends Omit<IKomoExtended<T>, 'withHook'> {
}
export {};
