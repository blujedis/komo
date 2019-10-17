
export const EVENTS = {
  blur: 'blur',
  change: 'change',
  input: 'input'
};

export const EVENT_CHANGE_MAP = {
  checkbox: EVENTS.change,
  radio: EVENTS.change,
  select: EVENTS.input,
  'select-one': EVENTS.change,
  'select-multiple': EVENTS.change,
  input: EVENTS.input,
  file: EVENTS.change,
  textarea: EVENTS.input,
  hidden: EVENTS.input
};
