"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const wouter_1 = require("wouter");
const use_location_1 = __importDefault(require("wouter/use-location"));
const Menu = () => {
    const r = use_location_1.default();
    // console.log(r);
    return (<div>
      <wouter_1.Link href="/">Default</wouter_1.Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <wouter_1.Link href="/user">User Validation</wouter_1.Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <wouter_1.Link href="/material">Material Design</wouter_1.Link>
    </div>);
};
exports.default = Menu;
//# sourceMappingURL=menu.jsx.map