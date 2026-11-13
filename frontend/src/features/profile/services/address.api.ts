import apiClient from '@/config/axios';

export interface AddressItem {
  id: number;
  userId?: number;
  receiverName: string;
  receiverPhone: string;
  province?: string;
  city?: string;
  district?: string;
  ward?: string;
  streetAddress?: string;
  addressLine?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AddressPayload {
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  city: string;
  district: string;
  ward: string;
  isDefault?: boolean;
}

export const addressApi = {
  getUserAddresses: async (): Promise<AddressItem[]> => {
    const res = await apiClient.get<{ message: string; data: AddressItem[] }>('/addresses');
    return res.data.data || [];
  },

  getAddressById: async (id: number): Promise<AddressItem> => {
    const res = await apiClient.get<{ message: string; data: AddressItem }>(`/addresses/${id}`);
    return res.data.data;
  },

  createAddress: async (data: AddressPayload): Promise<AddressItem> => {
    const res = await apiClient.post<{ message: string; data: AddressItem }>('/addresses', data);
    return res.data.data;
  },

  updateAddress: async (id: number, data: AddressPayload): Promise<AddressItem> => {
    const res = await apiClient.put<{ message: string; data: AddressItem }>(`/addresses/${id}`, data);
    return res.data.data;
  },

  deleteAddress: async (id: number): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefaultAddress: async (id: number): Promise<AddressItem> => {
    const res = await apiClient.patch<{ message: string; data: AddressItem }>(`/addresses/${id}/default`);
    return res.data.data;
  },
};

