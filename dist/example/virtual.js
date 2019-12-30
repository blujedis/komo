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
        fullName.update((first.value + ' ' + last.value).trim(), null, false);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("p", null,
            react_1.default.createElement("span", null, "Virtual Value: "),
            react_1.default.createElement("span", { style: { fontWeight: 'bolder' } }, fullName.value)),
        react_1.default.createElement("label", { htmlFor: "first" }, "First Name: "),
        react_1.default.createElement("input", { name: "first", type: "text", onBlur: onBlur, ref: first.register({ path: 'name.first', validateBlur: false }) }),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("label", { htmlFor: "last" }, "Last Name: "),
        react_1.default.createElement("input", { name: "last", type: "text", onBlur: onBlur, ref: last.register({ path: 'name.last', validateBlur: false }) }),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null)));
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
        console.log('vanity', state.vanities);
        console.log('count', state.submitCount);
        console.log('submitting', state.isSubmitting);
        console.log('submitted', state.isSubmitted);
    };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Virtual Example"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement("p", null, "At first blush this may seem redundant but there are use cases where you need to interact with the model but have complex nested components."),
            react_1.default.createElement(VirtualField, { name: "fullName", hook: useField }),
            react_1.default.createElement(jsonerrors_1.default, { errors: state.errors }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = Virtual;
//# sourceMappingURL=virtual.js.map