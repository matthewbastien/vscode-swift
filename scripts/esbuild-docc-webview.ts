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

import { join } from "path";
import { repositoryRoot } from "./lib/utilities";
import { runESBuild } from "./lib/esbuild";

runESBuild({
    entryPoints: [join(repositoryRoot, "src", "docc-webview", "index.ts")],
    outfile: join(repositoryRoot, "dist", "docc-webview.js"),
}).catch(error => {
    console.error(error);
    process.exit(1);
});
