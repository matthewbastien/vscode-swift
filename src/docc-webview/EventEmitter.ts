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

import type { Disposable } from "vscode";

export type Listener<T> = (event: T) => void;
export type Event<T> = (listener: Listener<T>) => Disposable;

export class EventEmitter<T> {
    private listeners: Listener<T>[] = [];

    event: Event<T> = listener => {
        this.listeners.push(listener);
        return {
            dispose: () => {
                const index = this.listeners.findIndex(el => el === listener);
                if (index >= 0) {
                    this.listeners.splice(index, 1);
                }
            },
        };
    };

    notify(event: T): void {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}
