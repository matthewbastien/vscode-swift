//===----------------------------------------------------------------------===//
//
// This source file is part of the VS Code Swift open source project
//
// Copyright (c) 2021-2024 the VS Code Swift project authors
// Licensed under Apache License v2.0
//
// See LICENSE.txt for license information
// See CONTRIBUTORS.txt for the list of VS Code Swift project authors
//
// SPDX-License-Identifier: Apache-2.0
//
//===----------------------------------------------------------------------===//

import * as child_process from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

function exec(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            console.log(`\n> ${command} ${args.join(" ")}\n`);
            const childProcess = child_process.spawn(command, args, {
                stdio: "inherit",
                ...options,
            });
            childProcess.on("exit", (code, signal) => {
                if (code === 0) {
                    resolve();
                }
                if (code !== null) {
                    reject(new Error(`command failed with exit code ${code}`));
                } else {
                    reject(new Error(`command was terminated due to signal ${signal}`));
                }
            });
            childProcess.on("error", reject);
        } catch (error) {
            reject(error);
        }
    });
}

(async function () {
    try {
        const swiftDocCRenderPath = path.join(__dirname, "..", "swift-docc-render");
        // Remove existing asset directory first
        await fs.rm(path.join(__dirname, "..", "assets", "swift-docc-render"), {
            recursive: true,
            force: true,
        });
        // Install dependencies for swift-docc-render
        await exec("npm", ["ci"], { cwd: swiftDocCRenderPath });
        // Run vue-cli-service to build swift-docc-render
        const buildArgs = [
            "vue-cli-service",
            "build",
            "--mode",
            "production",
            "--dest",
            "../assets/swift-docc-render",
        ];
        const isWatchMode = process.argv[2] === "--watch";
        if (isWatchMode) {
            buildArgs.push("--watch");
        }
        await exec("npx", buildArgs, {
            cwd: swiftDocCRenderPath,
            env: { ...process.env, VUE_APP_TARGET: "ide" },
        });
    } catch (error) {
        console.error(`failed to build swift-docc-render: ${error}`);
        process.exit(1);
    }
})();
