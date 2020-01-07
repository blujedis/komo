
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

## Running Examples

I would encourage you to look at the examples in <code>src/example</code>. You can also clone the repository source then run these examples. Form validation no matter your effort can get complicated. Komo works hard to simplify that but in the end some things just require more control. The examples will help you work through those use cases!

```sh
$ git clone https://github.com/blujedis/komo.git
$ yarn install
$ yarn start
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

### Complete Example Form

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

#### Reinit After Effect 

There are cases where you may need to initialize your data after you mount using **useEffect**. Komo exposes a method for this called <code>reinit</code>. This method is used by Komo internally itself.

```tsx
const { reinit } = useForm({
  // options here.
});

useEffect(() => {

  // some promise or state change data is now available.

  reinit(defaults_from_state);

}, [defaults_from_state]);

```

## Hooks

Komo has some built in hooks that make it trivial to wire up to fields or expose your own hooks using the built in <code>withKomo</code> helper.

Your best bet is to clone the repo then run <code>yarn start</code>. Then navigate to the **/advanced** page. This will give you an idea of some of the cool stuff Komo can do.

### useField Hook

Expose the hook from Komo's main useForm hook, then call the hook and pass in the form element name you wish to use. Simple as that. Just remember your hook will not have access to the element until Komo has mounted.

```jsx
const { useField } = useForm({
  // options here excluded for brevity.
});

const firstName = useField('firstName');
```

### Companion Hook Components

Below we have an Error Component and a TextInput Component that use the errors exposed from our hook.

```jsx
/**
 * Simple component to display our errors.
 * @param props our error component's props.
 */
const ErrorMessage = ({ errors }) => {
  if (!errors || !errors.length)
    return null;
  const err = errors[0];
  return (<div style={{ color: 'red', margin: '6px 0 10px' }}>{err.message}</div>);
};

/**
 * Custom input message text field.
 */
const TextInput = (props: InputProps) => {
  const { hook, ...clone } = props;
  const { name } = clone;
  const field = props.hook(name);
  const capitalize = v => v.charAt(0).toUpperCase() + v.slice(1);
  return (
    <div>
      <label htmlFor={name}>{capitalize(name)}: </label>
      <input type="text" ref={field.register} {...clone} />
      <ErrorMessage errors={field.errors} />
    </div>
  );
};
```

### Form with Hooks

```jsx
const App = () => {

// Create some hooks to our fields
const firstName = useField('firstName');
const lastName = useField('lastName');

// When the first name field blurs set the 
// focus to the last name field.
const onFirstBlur = (e) => lastName.focus();

// When last name changes manually validate
// and display response or error.
 const onLastChange = (e) => {
    lastName.validate()
      .then(res => console.log.bind(console))
      .catch(err => console.log.bind(console));
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

      <label htmlFor="firstName">First Name: </label>
      <input name="firstName" type="text" ref={register} onChange={onFirstBlur} /><br /><br />

      <TextInput name="lastName" hook={useField} onChange={onLastChange} /><br />

      <button type="button" onClick={lastName.focus}>Set LastName Focus</button><br /><br />

      <button type="button" onClick={updateLast('Waddams')}>Set LastName to Waddams</button><br /><br />

      <button type="button" onClick={updateLast('')}>Set LastName to Undefined</button><br /><br />

      <JsonErrors errors={state.errors} />

      <br />
      <hr />
      <br />

      <input type="reset" value="Reset" />&nbsp;
      <input type="submit" value="Submit" />

    </form>
  );

}
```

### Virtual Elements

Some times you have a complex component that requires you to create a virtual registration where you might have other bound elements you wish to get values from and/or validate. That's where virtual elements come in.

Komo's hooks make this a snap! Let's walk through it.

#### Consider a Nested Model

Let's say you want to create a virtual element called **fullName** which is simply a concatenation
of both <code>name.first</code> and <code>name.last</code>. We only want to trigger validation for fullName.

```js
const model = {
  name: {
    first: 'Milton',
    last: 'Waddams'
  }
}
```

#### Virtual Component

We create a virtual element below by passing in the second arg in our useField hook 
<code>const fullName = hook(name, true);</code>. This tells Komo not wire up data binding
events as we typically would for an element.

```tsx
const VirtualField: FC<Props> = ({ name, hook }) => {

  // Below we create hooks for our Virtual (fullName)

  const fullName = hook(name, true);

  // The below to element hooks are created dynamically.
  // meaning we didn't pass them into our model.

  const first = hook('first');
  const last = hook('last');

  // We register our virtual element.
  // Note we derive our default value from
  // the vaules of the two bound elements.

  fullName.register({

    defaultValue: (model) => {
      if (model.name && model.name.first && model.name.last)
        return model.name.first + ' ' + model.name.last;
      return '';
    },

    required: true

  });

  // On blur listener to update our virtual element.

  const onBlur = (e) => {
    // We trim here so we don't end up with ' ' as space.
    fullName.update((first.value + ' ' + last.value).trim());
  };

  // Finally we return our simple component
  // registering our bound elements as usual.

  return (
    <>
      <p>
        <span>Virtual Value: </span><span style={{ fontWeight: 'bolder' }}>{fullName.value}</span>
      </p>

      <label htmlFor="first">First Name: </label>
      <input
        name="first"
        type="text"
        onBlur={onBlur}
        ref={first.register({ path: 'name.first', validateBlur: false })} />

      <br /><br />

      <label htmlFor="last">Last Name: </label>
      <input
        name="last"
        type="text"
        onBlur={onBlur}
        ref={last.register({ path: 'name.last', validateBlur: false })} />

      <br /><br />

    </>

  );

};
```

## Casting Model

By default Komo will attemp to cast your data before persisting to model. For example a string of "true" will become an actual boolean <code>true</code>.

This feature can be disabled by setting <code>options.castHandler</code> to false or null.

You can also pass your own function that casts the value and simply returns it. 

Although your model will likely be converted to a string using <code>JSON.stringify</code> before posting 
to your server, casting the model value only allows you to do checks against the model state as you'd expect.

Again if this is not what you want simply disable it.

```ts
const { register } = useForm({
  castHandler: (value, path, name) => {
    // do something with value and return.
    return value;
  }
})
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
