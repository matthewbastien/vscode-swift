//===----------------------------------------------------------------------===//
//
// This source file is part of the VS Code Swift open source project
//
// Copyright (c) 2024 the VS Code Swift project authors
// Licensed under Apache License v2.0
//
// See LICENSE.txt for license information
// See CONTRIBUTORS.txt for the list of VS Code Swift project authors
//
// SPDX-License-Identifier: Apache-2.0
//
//===----------------------------------------------------------------------===//

import { rimraf } from "rimraf";
import * as path from "path";
import { compileAllTypeScriptFiles } from "./lib/typescript";
import { repositoryRoot } from "./lib/utilities";

(async () => {
    await rimraf(path.join(repositoryRoot, "out"));
    if (!(await compileAllTypeScriptFiles())) {
        process.exit(1);
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
