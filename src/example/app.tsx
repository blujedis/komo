import React, { FC } from 'react';
import useForm from '../';
import { useRenderCount } from '../utils/renders';
import { string, object, boolean } from 'yup';

const schema = object({
  firstName: string(),
  lastName: string(),
  urgent: boolean(),
  numbers: object({
    type: string(),
    number: string()
  })
});

const App: FC = () => {

  const { register, handleSubmit, handleReset, errors } = useForm({
    // model: {
    //   firstName: 'bob',
    //   lastName: 'johnson',
    //   urgent: false
    // },
    validationSchema: schema,
    enableWarnings: true
  });

  const onSubmit = (model) => {
    // @ts-ignore
    console.log('message', model.message);
    // console.log(isTouched, isDirty);
    console.log(errors);

  };

  useRenderCount();

  return (
    <div style={{ padding: '24px' }} >

      <h2>Example Form</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input name="lastName" ref={register} /><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ defaultValue: true })} /><br /><br />

        <label htmlFor="method">Contact Method: </label> &nbsp;
        Phone <input name="method" type="radio" value="Phone" ref={register({ defaultChecked: true })} /> &nbsp;
        Email <input name="method" type="radio" value="Email" ref={register} /><br /><br />

        <label htmlFor="reason">Reason: </label>
        <select name="reason" ref={register} defaultValue="Sales">
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
        <textarea name="message" ref={register} required minLength={5}>
        </textarea><br /><br />

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

        <hr />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default App;
