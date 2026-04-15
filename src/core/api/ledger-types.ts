export interface LedgerEntryInfo {
  entryDate?: string;
  documentType?: string;
  documentId?: number;
  referenceNo?: string;
  orderStatus?: number;
  paymentStatus?: number;
  debit?: number;
  credit?: number;
  balance?: number;
  documentPath?: string;
}

export interface LedgerSummaryInfo {
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;
  totalEntries?: number;
  paidEntries?: number;
  pendingEntries?: number;
}

export interface LedgerInfo {
  summary?: LedgerSummaryInfo;
  entries?: LedgerEntryInfo[];
}

export interface CustomerLedgerInfo extends LedgerInfo {
  customerId?: number;
  customerBusinessName?: string;
  email?: string;
  mobile?: string;
}

export interface SundryLedgerInfo extends LedgerInfo {
  sundryCreditorId?: number;
  creditorName?: string;
  email?: string;
  mobile?: string;
}
