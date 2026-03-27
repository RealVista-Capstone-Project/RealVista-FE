const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8080/api/v1';

export interface PolicyDto {
  policyId: string;
  title: string;
  slug: string;
  content: string;
  updatedAt: string;
}

export class PolicyAPI {
  /**
   * Fetch all policies
   */
  static async getAllPolicies(): Promise<PolicyDto[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/public/policies`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 } // Bypass cache during development
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching all policies:', error);
      return [];
    }
  }

  /**
   * Fetch a single policy by slug
   */
  static async getPolicyBySlug(slug: string): Promise<PolicyDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/public/policies/${slug}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 } // Bypass cache during development
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch policy detail: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`Error fetching policy by slug ${slug}:`, error);
      return null;
    }
  }
}
