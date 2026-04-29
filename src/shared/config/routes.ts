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
  compare: '/compare',
  appointments: '/appointments',
  myContracts: '/my-contracts',
  dashboard: {
    root: '/dashboard',
    insight: '/dashboard/insight',
    managedListings: '/dashboard/listings',
    createListing: '/dashboard/listings/create',
    appointments: '/dashboard/appointments',
    myEngagements: '/dashboard/my-engagements',
    tenants: '/dashboard/tenants',
    rentalContracts: '/dashboard/rental-contracts',
    createRentalContract: '/dashboard/rental-contracts/create',
    myContracts: '/dashboard/my-contracts',
    messages: '/dashboard/messages',
    property: '/dashboard/property',
    manageAgent: '/dashboard/manage-agent',
    manageProposals: '/dashboard/manage-proposals',
    manageUsers: '/admin',
    managePackages: '/admin/manage-packages',
    agentDetail: (id: string) => `/dashboard/manage-agent/${id}`,
    propertyFeed: '/dashboard/property-feed',
    /** Agent-only dashboard profile & account settings */
    agentSetting: '/dashboard/setting',
    /** Agent CRM board */
    crm: '/dashboard/crm',
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
