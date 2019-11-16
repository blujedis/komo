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
    name: yup_1.string().default('Bill Lumbergh').required(),
    phone: yup_1.object({
        cc: yup_1.string().default('1'),
        number: yup_1.string().default('8135279989')
    })
});
const VirtualUnbound = ({ name, path, hook }) => {
    const field = hook(name);
    field.register({
        name,
        path: 'name',
        virtual: 'name'
    });
    const onBlur = (e) => {
        const value = e.target.value;
        field.update(value);
    };
    return (<>
      <label htmlFor="fullName">Full Name: </label>
      <input name="fullName" type="text" onBlur={onBlur} defaultValue={field.value}/><br /><br />
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
        console.log(model);
        console.log(state.errors);
        console.log('count', state.submitCount);
        console.log('submitting', state.isSubmitting);
        console.log('submitted', state.isSubmitted);
    };
    return (<div>

      <h2>Virtual Example</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <VirtualUnbound name="fullName" hook={useField}/>

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