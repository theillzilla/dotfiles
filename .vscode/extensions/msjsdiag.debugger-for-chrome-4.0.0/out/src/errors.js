"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const localize = nls.config(process.env.VSCODE_NLS_CONFIG)(__filename);
/**
 * 'Path does not exist' error
 */
function getNotExistErrorResponse(attribute, path) {
    return Promise.reject({
        id: 2007,
        format: localize(0, null, attribute, '{path}'),
        variables: { path }
    });
}
exports.getNotExistErrorResponse = getNotExistErrorResponse;

//# sourceMappingURL=errors.js.map
