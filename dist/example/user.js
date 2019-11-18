"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = __importDefault(require(".."));
// Example using Custom Function //
const schema = (model) => {
    const errors = {};
    const add = (key, msg) => {
        errors[key] = errors[key] || [];
        msg = !Array.isArray(msg) ? [msg] : msg;
        errors[key] = [...errors[key], ...msg];
    };
    if (typeof model.message === 'undefined') {
        add('message', 'Message is required.');
    }
    if (model.message && model.message.length < 5) {
        add('message', 'Message must be at least 5 characters in length.');
    }
    return errors;
};
const User = () => {
    const { register, handleSubmit, handleReset, state } = __1.default({
        defaults: {
            numbers: {
                home: '7771212',
                mobile: '8881456'
            }
        },
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
    const ErrComp = ({ name }) => {
        if (!state.errors || typeof state.errors[name] === 'undefined' || !state.errors[name].length)
            return null;
        const err = state.errors[name][0];
        return (react_1.default.createElement("div", { style: { color: 'red' } }, err.message));
    };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "User Example - Custom Validation Function"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement("label", { htmlFor: "firstName" }, "First Name: "),
            react_1.default.createElement("input", { name: "firstName", type: "text", ref: register, defaultValue: "Peter" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "lastName" }, "Last Name: "),
            react_1.default.createElement("input", { type: "text", name: "lastName", ref: register, defaultValue: "Gibbons" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "phone" }, "Phone: "),
            react_1.default.createElement("input", { name: "phone", type: "text", ref: register({ path: 'numbers.home' }) }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "urgent" }, "Urgent: "),
            react_1.default.createElement("input", { name: "urgent", type: "checkbox", ref: register({ defaultValue: true }) }),
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
            react_1.default.createElement("label", { htmlFor: "filename" }, "Last Name: "),
            react_1.default.createElement("input", { type: "file", name: "filename", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "message" }, "Message: "),
            react_1.default.createElement("textarea", { name: "message", ref: register({ required: true, minLength: 5 }) }),
            react_1.default.createElement(ErrComp, { name: "message" }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { name: "csrf", type: "hidden", defaultValue: "UYNL7_MMNG8_WRRV2_LIOP4", ref: register }),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = User;
//# sourceMappingURL=user.js.map