import { uploadAsset, deleteAsset } from '@meadowmist/shared';

export async function saveReviewPhoto(file: File): Promise<string> {
  return uploadAsset(file, 'reviews');
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  return deleteAsset(fileUrl);
}
