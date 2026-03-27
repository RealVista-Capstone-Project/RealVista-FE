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

export const aiAnalysisApi = {
  analyzeImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Call our internal Next.js API proxy
    return http.post<AIAnalysisResult>('/api/ai/analyze', formData, {
      baseUrl: '', // Empty baseUrl means internal call in Next.js
    });
  },
};
