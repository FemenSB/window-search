export type PairingAlgorithm = 'FIFO' | 'LIFO';

export interface Pair {
    beginLine: number;
    beginText: string;
    endLine: number;
    endText: string;
}

export interface UnpairedItem {
    line: number;
    text: string;
}

export interface SearchResult {
    pairs: Pair[];
    unpairedBegins: UnpairedItem[];
    unpairedEnds: UnpairedItem[];
}

export function searchWindows(
    lines: string[],
    beginMarker: string,
    endMarker: string,
    algorithm: PairingAlgorithm
): SearchResult {
    const beginIndices: Array<{ line: number; text: string }> = [];
    const endIndices: Array<{ line: number; text: string }> = [];

    // Find all begin and end markers
    lines.forEach((line, index) => {
        if (line.includes(beginMarker)) {
            beginIndices.push({ line: index, text: line });
        }
        if (line.includes(endMarker)) {
            endIndices.push({ line: index, text: line });
        }
    });

    const pairs: Pair[] = [];
    const usedBegins = new Set<number>();
    const usedEnds = new Set<number>();

    if (algorithm === 'FIFO') {
        // FIFO: pair each end with the oldest unpaired begin
        for (const end of endIndices) {
            for (let i = 0; i < beginIndices.length; i++) {
                const begin = beginIndices[i];
                if (!usedBegins.has(i) && begin.line < end.line) {
                    pairs.push({
                        beginLine: begin.line,
                        beginText: begin.text,
                        endLine: end.line,
                        endText: end.text
                    });
                    usedBegins.add(i);
                    usedEnds.add(endIndices.indexOf(end));
                    break;
                }
            }
        }
    } else {
        // LIFO: pair each end with the latest unpaired begin
        for (const end of endIndices) {
            for (let i = beginIndices.length - 1; i >= 0; i--) {
                const begin = beginIndices[i];
                if (!usedBegins.has(i) && begin.line < end.line) {
                    pairs.push({
                        beginLine: begin.line,
                        beginText: begin.text,
                        endLine: end.line,
                        endText: end.text
                    });
                    usedBegins.add(i);
                    usedEnds.add(endIndices.indexOf(end));
                    break;
                }
            }
        }
    }

    // Sort pairs by begin line
    pairs.sort((a, b) => a.beginLine - b.beginLine);

    // Collect unpaired begins and ends
    const unpairedBegins: UnpairedItem[] = beginIndices
        .map((begin, index) => ({ ...begin, index }))
        .filter(({ index }) => !usedBegins.has(index))
        .map(({ line, text }) => ({ line, text }));

    const unpairedEnds: UnpairedItem[] = endIndices
        .map((end, index) => ({ ...end, index }))
        .filter(({ index }) => !usedEnds.has(index))
        .map(({ line, text }) => ({ line, text }));

    return {
        pairs,
        unpairedBegins,
        unpairedEnds
    };
}
