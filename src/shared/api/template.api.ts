import http from '@/shared/lib/http/http'
import { ApiResponse } from '@/shared/types/api'

export interface NotificationTemplate {
  template_id: string
  template_key: string
  name: string
  type: 'EMAIL' | 'IN_APP'
  language: string
  title?: string
  content_body: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateRequest {
  template_key: string
  name: string
  type: 'EMAIL' | 'IN_APP'
  language: string
  title?: string
  content_body: string
}

export interface UpdateTemplateRequest {
  name: string
  title?: string
  content_body: string
}

export const templateApi = {
  getAll: (page = 0, size = 10, keyword = '', type?: string) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('size', size.toString())
    if (keyword) params.append('keyword', keyword)
    if (type) params.append('type', type)
    return http.get<ApiResponse<any>>(`/admin/templates?${params.toString()}`).then((res) => res.payload?.data ?? { content: [], total_elements: 0 })
  },

  getById: (id: string) =>
    http.get<ApiResponse<NotificationTemplate>>(`/admin/templates/${id}`).then((res) => res.payload?.data ?? null),

  create: (data: CreateTemplateRequest) =>
    http.post<ApiResponse<NotificationTemplate>>('/admin/templates', data).then((res) => res.payload?.data ?? null),

  update: (id: string, data: Partial<UpdateTemplateRequest>) =>
    http.put<ApiResponse<NotificationTemplate>>(`/admin/templates/${id}`, data).then((res) => res.payload?.data ?? null),

  delete: (id: string) =>
    http.delete<ApiResponse<void>>(`/admin/templates/${id}`).then((res) => res.payload?.data ?? null),

  preview: (data: { title: string; content_body: string; mock_data?: Record<string, any> }) =>
    http.post<ApiResponse<{ title: string; body: string }>>('/admin/templates/preview', data).then((res) => res.payload?.data ?? null),

  getSchema: (templateKey: string) =>
    http.get<ApiResponse<{ variables: VariableDefinition[] }>>(`/admin/templates/schema/${templateKey}`).then((res) => res.payload?.data ?? { variables: [] }),

  testSend: (data: { type: string; title?: string; content_body: string; mock_data?: Record<string, any> }) =>
    http.post<ApiResponse<void>>('/admin/templates/test-send', data).then((res) => res.payload?.data ?? null),
}

export interface VariableDefinition {
  name: string;
  required: boolean;
  description: string;
}
