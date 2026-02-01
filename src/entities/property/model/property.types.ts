/**
 * Property entity types
 */

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  images: PropertyImage[];
  amenities: string[];
  location: {
    lat: number;
    lng: number;
  };
  agent: Agent;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string; // Optional thumbnail for video/3D tour previews
  alt: string;
  type: 'photo' | '3d-tour' | 'video';
  isPrimary: boolean;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
}

export interface PropertyDetailProps {
  property: Property;
}
