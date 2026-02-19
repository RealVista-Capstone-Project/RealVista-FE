import { AdvancedSearchRequest, ListingSearchResponse, PageResponse } from '@/shared/types/search';

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
    console.log('🔍 Searching with:', { API_BASE_URL, request, page, size });

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
      if (request.bedrooms !== undefined && request.bedrooms !== null) {
        params.append('bedrooms', request.bedrooms.toString());
      }
      if (request.bathrooms !== undefined && request.bathrooms !== null) {
        params.append('bathrooms', request.bathrooms.toString());
      }

      // Dynamic attributes - use attr_ prefix
      // Check for any property that's not a standard filter
      const standardFilters = ['listingType', 'propertyType', 'propertyCategory', 'location',
                               'price', 'area', 'bedrooms', 'bathrooms', 'sortBy',
                               'hasVideo', 'has3D', 'page', 'size'];

      Object.entries(request).forEach(([key, value]) => {
        if (!standardFilters.includes(key) && value !== undefined && value !== null && value !== '') {
          // Convert to lowercase for backend (e.g., DIRECTION -> direction)
          const attrKey = key.toLowerCase();
          params.append(`attr_${attrKey}`, value.toString());
          console.log(`🔧 Adding dynamic attribute: attr_${attrKey}=${value}`);
        }
      });

      if (request.sortBy) params.append('sortBy', request.sortBy);

      const url = `${API_BASE_URL}/listings/search?${params.toString()}`;
      console.log('📡 GET:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Search successful:', data);
      console.log('📋 First listing:', data.content?.[0]);
      return data;
    } catch (error) {
      console.error('❌ Search error:', error);
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
        'Authorization': `Bearer ${token}`,
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
        'Authorization': `Bearer ${token}`,
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
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete saved search: ${response.statusText}`);
    }
  }
}
