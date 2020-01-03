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
    firstName: yup_1.string().default('Bill'),
    lastName: yup_1.string().required().default('Lumbergh'),
    email: yup_1.string().email().default('come-in-on-sunday@initech.com'),
    numbers: yup_1.object().shape({
        home: yup_1.string().required(),
        mobile: yup_1.string()
    }).default({ home: '5551212', mobile: '6661456' }),
    urgent: yup_1.boolean(),
    message: yup_1.string().required()
});
/**
 * Our Default form component.
 */
const Default = () => {
    const { register, handleSubmit, handleReset, state } = __1.default({
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
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Default Example - Yup Validation"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement("label", { htmlFor: "firstName" }, "First Name: "),
            react_1.default.createElement("input", { name: "firstName", type: "text", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "lastName" }, "Last Name: "),
            react_1.default.createElement("input", { name: "lastName", type: "text", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "phone" }, "Phone: "),
            react_1.default.createElement("input", { name: "phone", type: "text", ref: register({ path: 'numbers.home', required: true }) }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "urgent" }, "Urgent: "),
            react_1.default.createElement("input", { name: "urgent", type: "checkbox", ref: register({ defaultValue: false }) }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "method" }, "Contact Method: "),
            " \u00A0 Phone ",
            react_1.default.createElement("input", { name: "method", type: "radio", value: "Phone", ref: register({ defaultChecked: true }) }),
            " \u00A0 Email ",
            react_1.default.createElement("input", { name: "method", type: "radio", value: "Email", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "reason" }, "Reason: "),
            react_1.default.createElement("select", { name: "reason", ref: register, required: true, defaultValue: "Sales" },
                react_1.default.createElement("option", { value: "" }, "Please Select"),
                react_1.default.createElement("option", null, "Support"),
                react_1.default.createElement("option", null, "Sales"),
                react_1.default.createElement("option", null, "Accounts")),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "category" }, "Category: "),
            react_1.default.createElement("select", { name: "category", multiple: true, ref: register({ defaultValue: ['audi', 'volvo'] }) },
                react_1.default.createElement("option", { value: "volvo" }, "Volvo"),
                react_1.default.createElement("option", { value: "saab" }, "Saab"),
                react_1.default.createElement("option", { value: "opel" }, "Opel"),
                react_1.default.createElement("option", { value: "audi" }, "Audi")),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "filename" }, "Filename: "),
            react_1.default.createElement("input", { type: "file", name: "filename", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "message" }, "Message: "),
            react_1.default.createElement("textarea", { name: "message", ref: register({ required: true, minLength: 5 }) }),
            react_1.default.createElement("input", { name: "csrf", type: "hidden", defaultValue: "UYNL7_MMNG8_WRRV2_LIOP4", ref: register }),
            react_1.default.createElement(jsonerrors_1.default, { errors: state.errors }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = Default;
//# sourceMappingURL=default.js.map