export interface SettingPreference {
  setting_preference_id: string
  user_id: string
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
  contact_via_email: boolean
  contact_via_phone: boolean
  hide_phone_number: boolean
  hide_email: boolean
  created_at: string
  updated_at: string
}

export interface UpdateSettingPreferenceData {
  in_app_enabled?: boolean
  email_enabled?: boolean
  push_enabled?: boolean
  contact_via_email?: boolean
  contact_via_phone?: boolean
  hide_phone_number?: boolean
  hide_email?: boolean
}
