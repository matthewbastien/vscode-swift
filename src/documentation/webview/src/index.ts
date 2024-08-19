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

import $ from "jquery";
import debounce from "lodash.debounce";
import styles from "inline:./styles.css";
import { WebviewState } from "./WebviewState";
import { WebviewEvent } from "../../WebviewEvent";
import { Navigator } from "./navigator";

const vscode = acquireVsCodeApi();

const webviewState = new WebviewState(vscode);
webviewState.localStorage.hookActualStorage(window.localStorage);
webviewState.sessionStorage.hookActualStorage(window.sessionStorage);

if (webviewState.history.currentRoute) {
    window.initialRoute = webviewState.history.currentRoute;
    vscode.postMessage({ type: "requestContent", location: webviewState.history.currentRoute });
}
webviewState.history.onDidChangeRoute(location => {
    vscode.postMessage({ type: "requestContent", location });
});

window.addEventListener(
    "scroll",
    debounce(() => {
        webviewState.sessionStorage.setItem(
            "scrollPosition",
            JSON.stringify({
                x: window.scrollX,
                y: window.scrollY,
                location: webviewState.history.currentRoute!,
            })
        );
    }, 200)
);

window.webkit = {
    messageHandlers: {
        bridge: {
            async postMessage(event: CommunicationBridgeEvent) {
                switch (event.type) {
                    case "navigation":
                        webviewState.history.currentRoute = event.data as string;
                        break;
                }
            },
        },
    },
};

$("html").append($(document.createElement("style")).text(styles));
$("#app").remove();
const navigator = new Navigator(webviewState);
$("body").append(navigator.htmlElement);

window.addEventListener("message", message => {
    const event = message.data as WebviewEvent;
    switch (event.type) {
        case "indexUpdate":
            webviewState.navigator.updateIndex(event.data);
            break;
        case "contentUpdate":
            window.bridge?.receive({ type: "contentUpdate", data: event.data });
            break;
    }
});
if (!webviewState.navigator.index) {
    vscode.postMessage({ type: "requestIndex" });
}
