import { AdvancedSearchRequest, ListingSearchResponse, PageResponse } from '@/shared/types/search';
import { getAuthToken } from '@/shared/lib/auth/get-auth-token';

// Configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8080/api/v1';

export class SearchAPI {
  /**
   * Perform advanced search for listings
   */
  static async searchListings(
    request: AdvancedSearchRequest,
    page: number = 0,
    size: number = 12
  ): Promise<PageResponse<ListingSearchResponse>> {
    try {
      // Build query params from request
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());

      // Add search filters if provided
      if (request.listingType) params.append('listingType', request.listingType);
      if (request.propertyType) params.append('propertyType', request.propertyType);
      if (request.propertyCategory) params.append('propertyCategory', request.propertyCategory);
      if (request.location) params.append('location', request.location);
      if (request.locationId) params.append('locationId', request.locationId);

      // Price range
      if (request.price && request.price.length === 2) {
        if (request.price[0]) params.append('minPrice', request.price[0].toString());
        if (request.price[1]) params.append('maxPrice', request.price[1].toString());
      }

      // Area range
      if (request.area && request.area.length === 2) {
        if (request.area[0]) params.append('minArea', request.area[0].toString());
        if (request.area[1]) params.append('maxArea', request.area[1].toString());
      }

      // Standard property filters
      // (bedrooms and bathrooms are now sent via dynamicAttributes)

      // Dynamic attributes - send as attr_KEY=value (e.g. attr_bathrooms=4:)
      if (request.dynamicAttributes && Object.keys(request.dynamicAttributes).length > 0) {
        Object.entries(request.dynamicAttributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(`attr_${key.toLowerCase()}`, value.toString());
          }
        });
      }

      if (request.sortBy) params.append('sortBy', request.sortBy);
      if (request.hasVideo) params.append('hasVideo', 'true');
      if (request.has3D) params.append('has3D', 'true');

      const url = `${API_BASE_URL}/listings/search?${params.toString()}`;

      const token = await getAuthToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Save a search for later use
   */
  static async saveSearch(
    request: AdvancedSearchRequest,
    name: string,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/saved-searches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...request, name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save search: ${response.statusText}`);
    }
  }

  /**
   * Get all saved searches for the current user
   */
  static async getSavedSearches(token: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/saved-searches`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch saved searches: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a saved search
   */
  static async deleteSavedSearch(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/saved-searches/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete saved search: ${response.statusText}`);
    }
  }
}
