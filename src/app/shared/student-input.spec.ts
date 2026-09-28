import { isValidStudentName, normalizePhone, normalizeStudentName } from './student-input';

describe('isValidStudentName', () => {
  it('chấp nhận họ tên chỉ gồm chữ cái tiếng Việt và dấu cách', () => {
    expect(isValidStudentName('NGUYỄN TRANG NHUNG')).toBeTrue();
    expect(isValidStudentName('ĐẶNG TRẦN DIỆU ANH')).toBeTrue();
  });

  it('từ chối họ tên có số hoặc ký tự đặc biệt', () => {
    expect(isValidStudentName('NGUYỄN TRANG NHUNG 2')).toBeFalse();
    expect(isValidStudentName('NGUYỄN.TRANG')).toBeFalse();
    expect(isValidStudentName('NHUNG@')).toBeFalse();
  });

  it('từ chối họ tên rỗng', () => {
    expect(isValidStudentName('')).toBeFalse();
  });
});

describe('normalizePhone', () => {
  it('bỏ mọi ký tự không phải số, kể cả khoảng trắng, dấu chấm, gạch', () => {
    expect(normalizePhone(' 0853 434.156 ')).toBe('0853434156');
    expect(normalizePhone('0853-434-156')).toBe('0853434156');
  });

  it('không ép độ dài: số ngắn đang lưu vẫn giữ nguyên', () => {
    expect(normalizePhone('14822')).toBe('14822');
  });
});

describe('normalizeStudentName', () => {
  it('bỏ khoảng trắng đầu, cuối và gộp khoảng trắng giữa thành một dấu cách', () => {
    expect(normalizeStudentName('   NGUYỄN    TRANG \t NHUNG  ')).toBe('NGUYỄN TRANG NHUNG');
  });

  it('viết hoa', () => {
    expect(normalizeStudentName('nguyễn trang nhung')).toBe('NGUYỄN TRANG NHUNG');
  });

  it('đưa chữ có dấu gõ tách rời (E + dấu) về dạng dựng sẵn để khớp dữ liệu đã lưu', () => {
    const decomposed = 'NGUYỄN'; // "NGUYỄN" gõ bằng ký tự tổ hợp
    expect(normalizeStudentName(decomposed)).toBe('NGUYỄN');
    expect(normalizeStudentName(decomposed).length).toBe(6);
  });
});
