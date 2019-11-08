"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const wouter_1 = require("wouter");
const default_1 = __importDefault(require("./default"));
const user_1 = __importDefault(require("./user"));
const material_1 = __importDefault(require("./material"));
const menu_1 = __importDefault(require("./menu"));
const advanced_1 = __importDefault(require("./advanced"));
const App = () => {
    return (<wouter_1.Router>
      <div style={{ padding: '24px' }}>
        <div>
          <menu_1.default />
        </div>
        <wouter_1.Route path="/" component={default_1.default}/>
        <wouter_1.Route path="/user" component={user_1.default}/>
        <wouter_1.Route path="/material" component={material_1.default}/>
        <wouter_1.Route path="/advanced" component={advanced_1.default}/>
      </div>
    </wouter_1.Router>);
};
exports.default = App;
//# sourceMappingURL=app.jsx.map