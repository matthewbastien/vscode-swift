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

import { WebviewEvent } from "../../WebviewEvent";
import type { SerializableWebviewState } from "./WebviewState";

declare global {
    interface VSCodeWebviewAPI {
        getState(): SerializableWebviewState | null | undefined;
        setState(value: SerializableWebviewState): void;
        postMessage(event: WebviewEvent): void;
    }

    function acquireVsCodeApi(): VSCodeWebviewAPI;

    interface CommunicationBridgeEvent {
        type: string;
        data?: unknown;
    }

    interface CommunicationBridge {
        receive(event: CommunicationBridgeEvent): void;
    }

    interface Window {
        baseURL: string;
        initialRoute: string;
        bridge?: CommunicationBridge;
        webkit?: {
            messageHandlers: {
                [key: string]:
                    | {
                          postMessage(message: unknown): void;
                      }
                    | undefined;
                bridge?: {
                    postMessage(event: CommunicationBridgeEvent): void;
                };
            };
        };
    }
}

export {};
