import { useMutation } from '@tanstack/react-query';
import { mediaApi } from './media.api';

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
      mediaApi.uploadMedia(file, folder),
  });
};

export const useUploadBulkMedia = () => {
  return useMutation({
    mutationFn: ({ files, folder, listingId }: { files: File[]; folder?: string; listingId?: string }) =>
      mediaApi.uploadBulkMedia(files, folder, undefined, listingId),
  });
};
