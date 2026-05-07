export function normalizeTag(tag) {
    let t = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (t.endsWith('s') && t.length > 3) {
        t = t.slice(0, -1);
    }
    return t;
}
