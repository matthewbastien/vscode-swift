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

import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";
import * as ts from "typescript";
import { repositoryRoot } from "./utilities";

const ignoredDirectories: string[] = [
    "./assets",
    "./coverage",
    "./dist",
    "./out",
    "./src/swift-docc-render",
    "./node_modules",
];

async function readTypeScriptConfigFile(
    configFile: string
): Promise<ts.Diagnostic[] | ts.ParsedCommandLine> {
    // Read config file
    const configFileText = (await fs.readFile(configFile)).toString();

    // Parse JSON, after removing comments. Just fancier JSON.parse
    const result = ts.parseConfigFileTextToJson(configFile, configFileText);
    if (result.error) {
        return [result.error];
    }

    // Extract config information
    const configParseResult = ts.parseJsonConfigFileContent(
        result.config,
        ts.sys,
        path.dirname(configFile)
    );
    if (configParseResult.errors.length > 0) {
        return configParseResult.errors;
    }
    return configParseResult;
}

async function lintTypeScriptConfigFile(
    configFile: string,
    options: TypeScriptOptions
): Promise<ts.Diagnostic[]> {
    const configOrDiagnostics = await readTypeScriptConfigFile(configFile);
    if (Array.isArray(configOrDiagnostics)) {
        return configOrDiagnostics;
    }
    if (options.noEmit) {
        configOrDiagnostics.options.noEmit = true;
    }
    const program = ts.createProgram(configOrDiagnostics.fileNames, configOrDiagnostics.options);
    const emitResult = program.emit();
    return ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
}

export interface TypeScriptOptions {
    noEmit?: boolean;
}

export async function compileAllTypeScriptFiles(options: TypeScriptOptions = {}): Promise<boolean> {
    const tsConfigFiles = await glob(["./**/tsconfig.json"], {
        cwd: repositoryRoot,
        ignore: ignoredDirectories.map(dir => dir + "/**"),
    });
    const diagnostics = (
        await Promise.all(
            tsConfigFiles.map(configFile => lintTypeScriptConfigFile(configFile, options))
        )
    ).flat();
    if (diagnostics.length > 0) {
        console.log(
            ts.formatDiagnosticsWithColorAndContext(diagnostics, {
                getCurrentDirectory: function (): string {
                    return repositoryRoot;
                },
                getCanonicalFileName: function (fileName: string): string {
                    return fileName;
                },
                getNewLine: function (): string {
                    return "\r\n";
                },
            })
        );
        const files = diagnostics.reduceRight<string[]>((prev, curr) => {
            const fileName = curr.file?.fileName;
            if (fileName && prev.findIndex(val => val === fileName) === -1) {
                return prev.concat([fileName]);
            }
            return prev;
        }, []);
        console.log(
            `Found ${diagnostics.length} errors in ${files.length} files:\r\n    ${files.join("\r\n    ")}`
        );
        return false;
    }
    return true;
}
