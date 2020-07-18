"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const JsonErrors = ({ errors }) => {
    if (!Object.keys(errors).length)
        return null;
    return (react_1.default.createElement(react_1.Fragment, null,
        react_1.default.createElement("h3", null, "Current Errors"),
        react_1.default.createElement("pre", { style: { color: 'red' } }, JSON.stringify(errors, null, 2))));
};
exports.default = JsonErrors;
//# sourceMappingURL=jsonerrors.js.map