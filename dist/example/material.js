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
    numbers: yup_1.object().shape({
        home: yup_1.string(),
        mobile: yup_1.string()
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
const Material = () => {
    const { register, handleSubmit, handleReset, state, useField } = __1.default({
        defaults: Promise.resolve(defaults),
        validationSchema: schema,
        validateSubmitExit: true
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
    // const MyError = ({ hook }: { hook: ReturnType<typeof useField>; }) => {
    //   if (hook.valid)
    //     return null;
    //   return (
    //     <span style={{ color: 'red' }}>{hook.message}</span>
    //   );
    // };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Material Design - Yup Validation"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement(TextField_1.default, { name: "firstName", error: firstName.invalid, inputRef: register, label: firstName.message, margin: "normal", defaultValue: "Bill" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(TextField_1.default, { name: "lastName", error: lastName.invalid, inputRef: register, label: lastName.message, margin: "normal" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(Input_1.default, { name: "email", inputRef: register, placeholder: "Email" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(Input_1.default, { name: "phone", inputRef: register({ path: 'numbers.home' }), placeholder: "Phone" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = Material;
//# sourceMappingURL=material.js.map