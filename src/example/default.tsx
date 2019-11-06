import React, { FC, Fragment, memo } from 'react';
import useForm from '..';
import { IRegister } from '../';
import { string, object, boolean, InferType } from 'yup';
import { IUseField, UseField, KeyOf } from 'src/types';

// Example using Yup Schema //

const schema = object({
  firstName: string().default('Bill'),
  lastName: string().default('Lumbergh').required(),
  email: string().email().default('come-in-on-sunday@initech.com'),
  numbers: object({
    home: string(),
    mobile: string()
  }).default({ home: '5551212', mobile: '6661456' }),
  urgent: boolean(),
  message: string().default('').required()
});

type Schema = InferType<typeof schema>;

const Default: FC = () => {

  const { register, handleSubmit, handleReset, state, useField } = useForm({
    validationSchema: schema,
    enableNativeValidation: true,
    enableWarnings: true
  });

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  // Manual error component.
  const MyError = ({ name }) => {
    if (!state.errors || typeof state.errors[name] === 'undefined' || !state.errors[name].length)
      return null;
    const err = state.errors[name][0];
    return (<div style={{ color: 'red' }}>{err.message}</div>);
  };

  // Error component using hook.
  const MyHookError = ({ message }: { message: string }) => {
    if (!message) return null;
    return (
      <span style={{ color: 'red' }}>{message}</span>
    );
  };

  // Advanced custom input that binds to Komo.
  type InputProps =
    { name?: KeyOf<Schema>, reg?: IRegister<Schema>, field?: UseField<Schema> } & Partial<HTMLInputElement>;
  const MyInput = ({ reg, field }: InputProps) => {
    //  const hook = field(name);
    const name = 'lastName'
    const capitalize = v => v.charAt(0).toUpperCase() + v.slice(1);
    return (
      <div>
        <label htmlFor={name}>{capitalize(name)}: </label>
        <input name={name} type="text" ref={register} />
        {/* <MyHookError message={hook.message} /> */}
      </div>
    );
  };

  return (
    <div>

      <h2>Default Example - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <MyInput /> <br /><br />

        {/* <label htmlFor="lastName">Last Name: </label>
        <input type="text" name="lastName" ref={register} /><br /><br /> */}

        <label htmlFor="phone">Phone: </label>
        <input name="phone" type="text" ref={register({ path: 'numbers.home' })} /><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ defaultValue: true })} /><br /><br />

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

        <label htmlFor="filename">Last Name: </label>
        <input type="file" name="filename" ref={register} /><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" ref={register({ required: true, minLength: 5 })} >
        </textarea><MyError name="message" /><br /><br />

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default Default;
