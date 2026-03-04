// ROUTES, API_PATHS, ERROR_CODES, CONFIG,... thường nên là object as const
// Role, Status, Fixed Options,... thường là enum cho dễ đọc, dễ check.

export const ROUTES = {
  homePage: '/',
  signIn: '/signin',
  signUp: '/signup',
  user: '/user',
  rent: '/rent',
  buy: '/buy',
  sell: '/sell',
  favorited: '/favorited',
  appointments: '/appointments',
  myEngagements: '/my-engagements',
  dashboard: {
    root: '/dashboard',
    insight: '/dashboard/insight',
    listings: '/dashboard/listings',
    tenants: '/dashboard/tenants',
    messages: '/dashboard/messages',
  },
  settings: '/settings',
} as const;

export const CALLBACK_URL = 'callbackUrl';
