import React, { FC, InputHTMLAttributes, useEffect, useRef } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, InferType } from 'yup';
import { KeyOf, UseField, IRegisteredElement } from '../types';

/**
 * Schema - our data model or schema using Yup.
 */
const schema = object({
  name: string().default('Bill Lumbergh').required(),
  phone: object({
    cc: string().default('1'),
    number: string().default('8135279989')
  })
});

/**
 * Inferred type using helper from Yup.
 */
type Schema = Partial<InferType<typeof schema>>;

type Props = {
  name: KeyOf<Schema>; path?: string, hook: UseField<Schema>;
} & InputHTMLAttributes<HTMLInputElement>;

const VirtualUnbound: FC<Props> = ({ name, path, hook }) => {

  const field = hook(name);

  field.register({
    name,
    path: 'name',
    virtual: 'name'
  });

  const onBlur = (e) => {
    const value = e.target.value;
    field.update(value);
  };

  return (
    <>
      <label htmlFor="fullName">Full Name: </label>
      <input name="fullName" type="text" onBlur={onBlur} defaultValue={field.value} /><br /><br />
    </>
  );

};

/**
 * Virtual/alias element example.
 */
const Virtual: FC = () => {

  const { handleSubmit, handleReset, state, useField } = useForm<Schema>({
    validationSchema: schema,
    validateNative: true
  });

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  return (
    <div>

      <h2>Virtual Example</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <VirtualUnbound name="fullName" hook={useField} />

        <JsonErrors errors={state.errors} />

        <br />
        <br />
        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default Virtual;
