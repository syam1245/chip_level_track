/**
 * Utility for handling WhatsApp redirects.
 */

/**
 * Sanitizes a phone number and opens WhatsApp with the provided text.
 * @param {string} rawPhoneNumber - The recipient's phone number.
 * @param {string} messageText - The text to pre-fill in the chat.
 */
export function openWhatsAppChat(rawPhoneNumber, messageText) {
    if (!rawPhoneNumber) {
        console.error("No phone number provided for WhatsApp redirect.");
        return;
    }

    // Strip everything but digits
    let cleanNumber = String(rawPhoneNumber).replace(/\D/g, "");

    // If the number is 10 digits and looks like a standard Indian mobile, prepend 91
    if (cleanNumber.length === 10 && !cleanNumber.startsWith("91")) {
        cleanNumber = `91${cleanNumber}`;
    }

    const encodedMessage = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    window.open(url, "_blank");
}
