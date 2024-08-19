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

export type WebviewEvent = RequestIndex | IndexResponse | RequestContent | ContentResponse;

export interface RequestIndex {
    type: "requestIndex";
}

export interface DocCElement {
    type: string;
    title: string;
    path?: string;
    icon?: string;
    deprecated?: boolean;
    children?: DocCElement[];
}

export type DocCReference = { type: string; [key: string]: unknown } | DocCImageReference;

export interface DocCImageReference {
    type: "image";
    identifier: string;
    alt: string;
    variants: {
        traits: string[];
        url: string;
    }[];
}

export interface DocCIndex {
    schemaVersion: { major: number; minor: number; patch: number };
    includedArchiveIdentifiers: string[];
    interfaceLanguages: {
        [language: string]: DocCElement[];
    };
    references: {
        [identifier: string]: DocCReference;
    };
}

export interface IndexResponse {
    type: "indexUpdate";
    data: DocCIndex;
}

export interface RequestContent {
    type: "requestContent";
    location: string;
}

export interface ContentResponse {
    type: "contentUpdate";
    data: unknown;
}
