"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require(".."));
const jsonerrors_1 = __importDefault(require("./jsonerrors"));
const yup_1 = require("yup");
/**
 * Schema - our data model or schema using Yup.
 */
const schema = yup_1.object({
    name: yup_1.object({
        first: yup_1.string().default('Bill').required(),
        last: yup_1.string().default('Lumbergh').required(),
    })
});
const VirtualField = ({ name, hook }) => {
    const fullName = hook(name, true);
    const first = hook('first');
    const last = hook('last');
    fullName.register({
        defaultValue: (model) => {
            if (model.name && model.name.first && model.name.last)
                return model.name.first + ' ' + model.name.last;
            return '';
        },
        required: true
    });
    const onBlur = (e) => {
        // We trim here so we don't end up with ' ' as space.
        fullName.update((first.value + ' ' + last.value).trim());
    };
    return (<>
      <p>
        <span>Virtual Value: </span><span style={{ fontWeight: 'bolder' }}>{fullName.value}</span>
      </p>

      <label htmlFor="first">First Name: </label>
      <input name="first" type="text" onBlur={onBlur} ref={first.register({ path: 'name.first', validateBlur: false })}/>

      <br /><br />

      <label htmlFor="last">Last Name: </label>
      <input name="last" type="text" onBlur={onBlur} ref={last.register({ path: 'name.last', validateBlur: false })}/>

      <br /><br />

    </>);
};
/**
 * Virtual/alias element example.
 */
const Virtual = () => {
    const { handleSubmit, handleReset, state, useField } = __1.default({
        validationSchema: schema,
        validateNative: true
    });
    const onSubmit = (model) => {
        console.log('model:', model);
        console.log('errors:', state.errors);
        console.log('count', state.submitCount);
        console.log('submitting', state.isSubmitting);
        console.log('submitted', state.isSubmitted);
    };
    return (<div>

      <h2>Virtual Example</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <p>
          At first blush this may seem redundant but there are use cases where you
          need to interact with the model but have complex nested components.
        </p>

        <VirtualField name="fullName" hook={useField}/>

        <jsonerrors_1.default errors={state.errors}/>

        <br />
        <br />
        <hr />
        <br />

        <input type="reset" value="Reset"/>&nbsp;
        <input type="submit" value="Submit"/>

      </form>

    </div>);
};
exports.default = Virtual;
//# sourceMappingURL=virtual.jsx.map