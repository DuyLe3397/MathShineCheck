import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { StudentHomeComponent } from './home.component';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { StudentNotificationService } from '../../services/student-notification.service';
import { Permission, Submission } from '../../models';

function submission(id: string, studentId: string, attemptNumber: number): Submission {
  return {
    id,
    assignmentId: 'bt1',
    studentId,
    imageIds: [],
    attemptNumber,
    status: 'submitted',
    submittedAt: `2026-09-2${attemptNumber}`,
  };
}

async function renderHome(allSubmissions: Submission[], permissions: Permission[]) {
  const firestore = {
    updateStudent: async () => {},
    getGroup: () => of({ id: 'nhom1', name: 'Nhóm A' }),
    getPermissionsForOwner: () => of(permissions),
    getUsersByIds: () => of([{ id: 'hs2', fullName: 'Trần Bình' }]),
    getAssignmentsByIds: async () => [{ id: 'bt1', title: 'Bài tập phân số' }],
    getHiddenAssignmentIds: () => of([]),
    getAssignmentsPage: async () => ({ items: [], hasMore: false }),
    getSubmissionsByStudentForAssignments: async (studentId: string) =>
      allSubmissions.filter((s) => s.studentId === studentId),
    getAllSubmissionsByStudentAndAssignment: (studentId: string, assignmentId: string) =>
      of(allSubmissions.filter((s) => s.studentId === studentId && s.assignmentId === assignmentId)),
    getGradesBySubmissionIds: () => of([]),
    getCommentsBySubmissionIds: async () => [],
  };

  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'student/home', component: StudentHomeComponent }]),
      { provide: FirestoreService, useValue: firestore },
      {
        provide: AuthService,
        useValue: { currentProfile: { uid: 'hs1', fullName: 'Nguyễn An', role: 'student', groupId: 'nhom1' } },
      },
      { provide: StudentNotificationService, useValue: { markTabVisited: () => {} } },
    ],
  });
  // Thanh điều hướng tự đọc Firestore riêng; không thuộc phạm vi trang này.
  TestBed.overrideComponent(StudentHomeComponent, {
    set: { imports: [CommonModule, FormsModule, RouterModule], schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/student/home', StudentHomeComponent);
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
  return harness.routeNativeElement as HTMLElement;
}

describe('Trang chủ học sinh — Yêu cầu xem bài bạn', () => {
  it('hiện lần nộp mới nhất của người xin, không phải của chủ bài', async () => {
    const page = await renderHome(
      [
        submission('a1', 'hs1', 1),
        submission('b1', 'hs2', 1),
        submission('b2', 'hs2', 2),
      ],
      [
        {
          id: 'p1',
          requesterId: 'hs2',
          ownerId: 'hs1',
          assignmentId: 'bt1',
          status: 'pending',
          createdAt: '2026-09-25',
        },
      ],
    );

    const text = page.querySelector('.notif-text')!.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Trần Bình muốn được xem bài làm Bài tập phân số (lần 2)');
  });
});
