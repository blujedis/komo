import * as yup from 'yup';

declare global {
  const __BLU_DEV_VARS__: {
    debug: string[],
  };
}

declare module 'yup' {

  interface Schema<T> {
    cast(value?: any, options?: any): T;
  }

}
