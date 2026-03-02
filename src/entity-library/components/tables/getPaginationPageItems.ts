export type PaginationPageItem = number | 'ellipsis-start' | 'ellipsis-end';

export function getPaginationPageItems(
  page: number,
  maxPage: number,
  maxButtons = 5
): PaginationPageItem[] {
  if (maxPage <= maxButtons) return Array.from({ length: maxPage }, (_, i) => i + 1);

  const halfWindow = Math.floor(maxButtons / 2);
  let start = Math.max(1, page - halfWindow);
  const end = Math.min(maxPage, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

  const pages: PaginationPageItem[] = [];

  if (start > 1) {
    pages.push(1);

    if (start > 2) pages.push('ellipsis-start');
  }

  for (let i = start; i <= end; i++) pages.push(i);

  if (end < maxPage) {
    if (end < maxPage - 1) pages.push('ellipsis-end');
    pages.push(maxPage);
  }

  return pages;
}
