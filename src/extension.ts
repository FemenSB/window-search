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

    // Register command to remove all lines matching the selected text
    context.subscriptions.push(
        vscode.commands.registerCommand('window-search.removeMatchingLines', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showWarningMessage('Please select text to match against');
                return;
            }

            await removeLines(editor, selectedText, true);
        })
    );

    // Register command to remove all lines NOT matching the selected text
    context.subscriptions.push(
        vscode.commands.registerCommand('window-search.removeNonMatchingLines', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showWarningMessage('Please select text to match against');
                return;
            }

            await removeLines(editor, selectedText, false);
        })
    );
}

/**
 * Remove lines from the document based on whether they contain the search text
 * @param editor The active text editor
 * @param searchText The text to search for in each line
 * @param removeMatching If true, remove matching lines. If false, remove non-matching lines.
 */
async function removeLines(editor: vscode.TextEditor, searchText: string, removeMatching: boolean) {
    const document = editor.document;
    const totalLines = document.lineCount;
    const linesToKeep: string[] = [];

    // Determine which lines to keep
    for (let i = 0; i < totalLines; i++) {
        const line = document.lineAt(i);
        const lineText = line.text;
        const containsSearch = lineText.includes(searchText);

        // Keep line if: (removeMatching AND doesn't contain) OR (NOT removeMatching AND contains)
        if (removeMatching ? !containsSearch : containsSearch) {
            linesToKeep.push(lineText);
        }
    }

    // Replace entire document with filtered lines
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );

    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, linesToKeep.join('\n'));
    });

    const removedCount = totalLines - linesToKeep.length;
    const action = removeMatching ? 'matching' : 'non-matching';
    vscode.window.showInformationMessage(
        `Removed ${removedCount} ${action} line${removedCount !== 1 ? 's' : ''}`
    );
}

export function deactivate() {}
