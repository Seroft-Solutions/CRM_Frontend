export interface SalesUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
  fullName: string;
}

export interface SalesManagerWithAssignments extends SalesUser {
  assignedGroupId?: string;
  assignedGroupName?: string;
  assignedSalesmen: SalesUser[];
}

export interface ManageSalesmanResponse {
  salesManagerGroup: {
    id: string;
    name: string;
    path?: string;
  };
  salesManagers: SalesManagerWithAssignments[];
  availableSalesmen: SalesUser[];
}

export interface AssignSalesmanPayload {
  organizationId: string;
  managerUserId: string;
  salesmanUserIds: string[];
  action?: 'assign' | 'unassign';
}

export interface AssignSalesmanResponse {
  success: boolean;
  message: string;
  action?: 'assign' | 'unassign';
  managerGroup: {
    id: string;
    name: string;
  } | null;
  assignedUserIds: string[];
  unassignedUserIds?: string[];
  failedAssignments: Array<{ userId: string; error: string }>;
}
