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
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, inProgress: 0, ready: 0, returned: 0,
        agingSummary: { attention: 0, overdue: 0, critical: 0, total: 0 },
    });

    // staleItems holds the last successful dataset for stale-while-revalidate.
    // It is a ref (not state) because it never drives a render by itself —
    // it is only read during renders already triggered by `loading` or `items`
    // changing. Using useState here would cause a spurious extra render every
    // time a successful fetch came back with results.
    const staleItemsRef = useRef([]);

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
        !isAdmin && user?.displayName ? user.displayName : "All"
    );
    const [techniciansList, setTechniciansList] = useState([]);

    // ── Sort ────────────────────────────────────────────────────────────
    // Sort changes are discrete clicks, not continuous input — there is no
    // burst of events to absorb. The previous 150 ms debounce added latency
    // with no benefit, so sortBy/sortOrder are used directly in the fetch deps.
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

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

    // Ref that mirrors the current items array so the SSE handler can read
    // it without the handler being recreated on every render (which would
    // force EventSource teardown/reconnect on every state change).
    const itemsRef = useRef([]);
    useEffect(() => { itemsRef.current = items; }, [items]);

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

    // ── SSE Live Updates ───────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const es = new EventSource(`${API_BASE_URL}/api/items/events`, { withCredentials: true });

        // job:created / job:deleted / job:bulk-updated always require a full
        // refetch because they change pagination totals and stat counts.
        const handleFullRefetch = () => refetch();

        // job:updated only changes fields within an existing item.
        // If the updated item is not on the current page there is nothing to
        // show the user — skip the refetch entirely to avoid a redundant API
        // round-trip. If it IS on the current page, refetch to get fresh data.
        const handleUpdated = (e) => {
            try {
                const { id } = JSON.parse(e.data);
                const isVisible = itemsRef.current.some((item) => item._id === id);
                if (isVisible) refetch();
            } catch {
                // Malformed SSE payload — fall back to a safe full refetch.
                refetch();
            }
        };

        es.addEventListener("job:created",      handleFullRefetch);
        es.addEventListener("job:updated",       handleUpdated);
        es.addEventListener("job:deleted",       handleFullRefetch);
        es.addEventListener("job:bulk-updated",  handleFullRefetch);

        return () => es.close();
    // refetch is stable (useCallback with no deps) so this effect only runs
    // once per user session, keeping the EventSource connection alive.
    }, [user, refetch]);

    // ── Main fetch ─────────────────────────────────────────────────────
    const fetchItems = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);

        fetchItemsApi({
            page, limit: pageSize,
            sortBy, sortOrder,
            search: debouncedSearch,
            statusGroup: !debouncedSearch && activeFilter !== "all" ? activeFilter : "",
            technicianName: technicianFilter,
            includeMetadata: isAdmin,
            signal: controller.signal,
        })
            .then((data) => {
                const newItems = data.items || [];
                setItems(newItems);
                // Update the stale ref so the next loading flash shows the
                // most recent data rather than stale data from several fetches ago.
                if (newItems.length > 0) staleItemsRef.current = newItems;
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
    }, [debouncedSearch, page, activeFilter, sortBy, sortOrder, technicianFilter, isAdmin, pageSize]);

    useEffect(() => {
        const cancel = fetchItems();
        return cancel;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchItems, dataVersion]);

    // Stale-while-revalidate: show the last-good dataset at reduced opacity
    // while the next page loads, preventing a blank-table flash.
    const stale = staleItemsRef.current;
    const displayItems = loading && stale.length > 0 ? stale : items;

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