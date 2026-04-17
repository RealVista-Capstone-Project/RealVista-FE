import type { PropertyDetailResponse } from '../api/property-api.types';
import type { Property, PropertyImage } from '../model/property.types';

/**
 * Maps PropertyDetailResponse from API format (snake_case) to frontend Property model
 */
export function mapPropertyResponseToProperty(response: PropertyDetailResponse): Property {
  // Map media to PropertyImage
  const images: PropertyImage[] = (response.media || []).map((m) => ({
    id: m.media_id,
    url: m.media_url,
    thumbnailUrl: m.thumbnail_url || undefined,
    alt: `property-${response.property_id}-${m.media_id}`,
    type: m.media_type === 'VIDEO' ? 'video' : m.media_type === 'VIRTUAL_TOUR' ? '3d-tour' : 'photo',
    isPrimary: m.is_primary,
  }));

  // Build address (this is a simplification, in a real app we might fetch location names)
  const address = response.street_address;

  return {
    id: response.property_id,
    title: `Property in ${response.street_address}`, // Default title if not provided
    address: address,
    price: 0, // Properties themselves might not have a price until listed
    area: response.usable_size_m2 || response.land_size_m2 || 0,
    description: response.descriptions || '',
    images: images,
    amenities: (response.amenities || []).map((a) => ({
      amenity_id: a.amenity_id,
      amenity_name: a.amenity_name,
      amenity_type: '',
      is_onsite: true,
      is_offsite: false,
    })),
    attributes: (response.attributes || []).map((attr) => ({
      attribute_id: attr.attribute_id,
      attribute_code: attr.attribute_code,
      attribute_name: attr.attribute_name,
      data_type: attr.data_type as 'TEXT' | 'NUMBER' | 'BOOLEAN',
      icon: attr.icon || '',
      unit: attr.unit || '',
      value_number: attr.value_number || undefined,
      value_text: attr.value_text || undefined,
      value_boolean: attr.value_boolean || undefined,
      display_value: String(attr.value_number || attr.value_text || attr.value_boolean || ''),
      text: attr.data_type === 'TEXT',
      number: attr.data_type === 'NUMBER',
      boolean: attr.data_type === 'BOOLEAN',
    })),
    location: {
      lat: response.latitude,
      lng: response.longitude,
    },
    agent: {
      id: '', // Owner info could be added here if needed
      name: 'Owner',
      phone: '',
      email: '',
    },
    createdAt: '',
    updatedAt: '',
  };
}
