"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const __1 = require("../");
const user = {
    firstName: 'Peter',
    lastName: 'Gibbons'
};
const App = () => {
    const form = __1.useForm({ model: user });
    const firstName = __1.useFormInput('firstName', user.firstName, {}, form);
    return (<div>
      <form ref={form.ref}>
        <label htmlFor="name"/>
        <input type="text" name="name" {...firstName.attributes}/>
      </form>
    </div>);
};
exports.default = App;
//# sourceMappingURL=app.jsx.map