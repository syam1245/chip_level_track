export const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—'; // Guard against invalid dates
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear(); // 4-digit year — unambiguous
    return `${day}-${month}-${year}`;
};
