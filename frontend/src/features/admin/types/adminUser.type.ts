export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  roleId: number;
  updatedAt: string;
  createdAt: string;
}

export interface UserAddressResponse {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}
