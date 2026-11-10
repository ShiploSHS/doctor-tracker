export function buildDateRangeFilter(from?: string, to?: string) {
  if (!from && !to) return {};
  const createdAt: Record<string, Date> = {};
  if (from) {
    const start = new Date(from);
    start.setUTCHours(0, 0, 0, 0);
    if (!isNaN(start.getTime())) createdAt.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    if (!isNaN(end.getTime())) createdAt.$lte = end;
  }
  return Object.keys(createdAt).length ? { createdAt } : {};
}
