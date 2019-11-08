import React, { FC } from 'react';
import useForm from '..';

// Example using Custom Function //

const schema = (model) => {

  const errors = {};

  const add = (key: string, msg: string | string[]) => {
    errors[key] = errors[key] || [];
    msg = !Array.isArray(msg) ? [msg] : msg;
    errors[key] = [...errors[key], ...msg];
  };

  if (typeof model.message === 'undefined') {
    add('message', 'Message is required.');
  }

  if (model.message && model.message.length < 5) {
    add('message', 'Message must be at least 5 characters in length.');
  }

  return errors;

};

const User: FC = () => {

  const { register, handleSubmit, handleReset, state } = useForm({
    defaults: {
      numbers: {
        home: '7771212',
        mobile: '8881456'
      }
    },
    validationSchema: schema,
    enableNativeValidation: true,
    logLevel: 'debug'
  });

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  const ErrComp = ({ name }) => {
    if (!state.errors || typeof state.errors[name] === 'undefined' || !state.errors[name].length)
      return null;
    const err = state.errors[name][0];
    return (<div style={{ color: 'red' }}>{err.message}</div>);
  };

  return (
    <div >

      <h2>User Example - Custom Validation Function</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} defaultValue="Peter" /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input type="text" name="lastName" ref={register} defaultValue="Gibbons" /><br /><br />

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
        </textarea><ErrComp name="message" /><br /><br />

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default User;
