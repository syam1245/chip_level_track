/**
 * Export data as a CSV file download.
 *
 * @param {string} filename - Download filename (e.g. "report_2026-03-20.csv")
 * @param {string[]} headers - Column header labels
 * @param {string[][]} rows - Array of row arrays (each cell already a string)
 */
export function exportCSV(filename, headers, rows) {
    const csvLines = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((row) => row.map((v) => `"${v ?? ""}"`).join(",")),
    ];

    // BOM prefix ensures Excel opens the file with correct UTF-8 encoding
    const csvContent = "\uFEFF" + csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
