"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRenderCount = void 0;
// tslint:disable
const react_1 = require("react");
/**
 * Alerts the number of component  rerenders in console.
 *
 * @param alertAt optional count to alert at.
 */
function useRenderCount(alertAt = 10) {
    const count = react_1.useRef(0);
    alertAt = alertAt || 10;
    count.current++;
    if (count.current >= alertAt)
        console.log(`%c RENDERS:`, 'color:red; font-weight:bolder', count.current);
    else
        console.log(`%c RENDERS:`, 'color:#cccc00', count.current);
}
exports.useRenderCount = useRenderCount;
//# sourceMappingURL=renders.js.map