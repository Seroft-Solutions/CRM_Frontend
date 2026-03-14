export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  showTotalCount?: boolean;
  showPageSizeSelector?: boolean;
  strategy?: 'offset' | 'cursor';
}
