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
    managedListings: '/dashboard/listings',
    myEngagements: '/dashboard/my-engagements',
    tenants: '/dashboard/tenants',
    rentalContracts: '/dashboard/rental-contracts',
    createRentalContract: '/dashboard/rental-contracts/create',
    myContracts: '/dashboard/my-contracts',
    messages: '/dashboard/messages',
    property: '/dashboard/property',
    manageAgent: '/dashboard/manage-agent',
    manageProposals: '/dashboard/manage-proposals',
    agentDetail: (id: string) => `/dashboard/manage-agent/${id}`,
  },
  leases: {
    signingComplete: '/leases/signing-complete',
  },
  manageAgent: {
    root: '/manage-agent',
    detail: (id: string) => `/manage-agent/${id}`,
  },
  settings: '/settings',
  subscribe: '/subscribe',
} as const;

export const CALLBACK_URL = 'callbackUrl';
