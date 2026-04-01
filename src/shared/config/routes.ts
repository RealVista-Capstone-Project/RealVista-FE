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
  myEngagements: '/my-engagements',
  dashboard: {
    root: '/dashboard',
    insight: '/dashboard/insight',
    managedListings: '/dashboard/listings',
    tenants: '/dashboard/tenants',
    messages: '/dashboard/messages',
    manageAgent: '/dashboard/manage-agent',
    agentDetail: (id: string) => `/dashboard/manage-agent/${id}`
  },
  manageAgent: {
    root: '/manage-agent',
    detail: (id: string) => `/manage-agent/${id}`,
  },
  settings: '/settings',
} as const;

export const CALLBACK_URL = 'callbackUrl';
