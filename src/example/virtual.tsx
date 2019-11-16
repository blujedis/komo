import React, { FC, InputHTMLAttributes, useEffect, useRef } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, InferType } from 'yup';
import { KeyOf, UseField } from '../types';

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
 * We have to manually include fullName
 * since it's not derived and an essentially
 * as if a component in its own file.
 */
type Schema = InferType<typeof schema> & { fullName?: any };

type Props = {
  name: KeyOf<Schema>;
  path?: string,
  hook: UseField<Schema>;
} & InputHTMLAttributes<HTMLInputElement>;

const VirtualField: FC<Props> = ({ name, path, hook }) => {

  const field = hook(name);

  field.register({
    name,
    path: 'phone.cc',
    virtual: true
  });

  const onBlur = (e) => {
    const value = e.target.value;
    field.update(value);
  };

  return (
    <>
      <label htmlFor="countrycode">Full Name: </label>
      <input name="countrycode" type="text" onBlur={onBlur} defaultValue={field.value} /><br /><br />
    </>
  );

};

/**
 * Virtual/alias element example.
 */
const Virtual: FC = () => {

  const { handleSubmit, handleReset, state, useField } = useForm({
    validationSchema: schema,
    validateNative: true,
    defaults: {
      fullName: ''
    }
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

        <VirtualField name="fullName" hook={useField} />

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
