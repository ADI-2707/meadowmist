import { uploadAsset, deleteAsset, optimizeImage } from '@meadowmist/shared/storage';

export { optimizeImage };

export async function saveUploadedFile(file: File): Promise<string> {
  return uploadAsset(file, 'products');
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  return deleteAsset(fileUrl);
}
