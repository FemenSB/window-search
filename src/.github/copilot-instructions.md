# Window Search VS Code Extension

## Project Overview
Window Search is a VS Code extension for analyzing log files by searching for time windows marked by begin and end strings with FIFO/LIFO pairing algorithms.

## Key Features
- Sidebar panel UI for log analysis
- Begin/end marker text inputs
- FIFO/LIFO algorithm selection
- Display paired results with line numbers
- Click to navigate to line in file
- Right-click to open pair in new tab

## Development Guidelines
- TypeScript-based VS Code extension
- Webview-based sidebar panel
- Search operates on currently open file
- Support overlapping time windows
- Handle unpaired markers gracefully
