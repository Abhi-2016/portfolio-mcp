// Generic markdown table extraction. Deliberately strict: throws rather than
// returning empty/partial data on a missing section or malformed table, since
// silently serving wrong data to an external MCP client is worse than a
// build-time failure (see PLAN.md rule 9 — dual-purpose bar).

/**
 * Finds a markdown section by its heading text (any level, e.g. "## Foo" or
 * "### Foo") and returns the raw text between that heading and the next
 * heading of the same or shallower level.
 */
export function extractSection(markdown: string, heading: string): string {
  const headingPattern = new RegExp(
    `^(#{1,6})\\s+${escapeRegExp(heading)}\\s*$`,
    "m"
  );
  const match = headingPattern.exec(markdown);
  if (!match) {
    throw new Error(`Section heading not found: "${heading}"`);
  }

  const level = match[1].length;
  const startIndex = match.index + match[0].length;
  const rest = markdown.slice(startIndex);

  const nextHeadingPattern = new RegExp(`^#{1,${level}}\\s+.+$`, "m");
  const nextMatch = nextHeadingPattern.exec(rest);

  return nextMatch ? rest.slice(0, nextMatch.index) : rest;
}

/**
 * Parses the first markdown table found in a block of text into an array of
 * row objects, keyed by the table's header column names.
 */
export function parseFirstTable(text: string): Record<string, string>[] {
  const lines = text.split("\n").map((l) => l.trim());
  const headerIndex = lines.findIndex((l) => isTableRow(l));
  if (headerIndex === -1) {
    throw new Error("No markdown table found in section");
  }

  const separatorLine = lines[headerIndex + 1];
  if (!separatorLine || !/^\|?[\s:|-]+\|?$/.test(separatorLine)) {
    throw new Error("Malformed table: missing header separator row");
  }

  const headers = splitRow(lines[headerIndex]);

  const rows: Record<string, string>[] = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!isTableRow(line)) break; // table ends at the first non-row line
    const cells = splitRow(line);
    if (cells.length !== headers.length) {
      throw new Error(
        `Malformed table row: expected ${headers.length} cells, got ${cells.length} — "${line}"`
      );
    }
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx]));
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error("Table has a header but no data rows");
  }

  return rows;
}

function isTableRow(line: string): boolean {
  return line.startsWith("|") && line.endsWith("|") && line.length > 1;
}

function splitRow(line: string): string[] {
  // Strip leading/trailing pipe, split on unescaped pipes, trim each cell.
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
