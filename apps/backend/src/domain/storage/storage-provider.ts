// Interface only — implemented by infrastructure/storage/cloudinary-storage-provider.ts
// (not yet built). Mirrors the PaymentProvider pattern from ADR-001: no
// call site depends on Cloudinary directly, so adding S3/Azure/GCS later
// is an additive infrastructure module, not a business-logic change.
export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
}

export interface StorageProvider {
  upload(input: { buffer: Buffer; folder: string; filename: string }): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
