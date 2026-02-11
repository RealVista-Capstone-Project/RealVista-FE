'use client';

import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';

// Import icons statically for SSR compatibility
// These are tree-shaken by the bundler, so only used icons are included in the bundle
import {
  Bath,
  Bed,
  BookOpen,
  Baby,
  Bike as Bicycle,
  Briefcase,
  Building,
  Building2,
  Bus,
  Calendar,
  Car,
  CheckCircle,
  Coffee,
  DoorOpen,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartPulse,
  Home,
  Key,
  Layers,
  MapPin,
  Microwave,
  Minimize,
  MountainSnow,
  PawPrint,
  Plane,
  Shield,
  Sofa,
  Stethoscope,
  Sun,
  Store,
  Train,
  Tv,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Wrench,
  Zap,
  Maximize,
  Clock,
  Droplets,
  ShoppingBag,
  Beer,
} from 'lucide-react';

// Map icon names to Lucide icon components
const iconMap: Record<string, LucideIcon> = {
  // Property specifications
  Ruler: Minimize, // Fallback for Ruler since it doesn't exist in lucide-react
  Bed,
  Bath,
  CheckCircle,
  Wrench,
  Area: Maximize,

  // Building types
  Home,
  Building,
  Building2,

  // Location
  MapPin,

  // Time
  Calendar,
  Clock,

  // Amenities
  Car,
  Sofa,
  Microwave,
  Tv,
  Wifi,
  Wind,
  Droplets,
  Flame,
  Zap,
  Pool: Waves, // Fallback: Pool doesn't exist, use Waves
  Waves,

  // Features
  Layers,
  Maximize,
  Minimize,
  Users,
  Shield,
  Key,
  DoorOpen,

  // Surroundings
  Sun,
  Mountain: MountainSnow, // MountainSnow instead of Mountain

  // Nearby places
  Store,
  Utensils: UtensilsCrossed,
  Coffee,
  Restaurant: UtensilsCrossed,
  Bar: Beer,

  // Facilities
  Dumbbell,
  Gym: Dumbbell,
  Bike: Bicycle, // Bicycle instead of Bike
  Bicycle,

  // Transportation
  Briefcase,
  Train,
  Bus,
  Plane,
  Ship: Plane, // Fallback: Ship doesn't exist, use Plane

  // Education & Health
  GraduationCap,
  School: GraduationCap,
  BookOpen,
  Library: BookOpen,
  HeartPulse,
  Hospital: HeartPulse,
  Stethoscope,

  // Shopping & Family
  ShoppingBag,
  Mall: ShoppingBag,
  Baby,
  Playground: Baby,
  Pet: PawPrint,
  PawPrint,
};

export interface AttributeIconProps {
  iconName: string;
  className?: string;
  strokeWidth?: number;
}

/**
 * Dynamic icon component that renders Lucide icons by name
 * Fallback to a default icon if not found
 */
export const AttributeIcon = memo(function AttributeIcon({
  iconName,
  className = 'size-6',
  strokeWidth = 2,
}: AttributeIconProps) {
  // Normalize icon name (handle various formats like "ruler", "Ruler", "ruler-icon")
  const normalizedName = iconName
    .replace(/[-_]/g, '')
    .split(' ')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join('');

  const Icon = iconMap[normalizedName] || CheckCircle; // Fallback to CheckCircle

  return <Icon className={className} strokeWidth={strokeWidth} />;
});
