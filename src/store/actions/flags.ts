
const _flagActions = {
  FORM_SUBMIT: { type: 'FORM_SUBMIT' },
  FORM_FAIL: { type: 'FORM_FAIL' },
  FORM_SUCCESS: { type: 'FORM_SUCCESS' },
  FORM_RESET: { type: 'FORM_RESET' },
};

const _flagTypes = Object.keys(_flagActions).reduce((a, c) => a[c] = c && a, {} as any);

export type FlagAction = typeof _flagActions;

export type FlagType = { [K in keyof FlagAction ]: K; };

export const flagActions: FlagAction = _flagActions;

export const flagEnums: FlagType = _flagTypes;
