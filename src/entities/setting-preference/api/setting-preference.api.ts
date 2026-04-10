import http from '@/shared/lib/http'
import type { ApiResponse } from '@/shared/types/api'
import type { SettingPreference, UpdateSettingPreferenceData } from '../model/types'

export const settingPreferenceApi = {
  get: () => http.get<ApiResponse<SettingPreference>>('/me/settings'),
  update: (data: UpdateSettingPreferenceData) => http.put<ApiResponse<SettingPreference>>('/me/settings', data),
} as const
