import http from '@/shared/lib/http';

export interface AIAnalysisResult {
  analysis?: {
    lightingScore: number;
    compositionScore: number;
    clarityScore: number;
    listingRelevance: string;
    feedback: string;
  };
  finalScore?: number;
  currentStep?: string;
  listingId?: string;
  imageUrl?: string;
}

export interface ListingVerificationResponse {
  isValid: boolean;
  safetyScore: number;
  professionalismScore: number;
  clarityScore: number;
  identifiedFeatures: string[];
  feedback: string;
  currentStep: string;
}

export const aiAnalysisApi = {
  analyzeImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Call our internal Next.js API proxy
    return http.post<AIAnalysisResult>('/api/ai/analyze', formData, {
      baseUrl: '', // Empty baseUrl means internal call in Next.js
    });
  },
  verifyListing: (data: { title: string; description: string; listingId?: string }) => {
    return http.post<ListingVerificationResponse>('/api/ai/verify-listing', data, {
      baseUrl: '',
    });
  },
};
