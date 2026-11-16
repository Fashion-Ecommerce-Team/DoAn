export interface EmbeddingLogResponse {
  id: number;
  productId: number;
  imageId?: number | null;
  qdrantPointId?: string | null;
  modelVersion?: string | null;
  embeddingType?: string | null;
  status: string;
  needsResync: boolean;
  errorMessage?: string | null;
  syncedAt?: string | null;
  updatedAt?: string | null;
}

export interface EmbeddingStatus {
  totalProducts: number;
  syncedProducts: number;
  missingProducts: number;
  noImageProducts: number;
  needsResyncProducts: number;
  successPoints: number;
  failedPoints: number;
  pendingPoints: number;
  collection?: string;
  modelVersion?: string;
}

/** Dữ liệu thô từ Qdrant (result của GET /collections/{name}) */
export interface QdrantInfo {
  status?: string;
  points_count?: number;
  vectors_count?: number;
  indexed_vectors_count?: number;
  collection?: string;
  modelVersion?: string;
  error?: string;
  config?: {
    params?: {
      vectors?: { size?: number; distance?: string };
    };
  };
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobProgressResponse {
  jobId: string;
  type: string;
  status: JobStatus;
  total: number;
  processed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  percent: number;
  message?: string;
  createdAt?: string;
  finishedAt?: string | null;
}

export interface BatchSyncRequest {
  productIds?: number[];
  onlyMissing?: boolean;
}

export interface RetryFailedResult {
  totalRetried: number;
  success: number;
  failed: number;
}

export interface MissingEmbeddingProduct {
  id: number;
  name: string;
  slug?: string | null;
  categoryId?: number | null;
  brandId?: number | null;
  status?: string | null;
  createdAt?: string | null;
}
