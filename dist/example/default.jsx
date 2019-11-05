"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require(".."));
const yup_1 = require("yup");
// Example using Yup Schema //
const schema = yup_1.object({
    firstName: yup_1.string().default('Bill'),
    lastName: yup_1.string().default('Lumbergh'),
    email: yup_1.string().email().default('come-in-on-sunday@initech.com'),
    numbers: yup_1.object({
        home: yup_1.string(),
        mobile: yup_1.string()
    }).default({ home: '5551212', mobile: '6661456' }),
    urgent: yup_1.boolean(),
    message: yup_1.string().default('').required()
});
const Default = () => {
    const { register, handleSubmit, handleReset, state } = __1.default({
        validationSchema: schema,
        enableNativeValidation: true,
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
    return (<div>

      <h2>Default Example - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register}/><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input type="text" name="lastName" ref={register}/><br /><br />

        <label htmlFor="phone">Phone: </label>
        <input name="phone" type="text" ref={register({ path: 'numbers.home' })}/><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ defaultValue: true })}/><br /><br />

        <label htmlFor="method">Contact Method: </label> &nbsp;
        Phone <input name="method" type="radio" value="Phone" ref={register({ defaultChecked: true })}/> &nbsp;
        Email <input name="method" type="radio" value="Email" ref={register}/><br /><br />

        <label htmlFor="reason">Reason: </label>
        <select name="reason" ref={register} required defaultValue="Sales">
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
        <input type="file" name="filename" ref={register}/><br /><br />

        <label htmlFor="message">Message: </label>
        <textarea name="message" ref={register({ required: true, minLength: 5 })}>
        </textarea><ErrComp name="message"/><br /><br />

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

        <hr />
        <br />

        <input type="reset" value="Reset"/>&nbsp;
        <input type="submit" value="Submit"/>

      </form>

    </div>);
};
exports.default = Default;
//# sourceMappingURL=default.jsx.map