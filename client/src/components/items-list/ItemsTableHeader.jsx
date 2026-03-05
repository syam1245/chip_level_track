import React, { useState } from "react";
import {
    TableHead, TableRow, TableCell, Checkbox,
    TableSortLabel, Typography, Box, Menu, MenuItem,
} from "@mui/material";
import { FilterList as FilterListIcon } from "@mui/icons-material";

const ItemsTableHeader = ({
    sortBy, sortOrder, handleSort,
    technicianFilter, setTechnicianFilter, setPage, techniciansList,
    allSelected, someSelected, handleSelectAll,
    shouldVirtualize,
}) => {
    const [techMenuAnchor, setTechMenuAnchor] = useState(null);

    return (
        <TableHead sx={{
            bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider",
            ...(shouldVirtualize && { position: "sticky", top: 0, zIndex: 2 }),
        }}>
            <TableRow>
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                    <Checkbox size="small" checked={allSelected} indeterminate={someSelected} onChange={handleSelectAll} />
                </TableCell>
                <TableCell sx={{ width: "18%" }}>
                    <TableSortLabel active={sortBy === "createdAt"} direction={sortBy === "createdAt" ? sortOrder : "asc"} onClick={() => handleSort("createdAt")}>
                        <Typography variant="subtitle2" fontWeight="700" color="text.secondary">JOB NO</Typography>
                    </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: "13%" }}>
                    <TableSortLabel active={sortBy === "customerName"} direction={sortBy === "customerName" ? sortOrder : "asc"} onClick={() => handleSort("customerName")}>
                        <Typography variant="subtitle2" fontWeight="700" color="text.secondary">CUSTOMER</Typography>
                    </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: "8%" }}>
                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary">DEVICE</Typography>
                </TableCell>
                <TableCell sx={{ width: "12%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={(e) => setTechMenuAnchor(e.currentTarget)}>
                        <Typography variant="subtitle2" fontWeight="700" color={technicianFilter !== "All" ? "primary.main" : "text.secondary"}>
                            TECHNICIAN {technicianFilter !== "All" && `(${technicianFilter})`}
                        </Typography>
                        <FilterListIcon sx={{ ml: 0.5, fontSize: 16, color: technicianFilter !== "All" ? "primary.main" : "text.secondary" }} />
                    </Box>
                    <Menu anchorEl={techMenuAnchor} open={Boolean(techMenuAnchor)} onClose={() => setTechMenuAnchor(null)}>
                        <MenuItem
                            selected={technicianFilter === "All"}
                            onClick={() => { setTechnicianFilter("All"); setPage(1); setTechMenuAnchor(null); }}
                        >
                            All Technicians
                        </MenuItem>
                        {techniciansList.map((tech) => (
                            <MenuItem
                                key={tech.displayName}
                                selected={technicianFilter === tech.displayName}
                                onClick={() => { setTechnicianFilter(tech.displayName); setPage(1); setTechMenuAnchor(null); }}
                            >
                                {tech.displayName}
                            </MenuItem>
                        ))}
                    </Menu>
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary">PHONE</Typography>
                </TableCell>
                <TableCell sx={{ width: "9%" }}>
                    <TableSortLabel active={sortBy === "finalCost"} direction={sortBy === "finalCost" ? sortOrder : "asc"} onClick={() => handleSort("finalCost")}>
                        <Typography variant="subtitle2" fontWeight="700" color="text.secondary">AMOUNT</Typography>
                    </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: "8%" }}>
                    <TableSortLabel active={sortBy === "status"} direction={sortBy === "status" ? sortOrder : "asc"} onClick={() => handleSort("status")}>
                        <Typography variant="subtitle2" fontWeight="700" color="text.secondary">STATUS</Typography>
                    </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: "12%" }}>
                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary">NOTES</Typography>
                </TableCell>
                <TableCell align="right" sx={{ width: "10%" }}>
                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary">ACTIONS</Typography>
                </TableCell>
            </TableRow>
        </TableHead>
    );
};

export default React.memo(ItemsTableHeader);
