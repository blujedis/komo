import React, { FC } from 'react';
import useForm from '../';

const App: FC = () => {

  const { Form, register } = useForm({
    model: {
      firstName: 'bob',
      lastName: 'johnson'
    }
  });

  return (
    <div style={{ padding: '24px' }} >

      <Form>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input name="lastName" ref={register} /><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ value: true })} defaultChecked={false} /><br /><br />

        <label htmlFor="method">Contact Method: </label> &nbsp;
        Phone <input name="method" type="radio" value="Phone" ref={register} defaultChecked={true} /> &nbsp;
        Email <input name="method" type="radio" value="Email" ref={register} /><br /><br />

        <label htmlFor="reason">Reason: </label>
        <select name="reason" ref={register} defaultValue="Sales">
          <option value="">Please Select</option>
          <option>Support</option>
          <option>Sales</option>
          <option>Accounts</option>
        </select><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" defaultValue=" Just some text." ref={register}>
        </textarea><br /><br />

        <input type="hidden" value="code"></input>

      </Form>

    </div>
  );

};

export default App;
