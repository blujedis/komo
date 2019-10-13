import { flagActions, flagEnums } from './flags';

const Action = {
  ...flagActions
};

const Type = {
  ...flagEnums
};

export type ActionType = keyof typeof Type;

export {
  Action,
  Type
};
