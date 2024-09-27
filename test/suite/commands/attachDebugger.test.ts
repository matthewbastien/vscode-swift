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

import assert from "assert";
import { getLldbProcess } from "../../../src/extension/debugger/lldb";
import { SwiftToolchain } from "../../../src/extension/toolchain/toolchain";
import { WorkspaceContext } from "../../../src/extension/WorkspaceContext";
import { SwiftOutputChannel } from "../../../src/extension/ui/SwiftOutputChannel";

suite("getLldbProcess Contract Test Suite", () => {
    test("happy path, make sure lldb call returns proper output", async () => {
        const toolchain = await SwiftToolchain.create();
        const workspaceContext = await WorkspaceContext.create(
            new SwiftOutputChannel("Swift"),
            toolchain
        );
        assert.notStrictEqual(await getLldbProcess(workspaceContext), []);
    });
});
