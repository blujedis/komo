import * as yup from 'yup';

declare module 'yup' {

  interface Schema<T> {
    cast(value?: any, options?: any): T;
  }

}
