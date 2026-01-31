import * as vscode from 'vscode';
import { searchWindows, PairingAlgorithm, SearchResult } from './searchEngine';

export class WindowSearchViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'windowSearchView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'search':
                    this._performSearch(data.begin, data.end, data.algorithm);
                    break;
                case 'navigateToLine':
                    this._navigateToLine(data.line);
                    break;
                case 'openInNewTab':
                    this._openInNewTab(data.beginLine, data.endLine);
                    break;
            }
        });
    }

    private async _performSearch(begin: string, end: string, algorithm: PairingAlgorithm) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active file open');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');

        const results = searchWindows(lines, begin, end, algorithm);

        this._view?.webview.postMessage({
            type: 'searchResults',
            results: results
        });
    }

    private _navigateToLine(lineNumber: number) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const position = new vscode.Position(lineNumber, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
        );
    }

    private async _openInNewTab(beginLine: number, endLine: number) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');
        
        const extractedLines = lines.slice(beginLine, endLine + 1);
        const content = extractedLines.join('\n');

        const newDocument = await vscode.workspace.openTextDocument({
            content: content,
            language: document.languageId
        });

        await vscode.window.showTextDocument(newDocument);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Window Search</title>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        
        .input-group {
            margin-bottom: 10px;
        }
        
        label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        input, select {
            width: 100%;
            padding: 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            box-sizing: border-box;
        }
        
        input:focus, select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        .results {
            margin-top: 20px;
        }
        
        .pair {
            margin-bottom: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 8px;
        }
        
        .pair-header {
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
        }
        
        .line-item {
            padding: 4px;
            margin: 2px 0;
            cursor: pointer;
            display: flex;
            align-items: flex-start;
        }
        
        .line-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .line-number {
            color: var(--vscode-editorLineNumber-foreground);
            margin-right: 8px;
            min-width: 40px;
            flex-shrink: 0;
        }
        
        .line-content {
            flex: 1;
            word-break: break-all;
        }
        
        .unpaired-section {
            margin-top: 20px;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-errorForeground);
        }
        
        .context-menu {
            position: absolute;
            background-color: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: none;
        }
        
        .context-menu-item {
            padding: 6px 12px;
            cursor: pointer;
        }
        
        .context-menu-item:hover {
            background-color: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
        }
        
        .empty-state {
            padding: 20px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="input-group">
        <label for="begin">Begin</label>
        <input type="text" id="begin" placeholder="Enter begin marker...">
    </div>
    
    <div class="input-group">
        <label for="end">End</label>
        <input type="text" id="end" placeholder="Enter end marker...">
    </div>
    
    <div class="input-group">
        <label for="algorithm">Algorithm</label>
        <select id="algorithm">
            <option value="FIFO">FIFO</option>
            <option value="LIFO">LIFO</option>
        </select>
    </div>
    
    <div id="results" class="results">
        <div class="empty-state">Enter search criteria and open a log file to begin</div>
    </div>
    
    <div id="contextMenu" class="context-menu">
        <div class="context-menu-item" id="openInNewTab">Open in new tab</div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        const beginInput = document.getElementById('begin');
        const endInput = document.getElementById('end');
        const algorithmSelect = document.getElementById('algorithm');
        const resultsDiv = document.getElementById('results');
        const contextMenu = document.getElementById('contextMenu');
        
        let currentPair = null;
        
        function performSearch() {
            const begin = beginInput.value;
            const end = endInput.value;
            const algorithm = algorithmSelect.value;
            
            if (!begin || !end) {
                return;
            }
            
            vscode.postMessage({
                type: 'search',
                begin: begin,
                end: end,
                algorithm: algorithm
            });
        }
        
        beginInput.addEventListener('input', performSearch);
        endInput.addEventListener('input', performSearch);
        algorithmSelect.addEventListener('change', performSearch);
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'searchResults':
                    displayResults(message.results);
                    break;
            }
        });
        
        function displayResults(results) {
            if (!results.pairs.length && !results.unpairedBegins.length && !results.unpairedEnds.length) {
                resultsDiv.innerHTML = '<div class="empty-state">No results found</div>';
                return;
            }
            
            let html = '';
            
            // Display pairs
            results.pairs.forEach((pair, index) => {
                html += \`
                    <div class="pair">
                        <div class="pair-header">Pair \${index + 1}</div>
                        <div class="line-item" onclick="navigateToLine(\${pair.beginLine})" oncontextmenu="showContextMenu(event, \${pair.beginLine}, \${pair.endLine})">
                            <span class="line-number">Line \${pair.beginLine + 1}</span>
                            <span class="line-content">\${escapeHtml(pair.beginText)}</span>
                        </div>
                        <div class="line-item" onclick="navigateToLine(\${pair.endLine})" oncontextmenu="showContextMenu(event, \${pair.beginLine}, \${pair.endLine})">
                            <span class="line-number">Line \${pair.endLine + 1}</span>
                            <span class="line-content">\${escapeHtml(pair.endText)}</span>
                        </div>
                    </div>
                \`;
            });
            
            // Display unpaired begins
            if (results.unpairedBegins.length > 0) {
                html += '<div class="unpaired-section"><div class="section-title">Unpaired Begin Markers</div>';
                results.unpairedBegins.forEach(item => {
                    html += \`
                        <div class="line-item" onclick="navigateToLine(\${item.line})">
                            <span class="line-number">Line \${item.line + 1}</span>
                            <span class="line-content">\${escapeHtml(item.text)}</span>
                        </div>
                    \`;
                });
                html += '</div>';
            }
            
            // Display unpaired ends
            if (results.unpairedEnds.length > 0) {
                html += '<div class="unpaired-section"><div class="section-title">Unpaired End Markers</div>';
                results.unpairedEnds.forEach(item => {
                    html += \`
                        <div class="line-item" onclick="navigateToLine(\${item.line})">
                            <span class="line-number">Line \${item.line + 1}</span>
                            <span class="line-content">\${escapeHtml(item.text)}</span>
                        </div>
                    \`;
                });
                html += '</div>';
            }
            
            resultsDiv.innerHTML = html;
        }
        
        function navigateToLine(line) {
            vscode.postMessage({
                type: 'navigateToLine',
                line: line
            });
        }
        
        function showContextMenu(event, beginLine, endLine) {
            event.preventDefault();
            currentPair = { beginLine, endLine };
            contextMenu.style.display = 'block';
            contextMenu.style.left = event.clientX + 'px';
            contextMenu.style.top = event.clientY + 'px';
        }
        
        document.getElementById('openInNewTab').addEventListener('click', () => {
            if (currentPair) {
                vscode.postMessage({
                    type: 'openInNewTab',
                    beginLine: currentPair.beginLine,
                    endLine: currentPair.endLine
                });
            }
            contextMenu.style.display = 'none';
        });
        
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}
