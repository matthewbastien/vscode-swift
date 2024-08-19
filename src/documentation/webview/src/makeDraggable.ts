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

interface DragState {
    x: number;
    y: number;
}

interface ClientDragState {
    [key: string]: unknown;
}

export function makeDraggable<T extends ClientDragState>(
    element: JQuery<HTMLElement>,
    onDragStart: () => T,
    onDrag: (initialState: DragState & T, newState: DragState) => void | Promise<void>,
    onDragEnd: () => void | Promise<void> = () => {}
): Disposable {
    let initialState: (DragState & T) | undefined;
    function mouseDownListener(event: JQuery.MouseDownEvent) {
        initialState = {
            x: event.screenX,
            y: event.screenY,
            ...onDragStart(),
        };
        event.preventDefault();
    }
    element.on("mousedown", mouseDownListener);
    function mouseUpListener() {
        if (!initialState) {
            return;
        }
        initialState = undefined;
        onDragEnd();
    }
    window.addEventListener("mouseup", mouseUpListener);
    function mouseMoveListener(event: MouseEvent) {
        if (!initialState) {
            return;
        }
        onDrag(initialState, {
            x: event.screenX,
            y: event.screenY,
        });
        event.preventDefault();
    }
    window.addEventListener("mousemove", mouseMoveListener);
    return {
        dispose() {
            window.removeEventListener("mouseup", mouseUpListener);
            window.removeEventListener("mousemove", mouseMoveListener);
            element.off("mousedown", mouseDownListener);
        },
    };
}
