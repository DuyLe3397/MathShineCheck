import { rememberTeacherReturnUrl, takeTeacherReturnUrl } from './auth.guard';

describe('teacher return url (link trong Email thông báo)', () => {
  afterEach(() => sessionStorage.clear());

  it('trả lại đúng trang giáo viên đã nhớ, kèm query', () => {
    rememberTeacherReturnUrl('/teacher/grade/sub1?comment=2');
    expect(takeTeacherReturnUrl()).toBe('/teacher/grade/sub1?comment=2');
  });

  it('chỉ dùng một lần', () => {
    rememberTeacherReturnUrl('/teacher/discussions?discussion=d1&reply=r1');
    takeTeacherReturnUrl();
    expect(takeTeacherReturnUrl()).toBeNull();
  });

  it('bỏ qua đường dẫn ngoài khu giáo viên', () => {
    rememberTeacherReturnUrl('https://evil.example/teacher/');
    expect(takeTeacherReturnUrl()).toBeNull();
    rememberTeacherReturnUrl('/student/home');
    expect(takeTeacherReturnUrl()).toBeNull();
  });
});
