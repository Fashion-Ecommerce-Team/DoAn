export interface BrandResponse {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  slug?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  status?: string;
}
