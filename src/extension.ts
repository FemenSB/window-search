import * as vscode from 'vscode';
import { WindowSearchViewProvider } from './windowSearchViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new WindowSearchViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            WindowSearchViewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
}

export function deactivate() {}
