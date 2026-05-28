/** Дата в формате ru-RU (без времени). */
export function formatDateOnly(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('ru-RU').format(parsed);
}

/** Дата и время: «31.05.2026, 14:30». */
export function formatDateTime(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    const date = new Intl.DateTimeFormat('ru-RU').format(parsed);
    const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(parsed);
    return `${date}, ${time}`;
}
