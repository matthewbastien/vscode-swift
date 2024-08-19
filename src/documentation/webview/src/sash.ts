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
import type { Disposable } from "vscode";
import { className } from "./className";
import { EventEmitter } from "./EventEmitter";
import { makeDraggable } from "./makeDraggable";

export interface VerticalSashState {
    visible: boolean;
    position: number;
}

export class VerticalSash implements Disposable {
    htmlElement: JQuery<HTMLElement>;
    private disposables: Disposable[] = [];

    private positionEmitter = new EventEmitter<{ from: number; to: number }>();
    onDidChangePosition = this.positionEmitter.event;

    constructor(private state: VerticalSashState) {
        this.htmlElement = $(document.createElement("div"))
            .addClass(className("sash"))
            .css("left", `${state.position - 2}px`);
        // Make the sash draggable to update its position
        this.disposables.push(
            makeDraggable(
                this.htmlElement,
                () => {
                    $("html").addClass(className("cursor-ew-resize"));
                    $(`.${className("sash")}`).addClass("hover");
                    return {
                        position: this.state.position,
                    };
                },
                (initialState, newState) => {
                    this.updatePosition(initialState.position + (newState.x - initialState.x));
                },
                () => {
                    $("html").removeClass(className("cursor-ew-resize"));
                    $(`.${className("sash")}`).removeClass("hover");
                }
            )
        );
    }

    updateVisibility(visible: boolean) {
        if (this.state.visible === visible) {
            return;
        }
        this.state.visible = visible;
        this.htmlElement.css("visibility", visible ? "" : "hidden");
    }

    updatePosition(position: number) {
        if (this.state.position === position) {
            return;
        }
        const oldPosition = this.state.position;
        this.state.position = position;
        this.htmlElement.css("left", `${position - 2}px`);
        this.positionEmitter.notify({ from: oldPosition, to: position });
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.htmlElement.remove();
    }
}
