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
const virtual_1 = __importDefault(require("./virtual"));
const NotFound = (props) => {
    return (react_1.default.createElement("div", null, "404 - Not Found"));
};
const App = () => {
    return (react_1.default.createElement(wouter_1.Router, null,
        react_1.default.createElement("div", { style: { padding: '24px' } },
            react_1.default.createElement("div", null,
                react_1.default.createElement(menu_1.default, null)),
            react_1.default.createElement(wouter_1.Switch, null,
                react_1.default.createElement(wouter_1.Route, { path: "/", component: default_1.default }),
                react_1.default.createElement(wouter_1.Route, { path: "/user", component: user_1.default }),
                react_1.default.createElement(wouter_1.Route, { path: "/material", component: material_1.default }),
                react_1.default.createElement(wouter_1.Route, { path: "/advanced", component: advanced_1.default }),
                react_1.default.createElement(wouter_1.Route, { path: "/virtual", component: virtual_1.default }),
                react_1.default.createElement(wouter_1.Route, { path: "/:404*", component: NotFound })))));
};
exports.default = App;
//# sourceMappingURL=app.js.map