import React, { FC } from 'react';
import useForm from '../';
import { string, object, boolean } from 'yup';
import Input from '@material-ui/core/Input';

// Example using Yup Schema //

const schema = object({
  firstName: string().default('Bill'),
  lastName: string().default('Lumbergh'),
  email: string().email().default('come-in-on-sunday@initech.com'),
  numbers: object({
    home: string(),
    mobile: string()
  }).default({ home: '9991212', mobile: '9991456' }),
  urgent: boolean()
});

const Material: FC = () => {

  const { register, handleSubmit, handleReset, state } = useForm({
    validationSchema: schema,
    enableWarnings: true
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
    <div>

      <h2>Material Design - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <Input name="firstName" inputRef={register} placeholder="First Name" /><br /><br />
        <Input name="lastName" inputRef={register} placeholder="Last Name" /><br /><br />
        <Input name="email" inputRef={register} placeholder="Email" /><br /><br />
        <Input name="phone" inputRef={register({ path: 'numbers.home' })} placeholder="Phone" /><br /><br />

        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};

export default Material;
