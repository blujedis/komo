"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const wouter_1 = require("wouter");
const Menu = () => {
    return (react_1.default.createElement("div", null,
        react_1.default.createElement(wouter_1.Link, { href: "/" }, "Default"),
        "\u00A0\u00A0|\u00A0\u00A0",
        react_1.default.createElement(wouter_1.Link, { href: "/user" }, "User Validation"),
        "\u00A0\u00A0|\u00A0\u00A0",
        react_1.default.createElement(wouter_1.Link, { href: "/material" }, "Material Design"),
        "\u00A0\u00A0|\u00A0\u00A0",
        react_1.default.createElement(wouter_1.Link, { href: "/advanced" }, "Advanced"),
        "\u00A0\u00A0|\u00A0\u00A0",
        react_1.default.createElement(wouter_1.Link, { href: "/virtual" }, "Virtual"),
        "\u00A0\u00A0|\u00A0\u00A0",
        react_1.default.createElement(wouter_1.Link, { href: "/reinit" }, "Reinit")));
};
exports.default = Menu;
//# sourceMappingURL=menu.js.map