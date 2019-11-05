
 <p align="left">
  <a href="http://github.com/blujedis/komo"><img src="https://raw.githubusercontent.com/blujedis/komo/master/fixtures/logo.png" width="225" /></a>
</p>

React form helper

## Installation

Install the package.

```sh
$ npm install komo -s
```

OR

```sh
$ yarn add komo
```

## The Basics

Below we import react and komo then initialize the useForm hook.
We create our <code>form</code> element and the elements we need for our form inputs. We'll do a more complete example below but let's take it in steps so it's easier to make sense of.

```jsx
import React, { FC } from 'react';
import useForm from 'komo';

const MyForm: FC = () => {

  const { register } = useForm();

  return (
    <form noValidate>
        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} />
    </form>
  );

};
export default MyForm;
```

### Error Component

This is just a simple example of what you can do watching our error state to display feedback to the user. The sky is really the limit but this will give you the idea.

```jsx
  const Error = ({ name }) => {

    const prop = state.errors && state.errors[name];

    // No error at this key just return null.
    if (!prop || !prop.length)
      return null;

    const err = prop[0];

    // Simply return a div colored red with the error message.
    // See below for error object properties.
    return (<div style={{ color: 'red' }}>{err.message}</div>);

  };
```

### Form Submission 

We'll create a simple handler, it won't do much, that's up to you but let's how to wire up the handle submit function so that you can submit your form.

```jsx
const onSubmit = (model) => {
  if (state.isSubmitted) // no need to submit again.
    return; 
  console.log(model); // display our model data.
};
```

### Complete Form

Not let's put it all together so you can see it in one place. 

```jsx
import React, { FC } from 'react';
import useForm from 'komo';

const MyForm: FC = () => {

  // Import the Use Form Hook //

  const { register, handleSubmit, handleReset, state } = useForm({

    // Simple function to validate our schema.
    // If our function returns null/undefined or 
    // an empty object there is no error.
    // if an object with keys and error messages is 
    // returned your form state will be updated and 
    // you can use those errors to display messages etc.

    // NOTE you can also return a promise. In order for errors
    // to be triggered the must be returned as a rejection.

    // Could be as simple as Promise.reject(errors);

    validationSchema: (model) => {
      const errors = {};
      if (message.length < 10) 
        errors.message = ['Message must be at least 10 characters'];
      return errors;
    },

    // Enable native validation like required, min, max etc...
    // NOTE: Not all native validation types are supported
    // but the majority of what you need is there!
    enableNativeValidation: true

  });

  // This will handle when a user submits the form.
  const onSubmit = (model) => {
    if (state.isSubmitted) // no need to submit again.
      return; 
    console.log(model); // display our model data.
  };

  // This will dispaly an error if one is present for the provided key/name.
  const Error = ({ name }) => {
    const prop = state.errors && state.errors[name];
    if (!prop || !prop.length)// No error at this key just return null.
      return null;
    const err = prop[0];
    return (<div style={{ color: 'red' }}>{err.message}</div>); // return our err message.

  };

  return (
    <div>

      <h2>My Form</h2>
      <hr /><br />

       <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} defaultValue="Peter" /><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input type="text" name="lastName" ref={register} defaultValue="Gibbons" /><br /><br />

        <label htmlFor="email">Email: </label>
        <input name="email" type="email" ref={register} required /><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" ref={register} defaultValue="too short" >
        </textarea><Error name="message" /><br /><br />

        <hr />
        <br />

        <input type="reset" value="Reset" />&nbsp;
        <input type="submit" value="Submit" />

      </form>

    </div>
  );

};
export default MyForm;
```

### Defaults & Options

There are three ways to set defaults for an element. You can usse the traditional <code>defaultValue</code> prop or <code>defaultChecked</code> in the case of a checkbox. Additionally you can set defaults in your defaults object, lastly you can set defaults in your <code>yup schema</code>.

#### Using a Prop

```jsx
   <input name="firstName" type="text" ref={register} defaultValue="Your_Name_Here" />
```

#### Using Defaults Options

```jsx
  const { register } = useForm({
    defaults: {
      firstName: 'Your_Name_Here'
    }
  });
```

Komo also supports promises for your defaults. Below we're just using <code>Promise.resolve</code> but you could use fetch or axios etc to get your data. Note errors are logged to the console but does not stop Komo's initialization. If an error or no data returned Komo will just initialize with an empty defaults object.

```jsx
  const { register } = useForm({
    defaults: Promise.resolve({
      firstName: 'Your_Name_Here'
    })
  });
```

#### Using Yup Schema

When using a yup schema for your <code>validationSchema</code>, Komo will grab the defaults and use them for your form model.

```jsx
import * as yup from 'yup';

const schema = yup.object({
  firstName: string().default('Your_Name_Here')
});

const { register } = useForm({
  validationSchema: schema
});
```

#### Registering with Options

Komo allows you to register with options as well. For example perhaps you wish to disable ALL validation triggers on a given element. 

```jsx
<input name="firstName" type="text" ref={register({ validateChange: false, validateBlur: false})} />
```

#### Nested Data

Komo allows models with nested data. Any form field can have a mapped path enabling getting and setting from a nested prop.

The below will map errors in our error model <code>{ firstName: [ error objects here ] }</code> but it's model data will get/set from the nested path of <code>user.name.first</code>.

```jsx
<input name="firstName" type="text" ref={register({ path: 'user.name.first' })} />
```

## UI Libraries

You can of course use Komo with most UI libraries although they may differ in configuration. Komo aims to give you granular control. It's up to use to create your own Component wrappers and things to make life easier. This is by design. Otherwise too many opinions get in the way.

### Material UI

We'll show just the form and one input for brevity/clarity but using with Matieral is as simple as passing our register function to Material's <code>inputRef</code> prop.

[See More From Material-UI Docs](https://material-ui.com/api/text-field/)

```jsx
import Input from '@material-ui/core/Input';
<form>
    <Input name="phone" inputRef={register({ path: 'numbers.home' })} placeholder="Phone" />
</form>
```

## Docs

See [https://blujedis.github.io/komo/](https://blujedis.github.io/komo/)

## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE)
