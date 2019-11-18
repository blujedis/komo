"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require(".."));
const jsonerrors_1 = __importDefault(require("./jsonerrors"));
const yup_1 = require("yup");
// tslint:disable no-console 
/**
 * Schema - our data model or schema using Yup.
 */
const schema = yup_1.object({
    firstName: yup_1.string().default('Bill'),
    lastName: yup_1.string().default('Lumbergh').required(),
    phone: yup_1.object().shape({
        home: yup_1.string().required(),
        mobile: yup_1.string()
    })
});
/**
 * Simple component to display our errors.
 * @param props our error component's props.
 */
const ErrorMessage = ({ errors }) => {
    if (!errors || !errors.length)
        return null;
    const err = errors[0];
    return (react_1.default.createElement("div", { style: { color: 'red', margin: '6px 0 10px' } }, err.message));
};
/**
 * Custom input message text field.
 */
const TextInput = (props) => {
    const { hook, path, ...clone } = props;
    const { name } = clone;
    const field = props.hook(name);
    const capitalize = v => v.charAt(0).toUpperCase() + v.slice(1);
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("label", { htmlFor: name },
            capitalize(name),
            ": "),
        react_1.default.createElement("input", Object.assign({ type: "text", ref: field.register({ path: props.path }) }, clone)),
        react_1.default.createElement(ErrorMessage, { errors: field.errors })));
};
const Advanced = () => {
    const { register, handleSubmit, handleReset, state, useField } = __1.default({
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
    const lastName = useField('lastName');
    const onLastChange = (e) => {
        console.log('[LastName Change]');
        lastName.validate()
            .then(res => {
            console.group('Success:');
            console.log(res);
            console.groupEnd();
        })
            .catch(err => {
            console.group('Failed:');
            console.log(err);
            console.groupEnd();
        });
    };
    const updateLast = (value) => {
        return (e) => lastName.update(value);
    };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Advanced Example - Yup Validation"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement("label", { htmlFor: "firstName" }, "First Name: "),
            react_1.default.createElement("input", { name: "firstName", type: "text", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(TextInput, { name: "lastName", hook: useField, onChange: onLastChange }),
            react_1.default.createElement("br", null),
            react_1.default.createElement(TextInput, { name: "phone", path: "phone.home", hook: useField }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("button", { type: "button", onClick: lastName.focus }, "Set LastName Focus"),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("button", { type: "button", onClick: updateLast('Waddams') }, "Set LastName to Waddams"),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("button", { type: "button", onClick: updateLast('') }, "Set LastName to Undefined"),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(jsonerrors_1.default, { errors: state.errors }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = Advanced;
//# sourceMappingURL=advanced.js.map