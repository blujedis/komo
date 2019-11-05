"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require("../"));
const hook_1 = __importDefault(require("./hook"));
const yup_1 = require("yup");
const Input_1 = __importDefault(require("@material-ui/core/Input"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
// Example using Yup Schema //
const schema = yup_1.object({
    firstName: yup_1.string().required(),
    lastName: yup_1.string().required(),
    email: yup_1.string().email(),
    numbers: yup_1.object({
        home: yup_1.string(),
        mobile: yup_1.string()
    }),
    urgent: yup_1.boolean()
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
const Material = () => {
    const { register, handleSubmit, handleReset, state, useField } = __1.default({
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
    // Create a custom hook.
    const initError = hook_1.default(state);
    const firstName = initError('firstName');
    // Use built in Komo field hook
    const lastName = useField('lastName');
    return (<div>

      <h2>Material Design - Yup Validation</h2>
      <hr /><br />

      <form noValidate onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <TextField_1.default name="firstName" error={firstName.invalid} inputRef={register} label={firstName.message} margin="normal" defaultValue="Bill"/><br /><br />
        <TextField_1.default name="lastName" error={lastName.invalid} inputRef={register} label={lastName.message} margin="normal"/><br /><br />
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