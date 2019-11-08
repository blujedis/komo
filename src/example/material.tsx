import React, { FC } from 'react';
import useForm from '../';
import useCustomHook from './hook';
import { string, object, boolean } from 'yup';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';

// Example using Yup Schema //

const schema = object({
  firstName: string().required(),
  lastName: string().required(),
  email: string().email(),
  numbers: object({
    home: string(),
    mobile: string()
  }),
});

const defaults = {
  firstName: 'Bill',
  lastName: 'Lumbergh',
  email: 'come-in-on-sunday@initech.com',
  numbers: {
    home: '9991212',
    mobile: '9991456'
  }
};

const Material: FC = () => {

  const { register, handleSubmit, handleReset, state, useField } = useForm({
    defaults: Promise.resolve(defaults),
    validationSchema: schema,
    validateSubmitExit: true,
    logLevel: 'debug'
  });

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  // Create a custom hook.
  const initError = useCustomHook(state);
  const firstName = initError('firstName');

  // Use built in Komo field hook
  const lastName = useField('lastName');

  const MyError = ({ hook }: { hook: ReturnType<typeof useField> }) => {
    if (hook.valid)
      return null;
    return (
      <span style={{ color: 'red' }}>{hook.message}</span>
    );
  };

  return (
    <div>

      <h2>Material Design - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <TextField name="firstName"
          error={firstName.invalid}
          inputRef={register} label={firstName.message} margin="normal" defaultValue="Bill" /><br /><br />
        <TextField name="lastName"
          error={lastName.invalid}
          inputRef={register} label={lastName.message} margin="normal" /><br /><br />
        <MyError hook={lastName} /><br /><br />

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
