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
    return (<react_1.Fragment>
      <h3>Current Errors</h3>
      <pre style={{ color: 'red' }}>{JSON.stringify(errors, null, 2)}</pre>
    </react_1.Fragment>);
};
exports.default = JsonErrors;
//# sourceMappingURL=jsonerrors.jsx.map