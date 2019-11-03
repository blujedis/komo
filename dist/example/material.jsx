"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require("../"));
const yup_1 = require("yup");
const Input_1 = __importDefault(require("@material-ui/core/Input"));
// Example using Yup Schema //
const schema = yup_1.object({
    firstName: yup_1.string().default('Bill'),
    lastName: yup_1.string().default('Lumbergh'),
    email: yup_1.string().email().default('come-in-on-sunday@initech.com'),
    numbers: yup_1.object({
        home: yup_1.string(),
        mobile: yup_1.string()
    }).default({ home: '9991212', mobile: '9991456' }),
    urgent: yup_1.boolean()
});
const Material = () => {
    const { register, handleSubmit, handleReset, state } = __1.default({
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
    return (<div>

      <h2>Material Design - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <Input_1.default name="firstName" inputRef={register} placeholder="First Name"/><br /><br />
        <Input_1.default name="lastName" inputRef={register} placeholder="Last Name"/><br /><br />
        <Input_1.default name="email" inputRef={register} placeholder="Email"/><br /><br />
        <Input_1.default name="phone" inputRef={register({ path: 'numbers.home' })} placeholder="Phone"/><br /><br />

        <hr />
        <br />

        <input type="reset" value="Reset"/>&nbsp;
        <input type="submit" value="Submit"/>

      </form>

    </div>);
};
exports.default = Material;
//# sourceMappingURL=material.jsx.map