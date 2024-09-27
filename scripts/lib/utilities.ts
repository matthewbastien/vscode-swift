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

import * as child_process from "child_process";
import { join } from "path";

export const repositoryRoot = join(__dirname, "..", "..");

export interface ExecResult {
    stdout: string;
    stderr: string;
}

export interface ExecOptions {
    env?: { [key: string]: string };
    cwd?: string;
}

export async function exec(
    command: string,
    args: string[],
    options: ExecOptions = {}
): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
        try {
            const result: ExecResult = {
                stdout: "",
                stderr: "",
            };
            const proc = child_process.spawn(command, args, {
                cwd: options.cwd,
                env: options.env,
                stdio: "pipe",
            });
            proc.stdout.on("data", data => (result.stdout += data.toString()));
            proc.stderr.on("data", data => (result.stderr += data.toString()));
            proc.on("exit", (code, signal) => {
                if ((code !== null && code > 0) || signal !== null) {
                    reject(new Error(`Command failed:\r\n\r\n${result.stderr}"`));
                    return;
                }
                resolve(result);
            });
            proc.on("error", error => reject(error));
        } catch (error) {
            reject(error);
        }
    });
}
