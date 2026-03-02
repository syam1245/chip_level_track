/**
 * useKeyboardShortcuts — centralised keyboard shortcut handler.
 *
 * Binds shortcuts globally (on `document`) and auto-cleans on unmount.
 * Ignores events when the user is typing in an input, textarea, or contenteditable,
 * except for Escape which always works.
 *
 * @param {Object}  shortcuts  — map of key combos to handler functions
 * @param {boolean} enabled    — master toggle (default true)
 *
 * Key format examples:
 *   "n"            — plain key
 *   "Escape"       — special key
 *   "ArrowDown"    — arrow key
 *   "shift+/"      — Shift + /  (i.e. "?")
 *   "ctrl+k"       — Ctrl + K
 */
import { useEffect, useCallback, useRef } from "react";

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(shortcuts, enabled = true) {
    // Use ref so the handler always sees the latest shortcuts without re-binding
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    const handler = useCallback((e) => {
        const tag = e.target?.tagName;
        const isEditable = e.target?.isContentEditable;
        const isInput = INPUT_TAGS.has(tag) || isEditable;

        // Parse the event into a key combo string
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push("ctrl");
        if (e.altKey) parts.push("alt");
        if (e.shiftKey) parts.push("shift");

        let key = e.key;
        // Normalise to lowercase for letter keys
        if (key.length === 1) key = key.toLowerCase();
        parts.push(key);

        const combo = parts.join("+");

        // Check all registered shortcuts
        const current = shortcutsRef.current;

        // Try exact combo first, then just the key (for simple shortcuts)
        const match = current[combo] || (parts.length === 1 ? current[key] : null);

        // Also try shift+key for things like "?" = shift+/
        if (!match && e.shiftKey && !e.ctrlKey && !e.altKey) {
            const shiftCombo = `shift+${key}`;
            const shiftMatch = current[shiftCombo];
            if (shiftMatch) {
                // Escape always fires; other shortcuts only outside inputs
                if (key === "Escape" || !isInput) {
                    e.preventDefault();
                    shiftMatch(e);
                }
                return;
            }
        }

        if (!match) return;

        // Escape always fires (for closing dialogs), others only outside inputs
        if (key !== "Escape" && isInput) return;

        e.preventDefault();
        match(e);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [enabled, handler]);
}
