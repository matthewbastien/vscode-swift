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

/**
 * Given a symbol contained within an array of {@link DocumentSymbol DocumentSymbols},
 * returns the full documentation route that should be navigated to in order to view
 * the symbol in the documentation preview editor.
 *
 * @param symbol the {@link DocumentSymbol} to search for
 * @param documentSymbols the full list of {@link DocumentSymbol DocumentSymbols} to search within
 * @param context the initial route
 * @returns a string representing the route to give to the documentation preview editor
 */
export function convertSymbolToDocumentationRoute(
    symbol: DocumentSymbol,
    documentSymbols: DocumentSymbol[],
    context: string = ""
): string | undefined {
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
    return undefined;
}

/**
 * Searches through an array of {@link DocumentSymbol DocumentSymbols} to find which symbol most
 * closely matches the given {@link Position}.
 *
 * @param documentSymbols the full array of document symbols to search through
 * @param position the position of the cursor
 * @returns the symbol that matches the given {@link Position}, if any
 */
export function findDocumentableSymbolAtPosition(
    documentSymbols: DocumentSymbol[],
    position: Position
): DocumentSymbol | undefined {
    return findDocumentableSymbols(documentSymbols, position)
        .sort((a, b) => a.selectionRange.start.compareTo(b.selectionRange.start))
        .at(0);
}

function findDocumentableSymbols(
    documentSymbols: DocumentSymbol[],
    position: Position
): DocumentSymbol[] {
    const result: DocumentSymbol[] = [];
    for (const symbol of documentSymbols) {
        if (!symbol.range.contains(position)) {
            if (position.isBefore(symbol.range.start)) {
                result.push(symbol);
            }
            continue;
        }
        if (symbol.selectionRange.end.isBefore(position)) {
            const childSymbols = findDocumentableSymbols(symbol.children, position);
            if (childSymbols.length > 0) {
                result.push(...childSymbols);
                continue;
            }
        }
        result.push(symbol);
    }
    return result;
}
