'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { AdvancedPagination } from './advanced-pagination';
import { FailedCallsHeader } from './failed-calls-header';
import { FailedCallsTableBody } from './failed-calls-table-body';
import { HEADERS, tableScrollStyles } from '../constants/failed-calls';
import { useFailedCallsTable } from '../hooks/use-failed-calls-table';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FailedCallsTable() {
  const {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    editableData,
    rowErrors,
    pendingRowIds,
    isLoading,
    totalItems,
    customerMap,
    productMap,
    computeInvalidFields,
    getComputedIssues,
    getColumnOptions,
    handleFieldChange,
    handleDownloadReport,
    handleClearAllFailedEntries,
    isClearing,
    isError,
    importHistoryError,
    refetchImportHistory,
    validatedRowCount,
    handleSaveValidatedRows,
    isBulkSaving,
  } = useFailedCallsTable();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Loading Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fetching the latest failed import rows from the backend.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const errorMessage =
      importHistoryError instanceof Error
        ? importHistoryError.message
        : 'Unable to load import history data.';

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Failed to Fetch Import History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <Button onClick={() => refetchImportHistory()} size="sm" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (editableData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            No Failed Import Rows in History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We could not find any import history records. Start a new import or check back later for
            results.
          </p>
        </CardContent>
      </Card>
    );
  }

  const headerMapping: { [key: string]: keyof ImportHistoryDTO } = {
    'Customer name': 'customerBusinessName',
    'Customer Phone Number': 'phoneNumber',
    'Zip Code': 'zipCode',
    'Product Name': 'productName',
    'Product Code': 'productCode',
    'External Id': 'externalId',
    'Call Type': 'callType',
    'Sub Call Type': 'subCallType',
    Priority: 'priority',
    'Call Status': 'callStatus',
    Remark: 'remark',
    Reason: 'issue',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
      <Card className="mt-6">
        <FailedCallsHeader
          totalItems={totalItems}
          hasRows={Boolean(editableData.length)}
          isClearing={isClearing}
          isLoading={isLoading}
          onDownloadReport={handleDownloadReport}
          onClearAllFailedEntries={handleClearAllFailedEntries}
          onSaveValidatedRows={handleSaveValidatedRows}
          validatedRowCount={validatedRowCount}
          isBulkSaving={isBulkSaving}
        />

        <CardContent>
          <FailedCallsTableBody
            headers={HEADERS}
            headerMapping={headerMapping}
            rows={editableData}
            rowErrors={rowErrors}
            pendingRowIds={pendingRowIds}
            computeInvalidFields={computeInvalidFields}
            getComputedIssues={getComputedIssues}
            getColumnOptions={getColumnOptions}
            onFieldChange={handleFieldChange}
            customerMap={customerMap}
            productMap={productMap}
          />
          <AdvancedPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageInput
            showItemsInfo
            showFirstLastButtons
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
}
