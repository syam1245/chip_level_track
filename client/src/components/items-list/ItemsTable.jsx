import React, { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableContainer, Paper } from "@mui/material";

import ItemsTableHeader from "./ItemsTableHeader";
import ItemsTableRow from "./ItemsTableRow";

const ROW_HEIGHT = 72; // estimated row height in px

const ItemsTable = ({
    items, loading, sortBy, sortOrder, handleSort,
    technicianFilter, setTechnicianFilter, setPage, techniciansList,
    handleWhatsApp, handleAIGenerateWhatsApp, setPrintItem, setEditItem, handleDelete,
    selectedIds, onSelectChange, isAdmin, focusedRowIndex = -1,
}) => {
    const scrollContainerRef = useRef(null);

    const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i._id));
    const someSelected = items.some((i) => selectedIds.has(i._id)) && !allSelected;

    const handleSelectAll = (e) => {
        if (e.target.checked) items.forEach((i) => onSelectChange(i._id, true));
        else items.forEach((i) => onSelectChange(i._id, false));
    };

    // ── Virtual row renderer ────────────────────────────────────────────────
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    useEffect(() => {
        if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
            virtualizer.scrollToIndex(focusedRowIndex, { align: "auto", behavior: "smooth" });
        }
    }, [focusedRowIndex, items.length, virtualizer]);

    // Only virtualize when we have enough rows to benefit from it
    const shouldVirtualize = items.length > 20;

    return (
        <TableContainer
            ref={scrollContainerRef}
            component={Paper}
            elevation={0}
            sx={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: "auto",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s",
                ...(shouldVirtualize && { maxHeight: "calc(100vh - 320px)", minHeight: 400 }),
            }}
        >
            <Table sx={{ ...(shouldVirtualize && { tableLayout: "fixed" }) }}>
                <ItemsTableHeader
                    sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort}
                    technicianFilter={technicianFilter} setTechnicianFilter={setTechnicianFilter}
                    setPage={setPage} techniciansList={techniciansList}
                    allSelected={allSelected} someSelected={someSelected} handleSelectAll={handleSelectAll}
                    shouldVirtualize={shouldVirtualize}
                />

                <TableBody>
                    {shouldVirtualize && virtualizer.getVirtualItems().length > 0 && (
                        <tr style={{ height: virtualizer.getVirtualItems()[0]?.start || 0 }} />
                    )}

                    {(shouldVirtualize ? virtualizer.getVirtualItems() : items.map((_, i) => ({ index: i }))).map((rowOrVirtual) => {
                        const rowIdx = rowOrVirtual.index;
                        const item = items[rowIdx];
                        if (!item) return null;
                        return (
                            <ItemsTableRow
                                key={item._id} item={item} rowIdx={rowIdx}
                                focusedRowIndex={focusedRowIndex} selectedIds={selectedIds}
                                onSelectChange={onSelectChange} handleWhatsApp={handleWhatsApp}
                                handleAIGenerateWhatsApp={handleAIGenerateWhatsApp}
                                setPrintItem={setPrintItem} setEditItem={setEditItem} handleDelete={handleDelete}
                            />
                        );
                    })}

                    {shouldVirtualize && virtualizer.getVirtualItems().length > 0 && (
                        <tr style={{
                            height: virtualizer.getTotalSize() -
                                (virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.end || 0)
                        }} />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ItemsTable;
