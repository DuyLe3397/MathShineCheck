import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AssignmentDetailComponent } from './assignment-detail.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Assignment, Grade, Student, Submission } from '../../models';

const assignment: Assignment = {
  id: 'bt1',
  groupId: 'nhom1',
  title: 'Bài tập phân số',
  sessionDate: '2026-09-20',
  description: '',
  createdBy: 'gv1',
  createdAt: '2026-09-19',
};

function student(uid: string, fullName: string): Student {
  return { uid, fullName } as Student;
}

function submission(id: string, studentId: string, attemptNumber: number): Submission {
  return {
    id,
    assignmentId: 'bt1',
    studentId,
    imageIds: [],
    attemptNumber,
    status: 'submitted',
    submittedAt: '2026-09-21',
  };
}

function grade(submissionId: string, studentId: string, scoreValue: number, comment: string): Grade {
  return {
    id: 'g-' + submissionId,
    submissionId,
    studentId,
    assignmentId: 'bt1',
    scoreValue,
    comment,
    gradedBy: 'gv1',
    gradedAt: '2026-09-22',
  };
}

async function renderPage(students: Student[], submissions: Submission[], grades: Grade[]) {
  const firestore = {
    getAssignment: async () => assignment,
    getStudentsByGroup: () => of(students),
    getSubmissionsByAssignment: () => of(submissions),
    getGradeBySubmission: (id: string) => of(grades.find((g) => g.submissionId === id) ?? null),
  };

  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'teacher/assignments/:id', component: AssignmentDetailComponent }]),
      { provide: FirestoreService, useValue: firestore },
      { provide: AuthService, useValue: { currentProfile: { fullName: 'Cô Lan', subject: 'Toán' } } },
    ],
  });
  // Chuông thông báo tự đọc Firestore riêng; không thuộc phạm vi trang này.
  TestBed.overrideComponent(AssignmentDetailComponent, {
    set: { imports: [CommonModule, FormsModule, RouterModule], schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/teacher/assignments/bt1', AssignmentDetailComponent);
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
  return harness.routeNativeElement as HTMLElement;
}

/** Đọc bảng bài nộp thành các dòng { tên, lần nộp, nhận xét chung }. */
function readRows(page: HTMLElement) {
  const headers = Array.from(page.querySelectorAll('table thead th')).map((th) => th.textContent!.trim());
  const commentCol = headers.indexOf('Nhận xét chung');
  expect(commentCol).withContext('có cột Nhận xét chung').toBeGreaterThan(-1);
  expect(headers[commentCol - 1]).withContext('cột nằm ngay sau cột Điểm').toBe('Điểm');

  return Array.from(page.querySelectorAll('table tbody tr')).map((tr) => {
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent!.trim());
    return { name: cells[0], attempt: cells[1], comment: cells[commentCol] };
  });
}

describe('Trang chi tiết bài tập — cột Nhận xét chung', () => {
  it('mỗi Lần nộp đã chấm hiện Nhận xét chung của đúng lần đó', async () => {
    const page = await renderPage(
      [student('hs1', 'Nguyễn An')],
      [submission('s1', 'hs1', 1), submission('s2', 'hs1', 2)],
      [grade('s1', 'hs1', 6, 'Sai dấu ở câu 2'), grade('s2', 'hs1', 9, 'Đã sửa đúng, trình bày gọn')],
    );

    expect(readRows(page)).toEqual([
      { name: 'Nguyễn An', attempt: 'Lần 2', comment: 'Đã sửa đúng, trình bày gọn' },
      { name: 'Nguyễn An', attempt: 'Lần 1', comment: 'Sai dấu ở câu 2' },
    ]);
  });

  it('hiện "-" khi chưa có Nhận xét chung: chưa nộp, chưa chấm, hoặc chấm mà để trống', async () => {
    const page = await renderPage(
      [student('hs1', 'Chưa nộp'), student('hs2', 'Chưa chấm'), student('hs3', 'Nhận xét trống')],
      [submission('s2', 'hs2', 1), submission('s3', 'hs3', 1)],
      [grade('s3', 'hs3', 7, '   ')],
    );

    expect(readRows(page).map((r) => [r.name, r.comment])).toEqual([
      ['Chưa nộp', '-'],
      ['Chưa chấm', '-'],
      ['Nhận xét trống', '-'],
    ]);
  });
});
