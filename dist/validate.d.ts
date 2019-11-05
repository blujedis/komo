import { ValidationError, ObjectSchema } from 'yup';
import { IModel, ErrorModel, ValidationSchema, IValidator, IRegisteredElement, ISchemaAst, IFindField, ErrorMessageModel } from './types';
/**
 * Lookup helper for element or prop in element.
 *
 * @param findField the core lookup helper for finding elements.
 */
export declare function lookup<T extends IModel>(findField: IFindField<T>): {
    element: (pathOrElement: string | IRegisteredElement<T>) => IRegisteredElement<T>;
    at: <K extends "blur" | "type" | "hidden" | "reset" | "accessKey" | "accessKeyLabel" | "autocapitalize" | "dir" | "draggable" | "innerText" | "lang" | "offsetHeight" | "offsetLeft" | "offsetParent" | "offsetTop" | "offsetWidth" | "spellcheck" | "title" | "translate" | "click" | "addEventListener" | "removeEventListener" | "assignedSlot" | "attributes" | "classList" | "className" | "clientHeight" | "clientLeft" | "clientTop" | "clientWidth" | "id" | "localName" | "namespaceURI" | "onfullscreenchange" | "onfullscreenerror" | "outerHTML" | "prefix" | "scrollHeight" | "scrollLeft" | "scrollTop" | "scrollWidth" | "shadowRoot" | "slot" | "tagName" | "attachShadow" | "closest" | "getAttribute" | "getAttributeNS" | "getAttributeNames" | "getAttributeNode" | "getAttributeNodeNS" | "getBoundingClientRect" | "getClientRects" | "getElementsByClassName" | "getElementsByTagName" | "getElementsByTagNameNS" | "hasAttribute" | "hasAttributeNS" | "hasAttributes" | "hasPointerCapture" | "insertAdjacentElement" | "insertAdjacentHTML" | "insertAdjacentText" | "matches" | "msGetRegionContent" | "releasePointerCapture" | "removeAttribute" | "removeAttributeNS" | "removeAttributeNode" | "requestFullscreen" | "requestPointerLock" | "scroll" | "scrollBy" | "scrollIntoView" | "scrollTo" | "setAttribute" | "setAttributeNS" | "setAttributeNode" | "setAttributeNodeNS" | "setPointerCapture" | "toggleAttribute" | "webkitMatchesSelector" | "baseURI" | "childNodes" | "firstChild" | "isConnected" | "lastChild" | "nextSibling" | "nodeName" | "nodeType" | "nodeValue" | "ownerDocument" | "parentElement" | "parentNode" | "previousSibling" | "textContent" | "appendChild" | "cloneNode" | "compareDocumentPosition" | "contains" | "getRootNode" | "hasChildNodes" | "insertBefore" | "isDefaultNamespace" | "isEqualNode" | "isSameNode" | "lookupNamespaceURI" | "lookupPrefix" | "normalize" | "removeChild" | "replaceChild" | "ATTRIBUTE_NODE" | "CDATA_SECTION_NODE" | "COMMENT_NODE" | "DOCUMENT_FRAGMENT_NODE" | "DOCUMENT_NODE" | "DOCUMENT_POSITION_CONTAINED_BY" | "DOCUMENT_POSITION_CONTAINS" | "DOCUMENT_POSITION_DISCONNECTED" | "DOCUMENT_POSITION_FOLLOWING" | "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC" | "DOCUMENT_POSITION_PRECEDING" | "DOCUMENT_TYPE_NODE" | "ELEMENT_NODE" | "ENTITY_NODE" | "ENTITY_REFERENCE_NODE" | "NOTATION_NODE" | "PROCESSING_INSTRUCTION_NODE" | "TEXT_NODE" | "dispatchEvent" | "childElementCount" | "children" | "firstElementChild" | "lastElementChild" | "append" | "prepend" | "querySelector" | "querySelectorAll" | "nextElementSibling" | "previousElementSibling" | "after" | "before" | "remove" | "replaceWith" | "innerHTML" | "animate" | "getAnimations" | "onabort" | "onanimationcancel" | "onanimationend" | "onanimationiteration" | "onanimationstart" | "onauxclick" | "onblur" | "oncancel" | "oncanplay" | "oncanplaythrough" | "onchange" | "onclick" | "onclose" | "oncontextmenu" | "oncuechange" | "ondblclick" | "ondrag" | "ondragend" | "ondragenter" | "ondragexit" | "ondragleave" | "ondragover" | "ondragstart" | "ondrop" | "ondurationchange" | "onemptied" | "onended" | "onerror" | "onfocus" | "ongotpointercapture" | "oninput" | "oninvalid" | "onkeydown" | "onkeypress" | "onkeyup" | "onload" | "onloadeddata" | "onloadedmetadata" | "onloadend" | "onloadstart" | "onlostpointercapture" | "onmousedown" | "onmouseenter" | "onmouseleave" | "onmousemove" | "onmouseout" | "onmouseover" | "onmouseup" | "onpause" | "onplay" | "onplaying" | "onpointercancel" | "onpointerdown" | "onpointerenter" | "onpointerleave" | "onpointermove" | "onpointerout" | "onpointerover" | "onpointerup" | "onprogress" | "onratechange" | "onreset" | "onresize" | "onscroll" | "onsecuritypolicyviolation" | "onseeked" | "onseeking" | "onselect" | "onselectionchange" | "onselectstart" | "onstalled" | "onsubmit" | "onsuspend" | "ontimeupdate" | "ontoggle" | "ontouchcancel" | "ontouchend" | "ontouchmove" | "ontouchstart" | "ontransitioncancel" | "ontransitionend" | "ontransitionrun" | "ontransitionstart" | "onvolumechange" | "onwaiting" | "onwheel" | "oncopy" | "oncut" | "onpaste" | "contentEditable" | "inputMode" | "isContentEditable" | "dataset" | "nonce" | "tabIndex" | "focus" | "style" | "required" | "min" | "max" | "maxLength" | "minLength" | "pattern" | "options" | "unregister" | "name" | "path" | "initValue" | "initChecked" | "defaultValue" | "defaultChecked" | "defaultValuePersist" | "defaultCheckedPersist" | "validateChange" | "validateBlur" | "enableNativeValidation" | "enableModelUpdate" | "validate" | "unbind" | "rebind" | "value" | "checked" | "multiple">(pathOrElement: string | IRegisteredElement<T>, prop: K) => IRegisteredElement<T>[K];
};
/**
 * Parses yup error to friendly form errors.
 *
 * @param error the emitted yup error.
 */
export declare function yupToErrors<T extends IModel>(error: ValidationError, findField?: IFindField<T>): ErrorModel<T>;
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
export declare function normalizeValidator<T extends IModel>(schema: ValidationSchema<T>, findField?: IFindField<T>): IValidator<T>;
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
 * Purge default values from schema. We need to to this otherwise
 * Yup will not properly throw errors.
 *
 * @param schema the validation schema
 */
export declare function purgeSchemaDefaults<T extends IModel>(schema: ObjectSchema<T>): void;
/**
 * Normalizes default values.
 *
 * @param defaults user defined defaults.
 * @param schema a yup validation schema or user defined function.
 * @param purge when true purge defaults from yup schema
 */
export declare function normalizeDefaults<T extends IModel>(defaults: T, schema: any, purge?: boolean): Promise<T>;
