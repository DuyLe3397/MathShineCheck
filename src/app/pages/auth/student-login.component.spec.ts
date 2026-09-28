import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StudentLoginComponent } from './student-login.component';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { Group, SchoolClass } from '../../models';

const classes = [{ id: 'l10', name: 'Toán 10' }] as SchoolClass[];
const groups = [{ id: 'n1b', name: 'Nhóm 1B' }] as Group[];

async function renderLogin() {
  const auth = {
    getStudentByInfo: jasmine.createSpy('getStudentByInfo').and.returnValue(of(null)),
    loginStudentAsGuest: jasmine.createSpy('loginStudentAsGuest'),
  };
  TestBed.configureTestingModule({
    imports: [StudentLoginComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      {
        provide: FirestoreService,
        useValue: { getClasses: () => of(classes), getGroupsByClass: () => of(groups) },
      },
    ],
  });
  const fixture = TestBed.createComponent(StudentLoginComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, auth, page: fixture.nativeElement as HTMLElement };
}

async function type(fixture: ComponentFixture<unknown>, selector: string, value: string) {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  await fixture.whenStable();
}

async function choose(fixture: ComponentFixture<unknown>, selector: string, label: string) {
  const select = fixture.nativeElement.querySelector(selector) as HTMLSelectElement;
  const option = Array.from(select.options).find((o) => o.textContent!.trim() === label)!;
  select.value = option.value;
  select.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

async function submit(fixture: ComponentFixture<unknown>) {
  (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('Trang đăng nhập học sinh — chuẩn hóa dữ liệu nhập', () => {
  it('tìm học sinh bằng họ tên và SĐT đã bỏ khoảng trắng thừa', async () => {
    const { fixture, auth } = await renderLogin();

    await type(fixture, '#fullName', '  nguyễn   trang  nhung ');
    await type(fixture, '#phone', ' 0853 434 156 ');
    await choose(fixture, '#className', 'Toán 10');
    await choose(fixture, '#groupId', 'Nhóm 1B');
    await submit(fixture);

    expect(auth.getStudentByInfo).toHaveBeenCalledOnceWith('NGUYỄN TRANG NHUNG', 'Toán 10', 'n1b', '0853434156');
  });

  it('báo lỗi và không tìm học sinh khi họ tên có số hoặc ký tự đặc biệt', async () => {
    const { fixture, auth, page } = await renderLogin();

    await type(fixture, '#fullName', 'Nguyễn Trang Nhung 2');
    await type(fixture, '#phone', '0853434156');
    await choose(fixture, '#className', 'Toán 10');
    await choose(fixture, '#groupId', 'Nhóm 1B');
    await submit(fixture);

    expect(auth.getStudentByInfo).not.toHaveBeenCalled();
    expect(page.querySelector('.error')?.textContent?.trim()).toBe('Họ tên chỉ gồm chữ cái và dấu cách.');
  });

  it('họ tên thấy được đã gọn lại ngay khi rời ô', async () => {
    const { fixture } = await renderLogin();

    await type(fixture, '#fullName', '  nguyễn   trang  nhung ');

    expect((fixture.nativeElement.querySelector('#fullName') as HTMLInputElement).value).toBe('NGUYỄN TRANG NHUNG');
  });
});
