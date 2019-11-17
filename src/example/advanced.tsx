import React, { FC, InputHTMLAttributes } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, InferType } from 'yup';
import { KeyOf, IUseFieldHook } from 'src/types';

// tslint:disable no-console 

/**
 * Schema - our data model or schema using Yup.
 */
const schema = object({
  firstName: string().default('Bill'),
  lastName: string().default('Lumbergh').required(),
  phone: object().shape({
    home: string().required(),
    mobile: string()
  })
});

/**
 * Inferred type using helper from Yup.
 */
type Schema = Partial<InferType<typeof schema>>;

// Advanced custom input that binds to Komo.
type InputProps = {
  name: KeyOf<Schema>; path?: string, hook: IUseFieldHook<Schema>;
} & InputHTMLAttributes<HTMLInputElement>;

/**
 * Simple component to display our errors.
 * @param props our error component's props.
 */
const ErrorMessage = ({ errors }) => {
  if (!errors || !errors.length)
    return null;
  const err = errors[0];
  return (<div style={{ color: 'red', margin: '6px 0 10px' }}>{err.message}</div>);
};

/**
 * Custom input message text field.
 */
const TextInput = (props: InputProps) => {
  const { hook, path, ...clone } = props;
  const { name } = clone;
  const field = props.hook(name);
  const capitalize = v => v.charAt(0).toUpperCase() + v.slice(1);
  return (
    <div>
      <label htmlFor={name}>{capitalize(name)}: </label>
      <input type="text" ref={field.register({ path: props.path })} {...clone} />
      <ErrorMessage errors={field.errors} />
    </div>
  );
};

const Advanced: FC = () => {

  const { register, handleSubmit, handleReset, state, useField } = useForm<Schema>({
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

  const lastName = useField('lastName');

  const onLastChange = (e) => {
    console.log('[LastName Change]');
    lastName.validate()
      .then(res => {
        console.group('Success:');
        console.log(res);
        console.groupEnd();
      })
      .catch(err => {
        console.group('Failed:');
        console.log(err);
        console.groupEnd();
      });
  };

  const updateLast = (value) => {
    return (e) => lastName.update(value);
  };

  return (
    <div>

      <h2>Advanced Example - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <TextInput name="lastName" hook={useField} onChange={onLastChange} /><br />

        <TextInput name="phone" path="phone.home" hook={useField} /><br />

        <button type="button" onClick={lastName.focus}>Set LastName Focus</button><br /><br />

        <button type="button" onClick={updateLast('Waddams')}>Set LastName to Waddams</button><br /><br />

        <button type="button" onClick={updateLast('')}>Set LastName to Undefined</button><br /><br />

        <JsonErrors errors={state.errors} />

        <br />
        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default Advanced;
