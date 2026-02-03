/**
 * Property entity types
 */

import type { Attribute } from '@/entities/listing';

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  description: string;
  images: PropertyImage[];
  amenities: string[];
  attributes: Attribute[]; // Optional: for dynamic property specifications from backend
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
