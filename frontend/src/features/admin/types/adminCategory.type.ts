export interface CategoryResponse {
  id: number;
  name: string;
  parentId?: number;
  slug?: string;
  description?: string;
  icon?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  parentId?: number;
  slug?: string;
  description?: string;
  icon?: string;
  status?: string;
}
