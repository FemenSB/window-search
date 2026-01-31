# Window Search

A VS Code extension for analyzing log files by searching for time windows marked by begin and end strings.

## Features

- **Time Window Search**: Find and pair begin/end markers in log files
- **FIFO/LIFO Algorithms**: Choose between First-In-First-Out or Last-In-First-Out pairing strategies
- **Interactive Results**: Click to navigate to lines, right-click to open pairs in new tabs
- **Unpaired Marker Detection**: Identifies begin/end markers that couldn't be paired
- **Sidebar Panel**: Dedicated panel in the activity bar for easy access

## Usage

1. Open a log file in VS Code
2. Click the Window Search icon in the activity bar (sidebar)
3. Enter your begin marker text (e.g., `[REQUEST_START]`)
4. Enter your end marker text (e.g., `[REQUEST_END]`)
5. Select the pairing algorithm (FIFO or LIFO)
6. View the results showing paired windows and any unpaired markers

### Pairing Algorithms

**FIFO (First-In-First-Out)**: Each end marker is paired with the oldest unpaired begin marker that appears before it. This is useful for sequential, non-overlapping operations.

**LIFO (Last-In-First-Out)**: Each end marker is paired with the most recent unpaired begin marker that appears before it. This is useful for nested operations or stack-like behavior.

## Example

Using the sample log file in `test-logs/sample.log`:

- Begin marker: `[TASK_BEGIN]`
- End marker: `[TASK_END]`
- Algorithm: LIFO

This will pair nested task windows correctly, showing which tasks completed in the expected order.

## Development

### Building

```bash
npm install
npm run compile
```

### Running

1. Open this folder in VS Code
2. Press F5 to start debugging
3. A new Extension Development Host window will open
4. Open a log file and use the Window Search panel

### Testing

Open the `test-logs/sample.log` file to test the extension with various marker combinations:
- `[REQUEST_START]` / `[REQUEST_END]`
- `[TASK_BEGIN]` / `[TASK_END]`

## Requirements

- VS Code 1.85.0 or higher

## Extension Settings

This extension does not add any VS Code settings.

## Known Issues

None at this time.

## Release Notes

### 0.0.1

Initial release of Window Search with:
- FIFO and LIFO pairing algorithms
- Sidebar panel interface
- Line navigation
- Open pair in new tab functionality
