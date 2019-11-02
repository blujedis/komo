"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require("../"));
const renders_1 = require("../utils/renders");
const yup_1 = require("yup");
const schema = yup_1.object({
    firstName: yup_1.string(),
    lastName: yup_1.string(),
    urgent: yup_1.boolean(),
    numbers: yup_1.object({
        type: yup_1.string(),
        number: yup_1.string()
    })
});
const App = () => {
    const { register, handleSubmit, handleReset, errors } = __1.default({
        // model: {
        //   firstName: 'bob',
        //   lastName: 'johnson',
        //   urgent: false
        // },
        validationSchema: schema,
        enableWarnings: true
    });
    const onSubmit = (model, errors, event) => {
        console.log(model);
        // console.log(errors);
    };
    renders_1.useRenderCount();
    const ErrComp = ({ name }) => {
        if (!errors || typeof errors[name] === 'undefined')
            return null;
        const err = errors[name][0];
        return (<div style={{ color: 'red' }}>{err.message}</div>);
    };
    return (<div style={{ padding: '24px' }}>

      <h2>Example Form</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label htmlFor="firstName">First Name: </label>
        <input name="firstName" type="text" ref={register} defaultValue="Jim"/><br /><br />

        <label htmlFor="lastName">Last Name: </label>
        <input name="lastName" ref={register}/><br /><br />

        <label htmlFor="urgent">Urgent: </label>
        <input name="urgent" type="checkbox" ref={register({ defaultValue: true })}/><br /><br />

        <label htmlFor="method">Contact Method: </label> &nbsp;
        Phone <input name="method" type="radio" value="Phone" ref={register({ defaultChecked: true })}/> &nbsp;
        Email <input name="method" type="radio" value="Email" ref={register}/><br /><br />

        <label htmlFor="reason">Reason: </label>
        <select name="reason" ref={register} defaultValue="Sales">
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
        <textarea name="message" ref={register} required minLength={5}>
        </textarea><ErrComp name="message"/><br /><br />

        <input name="csrf" type="hidden" defaultValue="UYNL7_MMNG8_WRRV2_LIOP4" ref={register}></input>

        <hr />

        <input type="reset" value="Reset"/>&nbsp;
        <input type="submit" value="Submit"/>

      </form>

    </div>);
};
exports.default = App;
//# sourceMappingURL=app.jsx.map