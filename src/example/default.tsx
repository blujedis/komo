import React, { FC } from 'react';
import useForm from '..';
import JsonErrors from './jsonerrors';
import { string, object, boolean, InferType } from 'yup';

/**
 * Schema - our data model or schema using Yup.
 */
const schema = object({
  firstName: string().default('Bill'),
  lastName: string().required().default('Lumbergh'),
  email: string().email().default('come-in-on-sunday@initech.com'),
  numbers: object().shape({
    home: string().required(),
    mobile: string()
  }).default({ home: '5551212', mobile: '6661456' }),
  urgent: boolean(),
  message: string().required()
});

/**
 * Inferred type using helper from Yup.
 */
type Schema = Partial<InferType<typeof schema>>;

/**
 * Our Default form component.
 */
const Default: FC = () => {

  const { register, handleSubmit, handleReset, state } = useForm<Schema>({
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

      <h2>Default Example - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input name="lastName" type="text" ref={register} /><br /><br />

        <label htmlFor="phone">Phone: </label>
        <input name="phone" type="text" ref={register({ path: 'numbers.home', required: true })} /><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ defaultValue: false })} /><br /><br />

        <label htmlFor="method">Contact Method: </label> &nbsp;
        Phone <input name="method" type="radio" value="Phone" ref={register({ defaultChecked: true })} /> &nbsp;
        Email <input name="method" type="radio" value="Email" ref={register} /><br /><br />

        <label htmlFor="reason">Reason: </label>
        <select name="reason" ref={register} required defaultValue="Sales">
          <option value="">Please Select</option>
          <option>Support</option>
          <option>Sales</option>
          <option>Accounts</option>
        </select><br /><br />

        <label htmlFor="category">Category: </label>
        <select name="category" multiple ref={register({ defaultValue: ['audi', 'volvo'] })}>
          <option value="volvo">Volvo</option>
          <option value="saab">Saab</option>
          <option value="opel">Opel</option>
          <option value="audi">Audi</option>
        </select><br /><br />

        <label htmlFor="filename">Filename: </label>
        <input type="file" name="filename" ref={register} /><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" ref={register({ required: true, minLength: 5 })} >
        </textarea>

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

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

export default Default;
