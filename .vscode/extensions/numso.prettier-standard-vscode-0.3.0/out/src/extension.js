"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const EditProvider_1 = require("./EditProvider");
const VALID_LANG = ['javascript', 'javascriptreact'];
function activate(context) {
    const editProvider = new EditProvider_1.default();
    context.subscriptions.push(vscode_1.languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, editProvider));
    context.subscriptions.push(vscode_1.languages.registerDocumentFormattingEditProvider(VALID_LANG, editProvider));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map