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
import { Codicon } from "./codicon";
import { HistoryState, NavigatorItemState, WebviewState } from "./WebviewState";
import { VerticalSash } from "./sash";

export class Navigator implements Disposable {
    htmlElement: JQuery<HTMLElement>;
    private mutationObserver: MutationObserver;
    private items: NavigatorItem[] = [];
    private disposables: Disposable[] = [];

    constructor(private state: WebviewState) {
        const sash = new VerticalSash({
            visible: this.state.navigator.visible,
            position: this.state.navigator.width,
        });
        this.htmlElement = $()
            .add(
                $(document.createElement("div"))
                    .addClass(className("header"))
                    .append(
                        Codicon("layout-sidebar-left").on("click", () =>
                            this.state.navigator.toggleVisibility()
                        ),
                        $(document.createElement("div"))
                            .addClass(className("header-title"))
                            .text(document.title)
                    )
            )
            .add(
                $(document.createElement("div"))
                    .addClass(className("navigator"))
                    .css("width", this.state.navigator.visible ? this.state.navigator.width : 0)
            )
            .add(sash.htmlElement)
            .add(
                $(document.createElement("div"))
                    .attr("id", "app")
                    .css(
                        "margin-left",
                        this.state.navigator.visible ? this.state.navigator.width : 0
                    )
            );
        // Listen for state changes
        this.disposables.push(
            sash,
            sash.onDidChangePosition(position =>
                this.state.navigator.updateWidth(
                    this.state.navigator.width + (position.to - position.from)
                )
            ),
            this.state.navigator.onDidChangeIndex(this.createChildren.bind(this)),
            this.state.navigator.onDidChangeWidth(width => {
                if (!this.state.navigator.visible) {
                    return;
                }
                $(`.${className("navigator")}`).css("width", width);
                sash.updatePosition(width);
                $("#app").css("margin-left", width);
            }),
            this.state.navigator.onDidChangeVisibility(visible => {
                sash.updateVisibility(visible);
                $(`.${className("navigator")}`).animate({
                    width: visible ? this.state.navigator.width : 0,
                });
                $("#app").animate({ "margin-left": visible ? this.state.navigator.width : 0 });
            })
        );
        // The DocC renderer will re-create the app div on startup. Make sure
        // we update the margin properly when this happens.
        this.mutationObserver = new MutationObserver(this.onBodyMutated.bind(this));
        $("body").each((index, element) => {
            this.mutationObserver.observe(element, { childList: true });
        });
        this.createChildren();
    }

    dispose() {
        this.mutationObserver.disconnect();
        this.disposables.forEach(d => d.dispose());
        $(`.${className("navigator")}`).remove();
        $(`.${className("sash")}`).remove();
        $("#app").css("margin-left", "");
    }

    private onBodyMutated() {
        if (!this.state.navigator) {
            return;
        }
        $("#app").css("margin-left", this.state.navigator.visible ? this.state.navigator.width : 0);
    }

    private createChildren() {
        this.items.forEach(item => item.dispose());
        this.items = [];
        let navigatorItemElements = $();
        for (const node of this.state.navigator.elements) {
            const item = new NavigatorItem(node, this.state.history);
            navigatorItemElements = navigatorItemElements.add(item.htmlElement);
            this.items.push(item);
        }
        const navigator = this.htmlElement.eq(1);
        navigator.children().remove();
        navigator.append(navigatorItemElements);
    }
}

class NavigatorItem implements Disposable {
    htmlElement: JQuery<HTMLElement>;
    private disposables: Disposable[] = [];

    constructor(state: NavigatorItemState, history: HistoryState) {
        if (state.type === "groupMarker") {
            this.htmlElement = $(document.createElement("div"))
                .addClass(className("navigator-item-group-marker"))
                .append(
                    Codicon("chevron-right")
                        .addClass(className("navigator-item-chevron"))
                        .css("visibility", "hidden"),
                    this.getIcon(state),
                    $(document.createElement("div"))
                        .addClass(className("navigator-item-text"))
                        .attr("title", state.title)
                        .text(state.title)
                );
            return;
        }

        this.htmlElement = $(document.createElement("div"))
            .addClass(className("navigator-item"))
            .append(
                $(document.createElement("div"))
                    .addClass(className("navigator-item-title"))
                    .addClass(state.selected ? "selected" : "")
                    .append(
                        Codicon("chevron-right")
                            .addClass(className("navigator-item-chevron"))
                            .addClass(state.expanded ? "expanded" : "")
                            .css("visibility", state.children.length === 0 ? "hidden" : "")
                            .on("click", event => {
                                state.expanded = !state.expanded;
                                event.preventDefault();
                            }),
                        this.getIcon(state),
                        $(document.createElement("div"))
                            .addClass(className("navigator-item-text"))
                            .attr("title", state.title)
                            .text(state.title)
                            .on("click", event => {
                                if (state.path) {
                                    history.navigateTo(state.path);
                                }
                                event.preventDefault();
                            })
                    ),
                $(document.createElement("div"))
                    .addClass(className("navigator-item-children"))
                    .css("max-height", state.maxHeight === -1 ? "auto" : state.maxHeight)
                    .append(
                        $(document.createElement("div"))
                            .addClass(className("navigator-item-content"))
                            .append(
                                ...state.children.map(childState => {
                                    const child = new NavigatorItem(childState, history);
                                    this.disposables.push(child);
                                    return child.htmlElement;
                                })
                            )
                    )
            );
        // Listen for state changes
        const titleElement = this.htmlElement.find(`>.${className("navigator-item-title")}`);
        const chevronElement = titleElement.find(`>.${className("navigator-item-chevron")}`);
        const childrenElement = this.htmlElement.find(`>.${className("navigator-item-children")}`);
        const contentElement = childrenElement.find(`>.${className("navigator-item-content")}`);
        this.disposables.push(
            state.onDidSelect(selected => {
                if (selected) {
                    titleElement.addClass("selected");
                } else {
                    titleElement.removeClass("selected");
                }
            }),
            state.onDidExpand(expanded => {
                if (state.maxHeight === -1) {
                    state.maxHeight = contentElement.height() ?? -1;
                }
                setTimeout(() => {
                    const oldMaxHeight = state.maxHeight;
                    if (expanded) {
                        state.maxHeight = contentElement.height() ?? -1;
                        chevronElement.addClass("expanded");
                    } else {
                        state.maxHeight = 0;
                        chevronElement.removeClass("expanded");
                    }
                    let parent = state.parent;
                    while (parent) {
                        if (parent.maxHeight >= 0) {
                            parent.maxHeight += state.maxHeight - oldMaxHeight;
                        }
                        parent = parent.parent;
                    }
                });
            }),
            state.onDidChangeMaxHeight(maxHeight => {
                childrenElement.css("max-height", maxHeight === -1 ? "auto" : maxHeight);
            })
        );
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.htmlElement.remove();
    }

    private getIcon(state: NavigatorItemState): JQuery<HTMLElement> {
        switch (state.type) {
            case "overview":
                return Codicon("files");
            case "article":
                return Codicon("file");
            case "sampleCode":
                return Codicon("symbol-snippet");
            case "method":
                return Codicon("symbol-method");
            case "project":
                return Codicon("symbol-package");
            case "init":
                return Codicon("symbol-constructor");
            case "protocol":
                return Codicon("symbol-interface");
            case "property":
                return Codicon("symbol-property");
            case "struct":
                return Codicon("symbol-structure");
            case "module":
                return Codicon("symbol-module");
            case "extension":
                return Codicon("symbol-interface");
            case "enum":
                return Codicon("symbol-enum");
            case "case":
                return Codicon("symbol-enum-member");
            case "op":
                return Codicon("symbol-operator");
            case "symbol":
                return Codicon("symbol-misc");
        }
        return $();
    }
}
