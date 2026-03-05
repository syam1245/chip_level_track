/**
 * useItemsData — manages item list state, data fetching, filtering,
 * sorting, pagination, debounced search, and SSE live updates.
 */
import { useEffect, useState, useCallback, useRef, startTransition } from "react";
import { fetchItems as fetchItemsApi } from "../../services/items.api";
import { fetchUsers } from "../../services/auth.api";
import API_BASE_URL from "../../api";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function useItemsData({ isAdmin, user }) {
    // ── Core data ──────────────────────────────────────────────────────
    const [items, setItems] = useState([]);
    const [staleItems, setStaleItems] = useState([]); // last-good dataset for stale-while-revalidate
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, inProgress: 0, ready: 0, returned: 0,
        agingSummary: { attention: 0, overdue: 0, critical: 0, total: 0 },
    });

    // Incrementing this triggers a refetch without adding fetchItems to deps
    const [dataVersion, setDataVersion] = useState(0);
    const refetch = useCallback(() => setDataVersion((v) => v + 1), []);

    // ── Pagination ─────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(() => {
        try {
            const saved = parseInt(localStorage.getItem("chip_page_size"), 10);
            return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 10;
        } catch { return 10; }
    });

    const handlePageSizeChange = useCallback((newSize) => {
        setPageSize(newSize);
        setPage(1);
        try { localStorage.setItem("chip_page_size", String(newSize)); } catch { }
    }, []);

    const handlePageChange = useCallback((_event, value) => setPage(value), []);

    // ── Filters / Search ───────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("inProgress");

    const handleFilterChange = useCallback((filter) => {
        startTransition(() => {
            setActiveFilter(filter);
            setPage(1);
        });
    }, []);

    const [technicianFilter, setTechnicianFilter] = useState(() =>
        user?.role !== "admin" && user?.displayName ? user.displayName : "All"
    );
    const [techniciansList, setTechniciansList] = useState([]);

    // ── Sort ────────────────────────────────────────────────────────────
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [debouncedSortBy, setDebouncedSortBy] = useState("createdAt");
    const [debouncedSortOrder, setDebouncedSortOrder] = useState("desc");

    const handleSort = useCallback((property) => {
        setSortOrder((prev) => (sortBy === property && prev === "asc" ? "desc" : "asc"));
        setSortBy(property);
        setPage(1);
    }, [sortBy]);

    // ── Snackbar (shared across data + actions) ────────────────────────
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const handleCloseSnackbar = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);

    // ── Refs ────────────────────────────────────────────────────────────
    const searchInputRef = useRef(null);

    // ── Effects ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchUsers()
            .then((data) => { if (Array.isArray(data)) setTechniciansList(data); })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startTransition(() => {
                setDebouncedSearch(search);
                setPage(1);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSortBy(sortBy);
            setDebouncedSortOrder(sortOrder);
        }, 150);
        return () => clearTimeout(timer);
    }, [sortBy, sortOrder]);

    // ── SSE Live Updates ───────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        // The same token mechanism used by the API — cookies are sent automatically
        const es = new EventSource(`${API_BASE_URL}/api/items/events`, { withCredentials: true });

        const handleEvent = () => refetch();
        es.addEventListener("job:created", handleEvent);
        es.addEventListener("job:updated", handleEvent);
        es.addEventListener("job:deleted", handleEvent);
        es.addEventListener("job:bulk-updated", handleEvent);

        return () => es.close();
    }, [user, refetch]);

    // ── Main fetch ─────────────────────────────────────────────────────
    const fetchItems = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);

        fetchItemsApi({
            page, limit: pageSize,
            sortBy: debouncedSortBy, sortOrder: debouncedSortOrder,
            search: debouncedSearch,
            statusGroup: !debouncedSearch && activeFilter !== "all" ? activeFilter : "",
            technicianName: technicianFilter,
            includeMetadata: isAdmin,
            signal: controller.signal,
        })
            .then((data) => {
                const newItems = data.items || [];
                setItems(newItems);
                // Persist as stale for stale-while-revalidate UX
                if (newItems.length > 0) setStaleItems(newItems);
                setTotalPages(data.totalPages || 1);
                if (data.stats) setStats(data.stats);
                setLoading(false);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                console.error(err);
                setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
                setLoading(false);
            });

        return () => controller.abort();
    }, [debouncedSearch, page, activeFilter, debouncedSortBy, debouncedSortOrder, technicianFilter, isAdmin, pageSize]);

    useEffect(() => {
        const cancel = fetchItems();
        return cancel;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchItems, dataVersion]);

    // Stale-while-revalidate: display stale items at reduced opacity while loading
    const displayItems = loading && staleItems.length > 0 ? staleItems : items;

    return {
        // Data (prefer stale while reloading to avoid blank flash)
        items: displayItems, setItems, loading, stats,
        // Pagination
        page, setPage, totalPages, pageSize, PAGE_SIZE_OPTIONS, handlePageSizeChange, handlePageChange,
        // Filters
        search, setSearch, activeFilter, setActiveFilter, handleFilterChange,
        technicianFilter, setTechnicianFilter, techniciansList,
        // Sort
        sortBy, sortOrder, handleSort,
        // Snackbar
        snackbar, setSnackbar, handleCloseSnackbar,
        // Misc
        refetch, searchInputRef,
    };
}
