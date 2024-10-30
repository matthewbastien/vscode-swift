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

import { DocumentSymbol, Position } from "vscode";

export function convertSymbolToDocumentationRoute(
    symbol: DocumentSymbol,
    documentSymbols: DocumentSymbol[],
    context: string = ""
): string {
    for (const symbolToCheck of documentSymbols) {
        if (symbolToCheck.range.isEqual(symbol.range)) {
            return `${context}/${symbolToCheck.name}`;
        }
        const fromChildren = convertSymbolToDocumentationRoute(
            symbol,
            symbolToCheck.children,
            `${context}/${symbolToCheck.name}`
        );
        if (fromChildren) {
            return fromChildren;
        }
    }
    return "";
}

export function findDocumentableSymbolAtPosition(
    symbols: DocumentSymbol[],
    position: Position
): DocumentSymbol | undefined {
    return findDocumentableSymbols(symbols, position)[0];
}

function findDocumentableSymbols(symbols: DocumentSymbol[], position: Position): DocumentSymbol[] {
    for (const symbol of symbols) {
        if (!symbol.range.contains(position)) {
            if (position.isBefore(symbol.range.start)) {
                return [symbol];
            }
            continue;
        }
        if (symbol.selectionRange.end.isBefore(position)) {
            return findDocumentableSymbols(symbol.children, position);
        }
        return [symbol];
    }
    return [];
}
