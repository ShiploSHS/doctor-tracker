import { escapeRegex } from "./escapeRegex";

export const toTokens = (name: string): string[] =>
  name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export function buildSearchFilter(q?: string, includeEmail = false) {
  if (!q?.trim()) return {};
  const term = q.trim().toLowerCase();
  const prefix = (s: string) => new RegExp("^" + escapeRegex(s));
  const branches: Record<string, unknown>[] = [
    { nameTokens: { $all: term.split(/\s+/).map(prefix) } },
    { phone: prefix(term) },
  ];
  if (includeEmail) {
    branches.push({ email: prefix(term) });
  }
  return { $or: branches };
}
