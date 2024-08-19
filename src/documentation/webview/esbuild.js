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

const esbuild = require("esbuild");
const path = require("path");
const inlineImportPlugin = require("esbuild-plugin-inline-import");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const args = yargs(hideBin(process.argv))
    .option("watch", {
        alias: "w",
        type: "boolean",
        description: "Watch the input files for changes and re-build automatically",
    })
    .parse();

(async () => {
    const context = await esbuild.context({
        entryPoints: [path.join(__dirname, "src", "index.ts")],
        bundle: true,
        outfile: path.join(__dirname, "..", "..", "..", "assets", "documentation", "index.js"),
        plugins: [
            // Always include this plugin before others
            inlineImportPlugin(),
        ],
        logLevel: "info",
    });
    if (args.watch) {
        await context.watch();
    } else {
        await context.dispose();
    }
})().catch(() => process.exit(1));
