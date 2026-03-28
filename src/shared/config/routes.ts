// ROUTES, API_PATHS, ERROR_CODES, CONFIG,... thường nên là object as const
// Role, Status, Fixed Options,... thường là enum cho dễ đọc, dễ check.

export const ROUTES = {
  homePage: '/',
  login: '/login',
  register: '/register',
  signIn: '/signin',
  signUp: '/signup',
  user: '/user',
  rent: '/rent',
  buy: '/buy',
  sell: '/sell',
  favorited: '/favorited',
  appointments: '/appointments',
  dashboard: {
    root: '/dashboard',
    insight: '/dashboard/insight',
    listings: '/dashboard/listings',
    tenants: '/dashboard/tenants',
    messages: '/dashboard/messages',
    property: '/dashboard/property',
  },
  settings: '/settings',
} as const;

export const CALLBACK_URL = 'callbackUrl';
