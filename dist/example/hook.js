"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function useCustomHook(state) {
    return (prop, def = '') => {
        function hasError() {
            if (!state.touched.includes(prop))
                return false;
            return state.errors.hasOwnProperty(prop);
        }
        return {
            get message() {
                if (!state.errors || typeof state.errors[prop] === 'undefined')
                    return def;
                return state.errors[prop][0].message;
            },
            get valid() {
                return !hasError();
            },
            get invalid() {
                return hasError();
            }
        };
    };
}
exports.default = useCustomHook;
//# sourceMappingURL=hook.js.map