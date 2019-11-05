import React, { FC } from 'react';
import useForm from '../';
import { useMaterialError } from './useMaterialError';
import { string, object, boolean } from 'yup';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';

// Example using Yup Schema //

const schema = object({
  firstName: string().required(),
  lastName: string(),
  email: string().email(),
  numbers: object({
    home: string(),
    mobile: string()
  }),
  urgent: boolean()
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



  const { register, handleSubmit, handleReset, state } = useForm({
    defaults: Promise.resolve(defaults),
    validationSchema: schema,
    validateSubmitExit: true,
    enableWarnings: true
  });

  const onSubmit = (model) => {
    console.log(model);
    console.log(state.errors);
    console.log('count', state.submitCount);
    console.log('submitting', state.isSubmitting);
    console.log('submitted', state.isSubmitted);
  };

  const initError = useMaterialError(state);
  const firstName = initError('firstName');

  return (
    <div>

      <h2>Material Design - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        {/* <Input name="firstName"
          inputRef={register}
          placeholder="First Name"
          error={firstName.invalid} /><br /><br /> */}
        <TextField name="firstName"
          error={firstName.invalid}
          inputRef={register} label={firstName.message} margin="normal" /><br /><br />
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
