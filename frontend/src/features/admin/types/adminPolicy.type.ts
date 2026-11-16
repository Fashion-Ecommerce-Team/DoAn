export type PolicyCategory = 'RETURN' | 'WARRANTY' | 'SHIPPING' | 'PAYMENT' | 'GENERAL';

export type PolicyEmbeddingStatus = 'PENDING' | 'SYNCED' | 'PARTIAL' | 'FAILED';

export interface PolicyChunkResponse {
  id: number;
  documentId: number;
  chunkText: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  qdrantPointId?: string;
  isEmbedded: boolean;
  createdAt?: string;
}

export interface PolicyDocumentResponse {
  id: number;
  title: string;
  slug: string;
  content: string;
  fileName?: string | null;
  fileUrl?: string | null;
  category: string;
  version: number;
  isActive: boolean;
  chunkCount: number;
  embeddingStatus: PolicyEmbeddingStatus;
  needsResync?: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt?: string;
  chunks?: PolicyChunkResponse[];
}

export interface PolicyDocumentRequest {
  title: string;
  category?: string;
  content?: string;
  isActive?: boolean;
}
