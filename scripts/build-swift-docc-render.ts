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

import { spawn } from "child_process";
import * as path from "path";
import { rimraf } from "rimraf";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { exec, repositoryRoot } from "./lib/utilities";

(async () => {
    const args = await yargs(hideBin(process.argv))
        .option("watch", {
            alias: "w",
            type: "boolean",
            description: "Watch the input files for changes and re-build automatically",
        })
        .parse();

    const renderOutputPath = path.join(repositoryRoot, "assets", "swift-docc-render");
    await rimraf(renderOutputPath).catch(() => {
        // The directory probably just doesn't exist
    });
    const swiftDoccRenderPath = path.join(repositoryRoot, "src", "swift-docc-render");
    await exec("npm", ["install"], { cwd: swiftDoccRenderPath });
    await new Promise<void>((resolve, reject) => {
        const proc = spawn(
            "npx",
            [
                "vue-cli-service",
                "build",
                "--dest",
                renderOutputPath,
                ...(args.watch ? ["--watch"] : []),
            ],
            {
                cwd: swiftDoccRenderPath,
                env: { ...process.env, VUE_APP_TARGET: "ide" },
                stdio: "inherit",
            }
        );
        proc.on("error", error => reject(error));
        proc.on("exit", (code, signal) => {
            if ((code !== null && code > 0) || signal !== null) {
                process.exit(1);
            }
            resolve();
        });
    });
})().catch(error => {
    console.error(error);
    process.exit(1);
});
