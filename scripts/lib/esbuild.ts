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

import * as esbuild from "esbuild";
import * as fs from "fs/promises";
import { rimraf } from "rimraf";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

export async function runESBuild(options: esbuild.BuildOptions) {
    const args = await yargs(hideBin(process.argv))
        .option("minify", {
            type: "boolean",
            description: "Minify the resulting bundle",
        })
        .option("watch", {
            alias: "w",
            type: "boolean",
            description: "Watch the input files for changes and re-build automatically",
        })
        .parse();

    if (options.outfile) {
        await Promise.all([
            fs.unlink(options.outfile).catch(() => {
                // The file probably just doesn't exist
            }),
            fs.unlink(options.outfile + ".map").catch(() => {
                // The file probably just doesn't exist
            }),
        ]);
    } else if (options.outdir) {
        await rimraf(options.outdir).catch(() => {
            // The directory probably just doesn't exist
        });
    }

    const esbuildOptions: esbuild.BuildOptions = {
        ...options,
        bundle: true,
        sourcemap: true,
        minify: args.minify,
        logLevel: "info",
    };

    if (args.watch) {
        const context = await esbuild.context(esbuildOptions);
        await context.watch();
        return;
    }
    await esbuild.build(esbuildOptions);
}
