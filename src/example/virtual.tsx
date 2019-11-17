import React, { FC, InputHTMLAttributes } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, InferType } from 'yup';
import { IUseFieldHook } from '../types';

/**
 * Schema - our data model or schema using Yup.
 */
const schema = object({
  name: object({
    first: string().default('Bill').required(),
    last: string().default('Lumbergh').required(),
  })
});

/**
 * Inferred type using helper from Yup.
 * We have to manually include fullName
 * since it's not derived and an essentially
 * as if a component in its own file.
 */
type Schema = InferType<typeof schema>;

type Props = { hook: IUseFieldHook<Schema>; } & InputHTMLAttributes<HTMLInputElement>;

const VirtualField: FC<Props> = ({ name, hook }) => {

  const fullName = hook(name, true);
  const first = hook('first');
  const last = hook('last');

  fullName.register({
    defaultValue: (model) => {
      if (model.name && model.name.first && model.name.last)
        return model.name.first + ' ' + model.name.last;
      return '';
    },
    required: true
  });

  const onBlur = (e) => {
    // We trim here so we don't end up with ' ' as space.
    fullName.update((first.value + ' ' + last.value).trim());
  };

  return (
    <>
      <p>
        <span>Virtual Value: </span><span style={{ fontWeight: 'bolder' }}>{fullName.value}</span>
      </p>

      <label htmlFor="first">First Name: </label>
      <input
        name="first"
        type="text"
        onBlur={onBlur}
        ref={first.register({ path: 'name.first', validateBlur: false })} />

      <br /><br />

      <label htmlFor="last">Last Name: </label>
      <input
        name="last"
        type="text"
        onBlur={onBlur}
        ref={last.register({ path: 'name.last', validateBlur: false })} />

      <br /><br />

    </>

  );

};

/**
 * Virtual/alias element example.
 */
const Virtual: FC = () => {

  const { handleSubmit, handleReset, state, useField } = useForm({
    validationSchema: schema,
    validateNative: true
  });

  const onSubmit = (model) => {
    console.log('model:', model);
    console.log('errors:', state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  return (
    <div>

      <h2>Virtual Example</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <p>
          At first blush this may seem redundant but there are use cases where you
          need to interact with the model but have complex nested components.
        </p>

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
