export interface CustomerProfile {
  customer_profile_id: string
  user_id: string
  profile_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCustomerProfileData {
  profile_name: string
}
