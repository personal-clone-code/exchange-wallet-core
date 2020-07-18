"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = void 0;
var fs_1 = __importDefault(require("fs"));
var hbs_1 = __importDefault(require("hbs"));
var dirPath = __dirname + '/templates';
function renderTemplate(filename, data) {
    try {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        var content = fs_1.default.readFileSync(dirPath + "/" + filename, 'utf8').toString();
        hbs_1.default.registerPartial('mainContent', content);
        var source = fs_1.default.readFileSync(dirPath + "/main_layout.hbs", 'utf8').toString();
        var mailTemplate = hbs_1.default.handlebars.compile(source);
        return mailTemplate(data);
    }
    catch (error) {
        console.log(error);
        throw new Error("Could not render template from " + filename);
    }
}
exports.renderTemplate = renderTemplate;
//# sourceMappingURL=renderTemplate.js.map