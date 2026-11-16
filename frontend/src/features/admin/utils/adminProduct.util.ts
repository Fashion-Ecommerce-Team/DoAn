export const GENDER_OPTIONS = [
  { value: 'MEN', label: 'Nam' },
  { value: 'WOMEN', label: 'Nữ' },
  { value: 'BOYS', label: 'Bé trai' },
  { value: 'GIRLS', label: 'Bé gái' },
  { value: 'UNISEX', label: 'Unisex (Nam & Nữ)' },
] as const;

/** Chuẩn hóa giá trị cũ (MALE/FEMALE) về giá trị chuẩn của dữ liệu (MEN/WOMEN) */
export const normalizeGender = (g?: string | null): string => {
  const v = String(g ?? '').trim().toUpperCase();
  if (v === 'MALE') return 'MEN';
  if (v === 'FEMALE') return 'WOMEN';
  return v;
};

export const getGenderLabel = (g?: string | null): string => {
  const v = normalizeGender(g);
  return GENDER_OPTIONS.find((o) => o.value === v)?.label.replace(' (Nam & Nữ)', '') ?? (v || '---');
};
