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
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { FolderContext } from "../FolderContext";
import { createSwiftTask } from "../tasks/SwiftTaskProvider";
import { executeTaskWithUI, updateAfterError } from "./utilities";
import { ContentResponse, IndexResponse, WebviewEvent } from "../documentation/WebviewEvent";

export async function buildDocumentation(
    context: vscode.ExtensionContext,
    folderContext: FolderContext
) {
    const buildPath = path.join(folderContext.folder.fsPath, ".build", "vscode");
    const outputPath = path.join(buildPath, "documentation");
    await fs.mkdir(outputPath, { recursive: true });
    const archivePath = path.join(outputPath, "SlothCreator.doccarchive");
    const task = createSwiftTask(
        [
            "package",
            "--disable-sandbox",
            "generate-documentation",
            "--target",
            "SlothCreator",
            "--output-path",
            archivePath,
        ],
        "Build Documentation",
        {
            cwd: folderContext.folder,
            env: {
                DOCC_HTML_DIR: path.join(buildPath, "render"),
            },
            scope: folderContext.workspaceFolder,
            prefix: folderContext.name,
            presentationOptions: { reveal: vscode.TaskRevealKind.Silent },
        },
        folderContext.workspaceContext.toolchain
    );
    await executeTaskWithUI(task, "Building Documentation", folderContext).then(result => {
        updateAfterError(result, folderContext);
    });

    const archiveURI = vscode.Uri.file(archivePath);
    const panel = vscode.window.createWebviewPanel(
        "Swift-DocC-Preview",
        "SlothCreator Documentation",
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            localResourceRoots: [context.extensionUri, archiveURI],
        }
    );
    panel.webview.onDidReceiveMessage(async (event: WebviewEvent) => {
        switch (event.type) {
            case "requestIndex":
                panel.webview.postMessage({
                    type: "indexUpdate",
                    data: JSON.parse(
                        await fs.readFile(path.join(archivePath, "index", "index.json"), "utf-8")
                    ),
                } as IndexResponse);
                break;
            case "requestContent":
                panel.webview.postMessage({
                    type: "contentUpdate",
                    data: JSON.parse(
                        await fs.readFile(
                            path.join(archivePath, "data", `${event.location}.json`),
                            "utf-8"
                        )
                    ),
                } as ContentResponse);
                break;
        }
    });
    const webviewBaseURI = panel.webview.asWebviewUri(archiveURI);
    const assetsURI = vscode.Uri.file(context.asAbsolutePath("assets"));
    const scriptURI = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(assetsURI, "documentation", "index.js")
    );
    const initialRoute = "/documentation/slothcreator";
    const codiconsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            context.extensionUri,
            "node_modules",
            "@vscode/codicons",
            "dist",
            "codicon.css"
        )
    );
    const documentationHTML = (await fs.readFile(path.join(archivePath, "index.html"), "utf-8"))
        .replaceAll("{{BASE_PATH}}", webviewBaseURI.toString())
        .replace("</head>", `<link href="${codiconsUri}" rel="stylesheet" /></head>`)
        .replace(
            "</body>",
            `<script>window.initialRoute="${initialRoute}";document.title="SlothCreator Documentation"</script><script src="${scriptURI.toString()}"></script></body>`
        );
    panel.webview.html = documentationHTML;
}
