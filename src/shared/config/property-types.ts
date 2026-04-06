export type PropertyAttribute =
  | 'BEDROOMS'
  | 'BATHROOMS'
  | 'FLOOR'
  | 'TOTAL_FLOORS'
  | 'BALCONY'
  | 'DIRECTION'
  | 'AC'
  | 'GARDEN'
  | 'GARAGE'
  | 'FLOORS'
  | 'PARKING'
  | 'POOL'
  | 'TENNIS'
  | 'TOP_FLOOR'
  | 'LARGE_BALCONY'
  | 'VIEW'
  | 'GYM'
  | 'ROOMS'
  | 'WIFI'
  | 'KITCHEN'
  | 'OFFICE_ROOMS'
  | 'MEETING_ROOMS'
  | 'RESTROOMS'
  | 'INDIVIDUAL_AC'
  | 'RECEPTION'
  | 'ELEVATOR'
  | 'WIDTH'
  | 'DEPTH'
  | 'UPPER_BEDROOMS'
  | 'UPPER_BATHROOMS'
  | 'SHOP'
  | 'DISPLAY_WINDOW'
  | 'HIGH_TRAFFIC'
  | 'SHOPS'
  | 'CINEMA'
  | 'FOOD_COURT'
  | 'TABLES'
  | 'RESTAURANT_KITCHEN'
  | 'ROOMS_HOTEL'
  | 'STARS'
  | 'RESTAURANT'
  | 'HEIGHT'
  | 'TRUCK_PARKING'
  | 'GATES'
  | 'RAILWAY'
  | 'WATER'
  | 'POWER'
  | 'DRAINAGE'
  | 'ENTRANCES'
  | 'SECURITY'
  | 'COLD_STORAGE'
  | 'FRONTAGE'
  | 'LAND_DEPTH'
  | 'PLANNING'
  | 'PURPOSE'
  | 'HEIGHT_PLANNING'
  | 'ZONE'
  | 'CROP_TYPE'
  | 'WATER_SOURCE'
  | 'IRRIGATION'
  | 'ACCESS_ROAD'
  | 'LOADING_DOCKS'
  | 'CRANE';

export interface PropertyType {
  code: string;
  label: string; // Translation key suffix
  attributes: PropertyAttribute[];
}

export interface PropertyCategory {
  code: string;
  label: string; // Translation key suffix
  types: PropertyType[];
}

export const PROPERTY_TYPES: PropertyCategory[] = [
  {
    code: 'RESIDENTIAL',
    label: 'Bất động sản bán',
    types: [
      {
        code: 'APARTMENT',
        label: 'Căn hộ chung cư',
        attributes: [
          'BEDROOMS',
          'BATHROOMS',
          'FLOOR',
          'TOTAL_FLOORS',
          'BALCONY',
          'DIRECTION',
          'AC',
        ],
      },
      {
        code: 'HOUSE',
        label: 'Nhà riêng',
        attributes: [
          'BEDROOMS',
          'BATHROOMS',
          'FLOORS',
          'GARDEN',
          'GARAGE',
          'DIRECTION',
          'PARKING',
          'AC',
        ],
      },
      {
        code: 'VILLA',
        label: 'Biệt thự',
        attributes: [
          'BEDROOMS',
          'BATHROOMS',
          'GARDEN',
          'POOL',
          'TENNIS',
          'GARAGE',
          'PARKING',
          'DIRECTION',
        ],
      },
      {
        code: 'TOWNHOUSE',
        label: 'Nhà phố',
        attributes: ['BEDROOMS', 'BATHROOMS', 'FLOORS', 'GARDEN', 'GARAGE', 'DIRECTION'],
      },
      {
        code: 'PENTHOUSE',
        label: 'Penthouse',
        attributes: [
          'BEDROOMS',
          'BATHROOMS',
          'TOP_FLOOR',
          'LARGE_BALCONY',
          'VIEW',
          'POOL',
          'GYM',
          'DIRECTION',
        ],
      },
      {
        code: 'STUDIO',
        label: 'Studio',
        attributes: ['ROOMS', 'BATHROOMS', 'FLOOR', 'AC', 'WIFI', 'KITCHEN'],
      },
    ],
  },
  {
    code: 'COMMERCIAL',
    label: 'Bất động sản thương mại',
    types: [
      {
        code: 'OFFICE',
        label: 'Văn phòng',
        attributes: [
          'FLOOR',
          'PARKING',
          'MEETING_ROOMS',
          'AC',
          'ELEVATOR',
          'OFFICE_ROOMS',
          'RESTROOMS',
          'RECEPTION',
          'INDIVIDUAL_AC',
        ],
      },
      {
        code: 'SHOPHOUSE',
        label: 'Shophouse',
        attributes: ['WIDTH', 'DEPTH', 'UPPER_BEDROOMS', 'UPPER_BATHROOMS', 'SHOP', 'GARAGE'],
      },
      {
        code: 'RETAIL',
        label: 'Cửa hàng bán lẻ',
        attributes: ['WIDTH', 'DEPTH', 'DISPLAY_WINDOW', 'PARKING', 'HIGH_TRAFFIC'],
      },
      {
        code: 'MALL',
        label: 'Trung tâm thương mại',
        attributes: [
          'FLOORS',
          'SHOPS',
          'CINEMA',
          'FOOD_COURT',
          'PARKING',
          'ELEVATOR',
          'AC',
          'SECURITY',
        ],
      },
      {
        code: 'RESTAURANT',
        label: 'Nhà hàng',
        attributes: ['WIDTH', 'DEPTH', 'TABLES', 'PARKING', 'RESTAURANT_KITCHEN', 'AC'],
      },
      {
        code: 'HOTEL',
        label: 'Khách sạn',
        attributes: [
          'FLOORS',
          'ROOMS_HOTEL',
          'STARS',
          'POOL',
          'RESTAURANT',
          'GYM',
          'PARKING',
          'AC',
        ],
      },
    ],
  },
  {
    code: 'INDUSTRIAL',
    label: 'Bất động sản công nghiệp',
    types: [
      {
        code: 'FACTORY',
        label: 'Nhà xưởng',
        attributes: ['HEIGHT', 'POWER', 'OFFICE_ROOMS', 'PARKING', 'DRAINAGE', 'CRANE', 'SECURITY'],
      },
      {
        code: 'WAREHOUSE',
        label: 'Kho bãi',
        attributes: [
          'HEIGHT',
          'TRUCK_PARKING',
          'GATES',
          'RAILWAY',
          'WATER',
          'CRANE',
          'SECURITY',
          'LOADING_DOCKS',
        ],
      },
      {
        code: 'WORKSHOP',
        label: 'Xưởng sản xuất nhỏ',
        attributes: ['HEIGHT', 'POWER', 'GATES', 'PARKING', 'RESTROOMS', 'SECURITY'],
      },
      {
        code: 'LOGISTICS',
        label: 'Kho vận Logistics',
        attributes: [
          'HEIGHT',
          'ENTRANCES',
          'RAILWAY',
          'TRUCK_PARKING',
          'SECURITY',
          'COLD_STORAGE',
          'LOADING_DOCKS',
          'ELEVATOR',
          'AC',
        ],
      },
    ],
  },
  {
    code: 'LAND',
    label: 'Đất',
    types: [
      {
        code: 'LAND_RESIDENTIAL',
        label: 'Đất thổ cư',
        attributes: ['FRONTAGE', 'LAND_DEPTH', 'PLANNING', 'DIRECTION'],
      },
      {
        code: 'LAND_COMMERCIAL',
        label: 'Đất thương mại dịch vụ',
        attributes: ['FRONTAGE', 'LAND_DEPTH', 'PURPOSE', 'HEIGHT_PLANNING', 'DIRECTION'],
      },
      {
        code: 'LAND_INDUSTRIAL',
        label: 'Đất công nghiệp',
        attributes: ['FRONTAGE', 'LAND_DEPTH', 'ZONE', 'POWER', 'WATER', 'DIRECTION'],
      },
      {
        code: 'LAND_AGRICULTURAL',
        label: 'Đất nông nghiệp',
        attributes: ['CROP_TYPE', 'WATER_SOURCE', 'IRRIGATION', 'ACCESS_ROAD', 'DIRECTION'],
      },
    ],
  },
];

export const ATTRIBUTE_LABELS: Record<PropertyAttribute, string> = {
  BEDROOMS: 'Phòng ngủ',
  BATHROOMS: 'Phòng tắm',
  FLOOR: 'Tầng',
  TOTAL_FLOORS: 'Tổng tầng',
  BALCONY: 'Ban công',
  DIRECTION: 'Hướng',
  AC: 'Điều hòa',
  GARDEN: 'Sân vườn',
  GARAGE: 'Gara',
  FLOORS: 'Số tầng',
  PARKING: 'Đỗ xe',
  POOL: 'Hồ bơi',
  TENNIS: 'Sân Tennis',
  TOP_FLOOR: 'Tầng cao nhất',
  LARGE_BALCONY: 'Ban công lớn',
  VIEW: 'View',
  GYM: 'Gym',
  ROOMS: 'Số phòng',
  WIFI: 'Wifi',
  KITCHEN: 'Bếp',
  OFFICE_ROOMS: 'Phòng làm việc',
  MEETING_ROOMS: 'Phòng họp',
  RESTROOMS: 'Vệ sinh',
  INDIVIDUAL_AC: 'Điều hòa riêng',
  RECEPTION: 'Lễ tân',
  ELEVATOR: 'Thang máy',
  WIDTH: 'Rộng mặt tiền',
  DEPTH: 'Chiều sâu',
  UPPER_BEDROOMS: 'Phòng ngủ trên',
  UPPER_BATHROOMS: 'Phòng tắm trên',
  SHOP: 'Khu bán lẻ',
  DISPLAY_WINDOW: 'Cửa sổ trưng bày',
  HIGH_TRAFFIC: 'Lưu lượng cao',
  SHOPS: 'Số gian hàng',
  CINEMA: 'Rạp phim',
  FOOD_COURT: 'Khu ẩm thực',
  TABLES: 'Số bàn',
  RESTAURANT_KITCHEN: 'Bếp n.hàng',
  ROOMS_HOTEL: 'Phòng k.sạn',
  STARS: 'Số sao',
  RESTAURANT: 'Nhà hàng',
  HEIGHT: 'Chiều cao trần',
  TRUCK_PARKING: 'Đỗ xe tải',
  GATES: 'Số cổng',
  RAILWAY: 'Đường sắt',
  WATER: 'Nguồn nước',
  POWER: 'Nguồn điện',
  DRAINAGE: 'Thoát nước',
  ENTRANCES: 'Lối đi',
  SECURITY: 'Bảo vệ',
  COLD_STORAGE: 'Kho lạnh',
  FRONTAGE: 'Mặt tiền',
  LAND_DEPTH: 'Chiều sâu đất',
  PLANNING: 'Quy hoạch',
  PURPOSE: 'Mục đích',
  HEIGHT_PLANNING: 'Q.hoạch chiều cao',
  ZONE: 'Phân khu',
  CROP_TYPE: 'Cây trồng',
  WATER_SOURCE: 'Nước tưới',
  IRRIGATION: 'Tưới tiêu',
  ACCESS_ROAD: 'Đường vào',
  LOADING_DOCKS: 'Bến bãi',
  CRANE: 'Cần trục',
};

export const ATTRIBUTE_TYPES: Record<PropertyAttribute, 'number' | 'boolean' | 'text'> = {
  BEDROOMS: 'number',
  BATHROOMS: 'number',
  FLOOR: 'number',
  TOTAL_FLOORS: 'number',
  BALCONY: 'boolean',
  DIRECTION: 'text',
  AC: 'boolean',
  GARDEN: 'boolean',
  GARAGE: 'boolean',
  FLOORS: 'number',
  PARKING: 'number',
  POOL: 'boolean',
  TENNIS: 'boolean',
  TOP_FLOOR: 'boolean',
  LARGE_BALCONY: 'boolean',
  VIEW: 'text',
  GYM: 'boolean',
  ROOMS: 'text',
  WIFI: 'boolean',
  KITCHEN: 'boolean',
  OFFICE_ROOMS: 'number',
  MEETING_ROOMS: 'number',
  RESTROOMS: 'number',
  INDIVIDUAL_AC: 'boolean',
  RECEPTION: 'boolean',
  ELEVATOR: 'boolean',
  WIDTH: 'number',
  DEPTH: 'number',
  UPPER_BEDROOMS: 'number',
  UPPER_BATHROOMS: 'number',
  SHOP: 'boolean',
  DISPLAY_WINDOW: 'boolean',
  HIGH_TRAFFIC: 'boolean',
  SHOPS: 'number',
  CINEMA: 'boolean',
  FOOD_COURT: 'boolean',
  TABLES: 'number',
  RESTAURANT_KITCHEN: 'boolean',
  ROOMS_HOTEL: 'number',
  STARS: 'number',
  RESTAURANT: 'boolean',
  HEIGHT: 'number',
  TRUCK_PARKING: 'number',
  GATES: 'number',
  RAILWAY: 'boolean',
  WATER: 'boolean',
  POWER: 'text',
  DRAINAGE: 'boolean',
  ENTRANCES: 'number',
  SECURITY: 'boolean',
  COLD_STORAGE: 'boolean',
  FRONTAGE: 'number',
  LAND_DEPTH: 'number',
  PLANNING: 'text',
  PURPOSE: 'text',
  HEIGHT_PLANNING: 'text',
  ZONE: 'text',
  CROP_TYPE: 'text',
  WATER_SOURCE: 'text',
  IRRIGATION: 'boolean',
  ACCESS_ROAD: 'text',
  LOADING_DOCKS: 'number',
  CRANE: 'boolean',
};
