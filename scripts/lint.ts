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

import { ESLint } from "eslint";
import { repositoryRoot } from "./lib/utilities";
import { compileAllTypeScriptFiles } from "./lib/typescript";

async function runESLint(): Promise<boolean> {
    const eslint = new ESLint({
        cwd: repositoryRoot,
    });
    const results = await eslint.lintFiles(["./"]);
    if (results.length > 0) {
        const formatter = await eslint.loadFormatter("stylish");
        console.log(
            formatter.format(results, {
                cwd: repositoryRoot,
                rulesMeta: eslint.getRulesMetaForResults(results),
            })
        );
        return false;
    }
    return true;
}

(async () => {
    const eslintSuccess = await runESLint();
    const tsSuccess = await compileAllTypeScriptFiles({ noEmit: true });
    if (!eslintSuccess || !tsSuccess) {
        process.exit(1);
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
