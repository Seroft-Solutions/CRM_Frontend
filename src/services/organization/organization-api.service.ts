export interface UserOrganization {
  id: string
  name: string
  alias?: string
  enabled?: boolean
  description?: string
}

export interface UserOrganizationsResponse {
  organizations: UserOrganization[]
  count: number
  userId: string
  message: string
}

export class OrganizationApiService {
  private baseUrl: string

  constructor(baseUrl: string = '/api/keycloak') {
    this.baseUrl = baseUrl
  }

  /**
   * Fetch organizations for the current user
   */
  async getUserOrganizations(): Promise<UserOrganization[]> {
    try {
      const response = await fetch(`${this.baseUrl}/me/organizations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: UserOrganizationsResponse = await response.json()
      return data.organizations || []
    } catch (error) {
      console.error('Failed to fetch user organizations:', error)
      throw new Error('Failed to fetch organizations')
    }
  }
}

// Export singleton instance
export const organizationApiService = new OrganizationApiService()
