/** Chuẩn hóa SĐT nhập vào: chỉ giữ chữ số. Không ép độ dài vì có SĐT ngắn đang lưu. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Họ tên (đã chuẩn hóa) chỉ gồm chữ cái, kể cả chữ có dấu, và dấu cách giữa các từ. */
export function isValidStudentName(name: string): boolean {
  return /^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$/u.test(name);
}

/** Chuẩn hóa họ tên học sinh nhập vào: gọn khoảng trắng, dấu tiếng Việt dựng sẵn (NFC), viết hoa. */
export function normalizeStudentName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase();
}
