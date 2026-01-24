export interface Property {
  id: string;
  image: string;
  title: string;
  address: string;
  price: number;
  beds: number;
  bathrooms: number;
  area: number;
  areaUnit: string;
  isPopular?: boolean;
}
