/**
 * Format a display name with proper title case
 * Converts "DEBBIE YOUNG" → "Debbie Young"
 * Converts "debbie young" → "Debbie Young"
 * Converts "dEbBiE" → "Debbie"
 */
export function formatDisplayName(name: string | undefined | null): string {
    if (!name) return 'Agent';

    // Special case for DeBbIE -> Debbie
    if (name.toLowerCase() === 'debbie') {
        return 'Debbie';
    }

    return name
        .toLowerCase()
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get first name only from full name, formatted
 * Converts "Debbie Young" → "Debbie"
 * Converts "john michael smith" → "John"
 */
export function getFirstName(name: string | undefined | null): string {
    if (!name) return 'Agent';

    const formatted = formatDisplayName(name);
    return formatted.split(' ')[0];
}
