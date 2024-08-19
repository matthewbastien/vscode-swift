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

import { DocCElement, DocCIndex } from "../../WebviewEvent";
import { Event, EventEmitter } from "./EventEmitter";

export interface HistoryItem {
    path: string;
}

export class HistoryState {
    private _state: HistoryItem[];

    private changeRouteEmitter = new EventEmitter<string>();
    onDidChangeRoute = this.changeRouteEmitter.event;

    constructor(
        private readonly webviewState: WebviewState,
        initialState?: HistoryItem[]
    ) {
        this._state = initialState ?? [];
    }

    navigateTo(path: string) {
        if (this.currentRoute === path) {
            return;
        }

        window.bridge?.receive({ type: "navigation", data: path });
    }

    get currentRoute(): string | undefined {
        return this._state.at(-1)?.path;
    }
    set currentRoute(value: string) {
        if (this.currentRoute === value) {
            return;
        }

        this._state.push({ path: value });
        this.changeRouteEmitter.notify(value);
        this.webviewState.save();
    }

    toJSON(): HistoryItem[] {
        return this._state;
    }
}

export class StorageState {
    private _state: {
        [key: string]: string;
    };

    constructor(
        private readonly webviewState: WebviewState,
        initialState: unknown
    ) {
        this._state = (initialState as Storage["_state"]) ?? {};
    }

    getItem(key: string): string | null {
        return this._state[key] ?? null;
    }

    setItem(key: string, value: string) {
        this._state[key] = value;
        this.webviewState.save();
    }

    removeItem(key: string) {
        delete this._state[key];
        this.webviewState.save();
    }

    clear(): void {
        this._state = {};
        this.webviewState.save();
    }

    hookActualStorage(storage: Storage) {
        storage.getItem = key => this.getItem(key);
        storage.setItem = (key, value) => this.setItem(key, value);
        storage.removeItem = key => this.removeItem(key);
        storage.clear = () => this.clear();
    }

    toJSON(): { [key: string]: string } {
        return this._state;
    }
}

export class NavigatorState {
    private _index?: DocCIndex;
    get index(): DocCIndex | undefined {
        return this._index;
    }

    private _scroll: number;
    get scroll(): number {
        return this._scroll;
    }

    private _visible: boolean;
    get visible(): boolean {
        return this._visible;
    }

    private _width: number;
    get width(): number {
        return this._width;
    }

    private changeIndexEmitter = new EventEmitter<DocCIndex>();
    onDidChangeIndex = this.changeIndexEmitter.event;

    private scrollEmitter = new EventEmitter<number>();
    onDidScroll = this.scrollEmitter.event;

    private changeVisibilityEmitter = new EventEmitter<boolean>();
    onDidChangeVisibility = this.changeVisibilityEmitter.event;

    private changeWidthEmitter = new EventEmitter<number>();
    onDidChangeWidth = this.changeWidthEmitter.event;

    elements: NavigatorItemState[];

    constructor(
        private readonly webviewState: WebviewState,
        oldState?: SerializableNavigatorState
    ) {
        this._index = oldState?.index;
        this._scroll = oldState?.scroll ?? 0;
        this._visible = oldState?.visible ?? true;
        this._width = oldState?.width ?? window.innerWidth * 0.2;
        this.elements = this._index ? this.createNavigatorItems(this._index, oldState) : [];
    }

    updateIndex(index: DocCIndex) {
        this._index = index;
        this.elements = this.createNavigatorItems(index);
        this.changeIndexEmitter.notify(index);
        this.webviewState.save();
    }

    updateScroll(scrollY: number) {
        if (this._scroll === scrollY) {
            return;
        }

        this._scroll = scrollY;
        this.scrollEmitter.notify(scrollY);
        this.webviewState.save();
    }

    toggleVisibility() {
        this.updateVisibility(!this.visible);
    }

    updateVisibility(visible: boolean) {
        if (this._visible === visible) {
            return;
        }

        this._visible = visible;
        this.changeVisibilityEmitter.notify(visible);
        this.webviewState.save();
    }

    updateWidth(width: number) {
        if (this._width === width) {
            return;
        }

        this._width = width;
        this.changeWidthEmitter.notify(width);
        this.webviewState.save();
    }

    toJSON(): SerializableNavigatorState {
        return {
            index: this._index,
            scroll: this._scroll,
            visible: this._visible,
            width: this._width,
            elements: this.elements.map(element => element.toJSON()),
        };
    }

    private createNavigatorItems(
        index: DocCIndex,
        oldState?: SerializableNavigatorState
    ): NavigatorItemState[] {
        const result: NavigatorItemState[] = [];
        let i = 0;
        for (const language in index.interfaceLanguages) {
            for (const node of index.interfaceLanguages[language]) {
                result.push(new NavigatorItemState(this.webviewState, node, oldState?.elements[i]));
                i += 1;
            }
        }
        return result;
    }
}

export class NavigatorItemState {
    type: string;
    title: string;
    path?: string;
    children: NavigatorItemState[];

    private _selected: boolean;
    get selected(): boolean {
        return this._selected;
    }
    set selected(selected: boolean) {
        if (this._selected === selected) {
            return;
        }

        // Might as well expand our content if we get selected
        if (selected) {
            this.expanded = true;
        }

        this._selected = selected;
        this.selectedEmitter.notify(selected);
        this.webviewState.save();
    }

    private selectedEmitter = new EventEmitter<boolean>();
    onDidSelect = this.selectedEmitter.event;

    private _expanded: boolean;
    get expanded(): boolean {
        return this._expanded;
    }
    set expanded(expanded: boolean) {
        // Make sure all parents are expanded as well
        if (expanded && this.parent) {
            this.parent.expanded = true;
        }

        if (this._expanded === expanded) {
            return;
        }

        this._expanded = expanded;
        this.expandEmitter.notify(expanded);
        this.webviewState.save();
    }

    private expandEmitter = new EventEmitter<boolean>();
    onDidExpand = this.expandEmitter.event;

    private _maxHeight: number;
    get maxHeight(): number {
        return this._maxHeight;
    }
    set maxHeight(value: number) {
        if (this._maxHeight === value) {
            return;
        }

        this._maxHeight = value;
        this.maxHeightEmitter.notify(value);
        this.webviewState.save();
    }

    private maxHeightEmitter = new EventEmitter<number>();
    onDidChangeMaxHeight = this.maxHeightEmitter.event;

    constructor(
        private readonly webviewState: WebviewState,
        node: DocCElement,
        oldState?: SerializableNavigatorItemState,
        public parent?: NavigatorItemState
    ) {
        this._selected = node.path === webviewState.history.currentRoute;
        this._expanded = oldState?.expanded ?? this._selected;
        this._maxHeight = oldState?.maxHeight ?? this._expanded ? -1 : 0;
        this.type = node.type;
        this.title = node.title;
        this.path = node.path;
        this.children = (node.children ?? []).map(
            (child, i) => new NavigatorItemState(webviewState, child, oldState?.children[i], this)
        );
        webviewState.history.onDidChangeRoute(path => {
            this.selected = this.path === path;
        });
    }

    toJSON(): SerializableNavigatorItemState {
        return {
            expanded: this._expanded,
            maxHeight: this._maxHeight,
            children: this.children.map(child => child.toJSON()),
        };
    }
}

export class WebviewState {
    history: HistoryState;
    localStorage: StorageState;
    sessionStorage: StorageState;
    navigator: NavigatorState;

    private indexChangeEmitter = new EventEmitter<DocCIndex>();
    onDidChangeIndex: Event<DocCIndex> = this.indexChangeEmitter.event;

    constructor(private readonly vscode: VSCodeWebviewAPI) {
        const oldState = vscode.getState();
        this.history = new HistoryState(this, oldState?.history);
        this.localStorage = new StorageState(this, oldState?.localStorage);
        this.sessionStorage = new StorageState(this, oldState?.sessionStorage);
        this.navigator = new NavigatorState(this, oldState?.navigator);
    }

    save() {
        this.vscode.setState(this.toJSON());
    }

    toJSON(): SerializableWebviewState {
        return {
            history: this.history.toJSON(),
            localStorage: this.localStorage.toJSON(),
            sessionStorage: this.sessionStorage.toJSON(),
            navigator: this.navigator?.toJSON(),
        };
    }
}

export interface SerializableNavigatorState {
    index?: DocCIndex;
    scroll: number;
    visible: boolean;
    width: number;
    elements: SerializableNavigatorItemState[];
}

export interface SerializableNavigatorItemState {
    expanded: boolean;
    maxHeight: number;
    children: SerializableNavigatorItemState[];
}

export interface SerializableWebviewState {
    history: HistoryItem[];
    localStorage: { [key: string]: string };
    sessionStorage: { [key: string]: string };
    navigator: SerializableNavigatorState;
}
