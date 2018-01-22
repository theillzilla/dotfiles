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
const os = require("os");
const fs = require("fs");
const path = require("path");
const vscode_chrome_debug_core_1 = require("vscode-chrome-debug-core");
const child_process_1 = require("child_process");
const utils = require("./utils");
const errors = require("./errors");
const nls = require("vscode-nls");
const localize = nls.config(process.env.VSCODE_NLS_CONFIG)(__filename);
const DefaultWebSourceMapPathOverrides = {
    'webpack:///./~/*': '${webRoot}/node_modules/*',
    'webpack:///./*': '${webRoot}/*',
    'webpack:///*': '*',
    'webpack:///src/*': '${webRoot}/*',
    'meteor://💻app/*': '${webRoot}/*'
};
class ChromeDebugAdapter extends vscode_chrome_debug_core_1.ChromeDebugAdapter {
    initialize(args) {
        this._overlayHelper = new utils.DebounceHelper(/*timeoutMs=*/ 200);
        const capabilities = super.initialize(args);
        capabilities.supportsRestartRequest = true;
        return capabilities;
    }
    launch(args) {
        if (args.breakOnLoad && !args.breakOnLoadStrategy) {
            args.breakOnLoadStrategy = 'instrument';
        }
        return super.launch(args).then(() => {
            let runtimeExecutable;
            if (args.runtimeExecutable) {
                const re = findExecutable(args.runtimeExecutable);
                if (!re) {
                    return errors.getNotExistErrorResponse('runtimeExecutable', args.runtimeExecutable);
                }
                runtimeExecutable = re;
            }
            runtimeExecutable = runtimeExecutable || utils.getBrowserPath();
            if (!runtimeExecutable) {
                return vscode_chrome_debug_core_1.utils.errP(localize(0, null));
            }
            // Start with remote debugging enabled
            const port = args.port || 9222;
            const chromeArgs = [];
            const chromeEnv = args.env || null;
            const chromeWorkingDir = args.cwd || null;
            if (!args.noDebug) {
                chromeArgs.push('--remote-debugging-port=' + port);
            }
            // Also start with extra stuff disabled
            chromeArgs.push(...['--no-first-run', '--no-default-browser-check']);
            if (args.runtimeArgs) {
                chromeArgs.push(...args.runtimeArgs);
            }
            // Set a userDataDir by default, if not disabled with 'false' or already specified
            if (typeof args.userDataDir === 'undefined' && !args.runtimeExecutable) {
                args.userDataDir = path.join(os.tmpdir(), `vscode-chrome-debug-userdatadir_${port}`);
            }
            if (args.userDataDir) {
                chromeArgs.push('--user-data-dir=' + args.userDataDir);
            }
            let launchUrl;
            if (args.file) {
                launchUrl = vscode_chrome_debug_core_1.utils.pathToFileURL(args.file);
            }
            else if (args.url) {
                launchUrl = args.url;
            }
            if (launchUrl) {
                if (this.breakOnLoadActive) {
                    // We store the launch file/url provided and temporarily launch and attach to about:blank page. Once we receive configurationDone() event, we redirect the page to this file/url
                    // This is done to facilitate hitting breakpoints on load
                    this._userRequestedUrl = launchUrl;
                    launchUrl = "about:blank";
                }
                chromeArgs.push(launchUrl);
            }
            this._chromeProc = this.spawnChrome(runtimeExecutable, chromeArgs, chromeEnv, chromeWorkingDir, !!args.runtimeExecutable);
            this._chromeProc.on('error', (err) => {
                const errMsg = 'Chrome error: ' + err;
                vscode_chrome_debug_core_1.logger.error(errMsg);
                this.terminateSession(errMsg);
            });
            return args.noDebug ? undefined :
                this.doAttach(port, launchUrl || args.urlFilter, args.address, args.timeout, undefined, args.extraCRDPChannelPort);
        });
    }
    attach(args) {
        if (args.urlFilter) {
            args.url = args.urlFilter;
        }
        return super.attach(args);
    }
    configurationDone() {
        if (this.breakOnLoadActive && this._userRequestedUrl) {
            // This means all the setBreakpoints requests have been completed. So we can navigate to the original file/url.
            this.chrome.Page.navigate({ url: this._userRequestedUrl });
        }
        return super.configurationDone();
    }
    commonArgs(args) {
        if (!args.webRoot && args.pathMapping && args.pathMapping['/']) {
            // Adapt pathMapping['/'] as the webRoot when not set, since webRoot is explicitly used in many places
            args.webRoot = args.pathMapping['/'];
        }
        args.sourceMaps = typeof args.sourceMaps === 'undefined' || args.sourceMaps;
        args.sourceMapPathOverrides = getSourceMapPathOverrides(args.webRoot, args.sourceMapPathOverrides);
        args.skipFileRegExps = ['^chrome-extension:.*'];
        super.commonArgs(args);
    }
    doAttach(port, targetUrl, address, timeout, websocketUrl, extraCRDPChannelPort) {
        return super.doAttach(port, targetUrl, address, timeout, websocketUrl, extraCRDPChannelPort).then(() => {
            // Don't return this promise, a failure shouldn't fail attach
            this.globalEvaluate({ expression: 'navigator.userAgent', silent: true })
                .then(evalResponse => vscode_chrome_debug_core_1.logger.log('Target userAgent: ' + evalResponse.result.value), err => vscode_chrome_debug_core_1.logger.log('Getting userAgent failed: ' + err.message))
                .then(() => {
                const cacheDisabled = this._launchAttachArgs.disableNetworkCache || false;
                this.chrome.Network.setCacheDisabled({ cacheDisabled });
            });
        });
    }
    runConnection() {
        return [
            ...super.runConnection(),
            this.chrome.Page.enable(),
            this.chrome.Network.enable({})
        ];
    }
    onPaused(notification, expectingStopReason = this._expectingStopReason) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            this._overlayHelper.doAndCancel(() => {
                return this._domains.has('Overlay') ?
                    this.chrome.Overlay.setPausedInDebuggerMessage({ message: ChromeDebugAdapter.PAGE_PAUSE_MESSAGE }).catch(() => { }) :
                    this.chrome.Page.configureOverlay({ message: ChromeDebugAdapter.PAGE_PAUSE_MESSAGE }).catch(() => { });
            });
            return _super("onPaused").call(this, notification, expectingStopReason);
        });
    }
    threadName() {
        return 'Chrome';
    }
    onResumed() {
        this._overlayHelper.wait(() => {
            return this._domains.has('Overlay') ?
                this.chrome.Overlay.setPausedInDebuggerMessage({}).catch(() => { }) :
                this.chrome.Page.configureOverlay({}).catch(() => { });
        });
        super.onResumed();
    }
    disconnect(args) {
        const hadTerminated = this._hasTerminated;
        // Disconnect before killing Chrome, because running "taskkill" when it's paused sometimes doesn't kill it
        super.disconnect(args);
        if (this._chromeProc && !hadTerminated) {
            // Only kill Chrome if the 'disconnect' originated from vscode. If we previously terminated
            // due to Chrome shutting down, or devtools taking over, don't kill Chrome.
            if (vscode_chrome_debug_core_1.utils.getPlatform() === 0 /* Windows */ && this._chromePID) {
                // Run synchronously because this process may be killed before exec() would run
                const taskkillCmd = `taskkill /F /T /PID ${this._chromePID}`;
                vscode_chrome_debug_core_1.logger.log(`Killing Chrome process by pid: ${taskkillCmd}`);
                try {
                    child_process_1.execSync(taskkillCmd);
                }
                catch (e) {
                    // Can fail if Chrome was already open, and the process with _chromePID is gone.
                    // Or if it already shut down for some reason.
                }
            }
            else {
                vscode_chrome_debug_core_1.logger.log('Killing Chrome process');
                this._chromeProc.kill('SIGINT');
            }
        }
        this._chromeProc = null;
    }
    /**
     * Opt-in event called when the 'reload' button in the debug widget is pressed
     */
    restart() {
        return this.chrome ?
            this.chrome.Page.reload({ ignoreCache: true }) :
            Promise.resolve();
    }
    spawnChrome(chromePath, chromeArgs, env, cwd, usingRuntimeExecutable) {
        if (vscode_chrome_debug_core_1.utils.getPlatform() === 0 /* Windows */ && !usingRuntimeExecutable) {
            const options = {
                execArgv: [],
                silent: true
            };
            if (env) {
                options['env'] = Object.assign({}, process.env, env);
            }
            if (cwd) {
                options['cwd'] = cwd;
            }
            const chromeProc = child_process_1.fork(getChromeSpawnHelperPath(), [chromePath, ...chromeArgs], options);
            chromeProc.unref();
            chromeProc.on('message', data => {
                const pidStr = data.toString();
                vscode_chrome_debug_core_1.logger.log('got chrome PID: ' + pidStr);
                this._chromePID = parseInt(pidStr, 10);
            });
            chromeProc.on('error', (err) => {
                const errMsg = 'chromeSpawnHelper error: ' + err;
                vscode_chrome_debug_core_1.logger.error(errMsg);
            });
            chromeProc.stderr.on('data', data => {
                vscode_chrome_debug_core_1.logger.error('[chromeSpawnHelper] ' + data.toString());
            });
            chromeProc.stdout.on('data', data => {
                vscode_chrome_debug_core_1.logger.log('[chromeSpawnHelper] ' + data.toString());
            });
            return chromeProc;
        }
        else {
            vscode_chrome_debug_core_1.logger.log(`spawn('${chromePath}', ${JSON.stringify(chromeArgs)})`);
            const options = {
                detached: true,
                stdio: ['ignore'],
            };
            if (env) {
                options['env'] = Object.assign({}, process.env, env);
            }
            if (cwd) {
                options['cwd'] = cwd;
            }
            const chromeProc = child_process_1.spawn(chromePath, chromeArgs, options);
            chromeProc.unref();
            return chromeProc;
        }
    }
}
ChromeDebugAdapter.PAGE_PAUSE_MESSAGE = 'Paused in Visual Studio Code';
exports.ChromeDebugAdapter = ChromeDebugAdapter;
function getSourceMapPathOverrides(webRoot, sourceMapPathOverrides) {
    return sourceMapPathOverrides ? resolveWebRootPattern(webRoot, sourceMapPathOverrides, /*warnOnMissing=*/ true) :
        resolveWebRootPattern(webRoot, DefaultWebSourceMapPathOverrides, /*warnOnMissing=*/ false);
}
/**
 * Returns a copy of sourceMapPathOverrides with the ${webRoot} pattern resolved in all entries.
 *
 * dynamically required by test
 */
function resolveWebRootPattern(webRoot, sourceMapPathOverrides, warnOnMissing) {
    const resolvedOverrides = {};
    for (let pattern in sourceMapPathOverrides) {
        const replacePattern = replaceWebRootInSourceMapPathOverridesEntry(webRoot, pattern, warnOnMissing);
        const replacePatternValue = replaceWebRootInSourceMapPathOverridesEntry(webRoot, sourceMapPathOverrides[pattern], warnOnMissing);
        resolvedOverrides[replacePattern] = replacePatternValue;
    }
    return resolvedOverrides;
}
exports.resolveWebRootPattern = resolveWebRootPattern;
function replaceWebRootInSourceMapPathOverridesEntry(webRoot, entry, warnOnMissing) {
    const webRootIndex = entry.indexOf('${webRoot}');
    if (webRootIndex === 0) {
        if (webRoot) {
            return entry.replace('${webRoot}', webRoot);
        }
        else if (warnOnMissing) {
            vscode_chrome_debug_core_1.logger.log('Warning: sourceMapPathOverrides entry contains ${webRoot}, but webRoot is not set');
        }
    }
    else if (webRootIndex > 0) {
        vscode_chrome_debug_core_1.logger.log('Warning: in a sourceMapPathOverrides entry, ${webRoot} is only valid at the beginning of the path');
    }
    return entry;
}
function getChromeSpawnHelperPath() {
    return path.join(__dirname, 'chromeSpawnHelper.js');
}
function findExecutable(program) {
    if (process.platform === 'win32' && !path.extname(program)) {
        const PATHEXT = process.env['PATHEXT'];
        if (PATHEXT) {
            const executableExtensions = PATHEXT.split(';');
            for (const extension of executableExtensions) {
                const path = program + extension;
                if (fs.existsSync(path)) {
                    return path;
                }
            }
        }
    }
    if (fs.existsSync(program)) {
        return program;
    }
    return undefined;
}

//# sourceMappingURL=chromeDebugAdapter.js.map
