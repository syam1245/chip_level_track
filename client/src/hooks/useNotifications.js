/**
 * useNotifications — wraps the Web Notifications API.
 * Requests permission on first use and exposes a `notify(title, options)` helper.
 * Falls back silently if the browser doesn't support it or the user denies.
 */
import { useCallback, useEffect, useState } from "react";

export function useNotifications() {
    const [permission, setPermission] = useState(
        typeof Notification !== "undefined" ? Notification.permission : "denied"
    );

    const requestPermission = useCallback(async () => {
        if (typeof Notification === "undefined") return "denied";
        if (Notification.permission === "granted") return "granted";

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch {
            return "denied";
        }
    }, []);

    // Auto-request on mount so the toolbar can show a nudge if needed
    useEffect(() => {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            requestPermission();
        }
    }, [requestPermission]);

    /**
     * Show a browser notification.
     * @param {string} title
     * @param {NotificationOptions} options
     */
    const notify = useCallback(async (title, options = {}) => {
        if (typeof Notification === "undefined") return;

        let perm = Notification.permission;
        if (perm === "default") perm = await requestPermission();
        if (perm !== "granted") return;

        // Use service worker registration if available (required on some browsers)
        try {
            if (navigator.serviceWorker?.ready) {
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification(title, {
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                    ...options,
                });
            } else {
                // eslint-disable-next-line no-new
                new Notification(title, {
                    icon: "/favicon.ico",
                    ...options,
                });
            }
        } catch (err) {
            console.warn("[notify] Could not show notification:", err.message);
        }
    }, [requestPermission]);

    return { permission, notify, requestPermission };
}
