import { useState, useMemo } from 'react';
import {
  useGetAllImportHistories,
  useCountImportHistories,
} from '../api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';

export const useImportHistoryPagination = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: importHistories,
    isLoading,
    isError,
  } = useGetAllImportHistories({
    page,
    size: pageSize,
  });

  const { data: totalElements } = useCountImportHistories();

  const totalPages = useMemo(() => {
    if (totalElements === undefined) return 0;
    return Math.ceil(totalElements / pageSize);
  }, [totalElements, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    importHistories: importHistories || [],
    totalElements: totalElements || 0,
    totalPages,
    isLoading,
    isError,
  };
};
