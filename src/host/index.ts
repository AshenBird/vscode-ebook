
import * as vscode from 'vscode';
import {EpubEditorProvider} from "./Editor";
export function activate(context: vscode.ExtensionContext) {
	const editor = new EpubEditorProvider("mcswift.epub").register(context);
	return { editor };
}

export function deactivate() {}
