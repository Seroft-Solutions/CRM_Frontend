import type {
  AssignSalesmanPayload,
  AssignSalesmanResponse,
  ManageSalesmanResponse,
} from '@/features/manage-salesman/types';

class ManageSalesmanService {
  private readonly baseUrl = '/api/keycloak/organizations';

  async getManageSalesmanData(organizationId: string): Promise<ManageSalesmanResponse> {
    const response = await fetch(`${this.baseUrl}/${organizationId}/sales-manager-assignments`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch sales manager assignments');
    }

    return data;
  }

  async assignSalesmen(payload: AssignSalesmanPayload): Promise<AssignSalesmanResponse> {
    const response = await fetch(
      `${this.baseUrl}/${payload.organizationId}/sales-manager-assignments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: payload.action || 'assign',
          managerUserId: payload.managerUserId,
          salesmanUserIds: payload.salesmanUserIds,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          (payload.action === 'unassign'
            ? 'Failed to unassign salesman'
            : 'Failed to assign salesman')
      );
    }

    return data;
  }
}

export const manageSalesmanService = new ManageSalesmanService();
