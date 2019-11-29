import React, { FC, useEffect } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, InferType } from 'yup';

/**
 * Schema - our data model or schema using Yup.
 */
const schema = object({
  firstName: string().required(),
  lastName: string().required()
});

/**
 * Inferred type using helper from Yup.
 */
type Schema = Partial<InferType<typeof schema>>;

/**
 * Our Default form component.
 */
const Reinit: FC = () => {

  const { register, handleSubmit, handleReset, state, reinit } = useForm<Schema>({
    validationSchema: schema,
    validateNative: true
  });

  useEffect(() => {

    reinit({
      firstName: 'Milton',
      lastName: 'Waddams'
    });

  }, []);

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  return (
    <div>

      <h2>Reinit Example - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input name="lastName" type="text" ref={register} /><br /><br />

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

export default Reinit;
