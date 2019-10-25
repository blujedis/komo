import React, { FC } from 'react';
import useForm from '../';

const App: FC = () => {

  const { register, handleSubmit, handleReset } = useForm({
    model: {
      firstName: 'bob',
      lastName: 'johnson'
    },
    onSubmit: (model) => {
      // tslint:disable-next-line
      console.log('\nModel Result:');
      // tslint:disable-next-line
      console.log(JSON.stringify(model, null, 2));
    }
  });

  return (
    <div style={{ padding: '24px' }} >

      <h2>Example Form</h2>
      <hr /><br />

      <form onSubmit={handleSubmit} onReset={handleReset}>

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
        <select name="category" multiple ref={register} defaultValue={['audi', 'volvo']}>
          <option value="volvo">Volvo</option>
          <option value="saab">Saab</option>
          <option value="opel">Opel</option>
          <option value="audi">Audi</option>
        </select><br /><br />

        <label htmlFor="filename">Last Name: </label>
        <input type="file" name="filename" ref={register} /><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" defaultValue=" Just some text." ref={register}>
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
