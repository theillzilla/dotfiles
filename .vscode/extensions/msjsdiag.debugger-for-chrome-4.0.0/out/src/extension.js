"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Core = require("vscode-chrome-debug-core");
const utils_1 = require("./utils");
const nls = require("vscode-nls");
const localize = nls.config(process.env.VSCODE_NLS_CONFIG)(__filename);
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.chrome-debug.toggleSkippingFile', toggleSkippingFile));
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('chrome', new ChromeConfigurationProvider()));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
const DEFAULT_CONFIG = {
    type: 'chrome',
    request: 'launch',
    name: localize(0, null),
    url: 'http://localhost:8080',
    webRoot: '${workspaceFolder}'
};
class ChromeConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        return Promise.resolve([DEFAULT_CONFIG]);
    }
    /**
     * Try to add all missing attributes to the debug configuration being launched.
     */
    resolveDebugConfiguration(folder, config, token) {
        return __awaiter(this, void 0, void 0, function* () {
            // if launch.json is missing or empty
            if (!config.type && !config.request && !config.name) {
                // Return null so it will create a launch.json and fall back on provideDebugConfigurations - better to point the user towards the config
                // than try to work automagically.
                return null;
            }
            if (config.request === 'attach') {
                const discovery = new Core.chromeTargetDiscoveryStrategy.ChromeTargetDiscovery(new Core.NullLogger(), new Core.telemetry.NullTelemetryReporter());
                let targets;
                try {
                    targets = yield discovery.getAllTargets(config.address || '127.0.0.1', config.port, utils_1.targetFilter, config.url);
                }
                catch (e) {
                    // Target not running?
                }
                if (targets && targets.length > 1) {
                    const selectedTarget = yield pickTarget(targets);
                    if (!selectedTarget) {
                        // Quickpick canceled, bail
                        return null;
                    }
                    config.websocketUrl = selectedTarget.websocketDebuggerUrl;
                }
            }
            return config;
        });
    }
}
exports.ChromeConfigurationProvider = ChromeConfigurationProvider;
function toggleSkippingFile(path) {
    if (!path) {
        const activeEditor = vscode.window.activeTextEditor;
        path = activeEditor && activeEditor.document.fileName;
    }
    const args = typeof path === 'string' ? { path } : { sourceReference: path };
    vscode.commands.executeCommand('workbench.customDebugRequest', 'toggleSkipFileStatus', args);
}
function pickTarget(targets) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = targets.map(target => ({
            label: unescapeTargetTitle(target.title),
            detail: target.url,
            websocketDebuggerUrl: target.webSocketDebuggerUrl
        }));
        const placeHolder = localize(1, null);
        const selected = yield vscode.window.showQuickPick(items, { placeHolder, matchOnDescription: true, matchOnDetail: true });
        return selected;
    });
}
function unescapeTargetTitle(title) {
    return title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, `'`)
        .replace(/&quot;/g, '"');
}

//# sourceMappingURL=extension.js.map
