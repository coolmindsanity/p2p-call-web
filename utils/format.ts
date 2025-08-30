/**
 * Formats a duration in seconds into a MM:SS string.
 * @param timeInSeconds The total seconds to format.
 * @returns A string in the format "MM:SS".
 */
export const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

/**
 * Formats a UNIX timestamp into a human-readable, locale-aware string.
 * @param timestamp The timestamp (milliseconds since epoch) to format.
 * @returns A formatted date and time string (e.g., "Jan 1, 2024, 12:30 PM").
 */
export const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
