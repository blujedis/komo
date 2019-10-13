
// PRIVATE //

type TagType = string | Partial<{ type: string; }>;

function isTagType(value: TagType, type: string) {
  const compare = ((typeof value === 'object' ? value.type : value) || '').toLowerCase();
  if (!compare) return false;
  return compare.startsWith(type);
}

// PUBLIC //

/**
 * Merges own property names and types.
 * 
 * @param target the target object.
 * @param source the source to merge to target.
 */
export function merge<T, S>(target: T, source: S) {
  for (const k in source) {
    if (!source.hasOwnProperty(k)) continue;
    target[k as any] = source[k];
  }
  return target as T & S;
}

/**
 * Checks if value or value.type is "radio".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isRadio(value: TagType) {
  return isTagType(value, 'radio');
}

/**
 * Checks if value or value.type is "checkbox".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isCheckbox(value: TagType) {
  return isTagType(value, 'checkbox');
}

/**
 * Checks if value or value.type is "select".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isSelect(value: TagType) {
  return isTagType(value, 'select');
}

/**
 * Checks if value or value.type is "input".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isInput(value: TagType) {
  return isTagType(value, 'input');
}

/**
 * Checks if value or value.type is "textarea".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isTextarea(value: TagType) {
  return isTagType(value, 'textarea');
}

/**
 * Checks if value or value.type is "file".
 * 
 * @param value the string or object containing type to inspect.
 */
export function isFile(value: TagType) {
  return isTagType(value, 'file');
}
