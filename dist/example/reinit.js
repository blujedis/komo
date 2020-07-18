"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const __1 = __importDefault(require(".."));
const jsonerrors_1 = __importDefault(require("./jsonerrors"));
const yup_1 = require("yup");
/**
 * Schema - our data model or schema using Yup.
 */
const schema = yup_1.object({
    firstName: yup_1.string().required(),
    lastName: yup_1.string().required()
});
/**
 * Our Default form component.
 */
const Reinit = () => {
    const { register, handleSubmit, handleReset, state, update } = __1.default({
        validationSchema: schema,
        validateNative: true
    });
    react_1.useEffect(() => {
        update({
            firstName: 'Milton',
            lastName: undefined
        }, true);
    }, []);
    const onSubmit = (model) => {
        console.log(model);
        console.log(state.errors);
        console.log('count', state.submitCount);
        console.log('submitting', state.isSubmitting);
        console.log('submitted', state.isSubmitted);
    };
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Reinit Example - Yup Validation"),
        react_1.default.createElement("hr", null),
        react_1.default.createElement("p", null, "Note we update here and with validate so we immediately get our console.error as \"lastName\" is required."),
        react_1.default.createElement("form", { noValidate: true, onSubmit: handleSubmit(onSubmit), onReset: handleReset },
            react_1.default.createElement("label", { htmlFor: "firstName" }, "First Name: "),
            react_1.default.createElement("input", { name: "firstName", type: "text", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("label", { htmlFor: "lastName" }, "Last Name: "),
            react_1.default.createElement("input", { name: "lastName", type: "text", ref: register }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement(jsonerrors_1.default, { errors: state.errors }),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("hr", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("input", { type: "reset", value: "Reset" }),
            "\u00A0",
            react_1.default.createElement("input", { type: "submit", value: "Submit" }))));
};
exports.default = Reinit;
//# sourceMappingURL=reinit.js.map