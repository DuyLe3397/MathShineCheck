import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  getDocsFromCache,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  writeBatch,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  count,
  startAfter,
  QueryDocumentSnapshot,
} from '@angular/fire/firestore';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ImageService } from './image.service';
import {
  SchoolClass,
  Group,
  Student,
  Assignment,
  Submission,
  Grade,
  SubmissionComment,
  Discussion,
  DiscussionReply,
  Permission,
  Teacher,
  TeacherNotification,
  HiddenAssignments,
} from '../models';
import { environment } from '../../environments/environment';

/** Loại sự kiện mà email-api nhận để gửi Email thông báo. */
type EmailNoticeKind = 'submission' | 'comment' | 'discussion' | 'reply';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private imageService = inject(ImageService);

  // Memory cache for reference data
  private classesCache$: Observable<SchoolClass[]> | null = null;
  private groupsCache$: Observable<Group[]> | null = null;
  private classesCacheTime = 0;
  private groupsCacheTime = 0;
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  // ==================== CLASSES ====================
  getClasses(
    source: 'default' | 'server' | 'cache' = 'default',
  ): Observable<SchoolClass[]> {
    // For 'server' source, bypass cache
    if (source === 'server') {
      const ref = collection(this.firestore, 'classes');
      return from(getDocsFromServer(ref)).pipe(
        map((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolClass),
        ),
      );
    }

    // Use cache if valid
    const now = Date.now();
    if (this.classesCache$ && (now - this.classesCacheTime) < this.CACHE_TTL && source !== 'cache') {
      return this.classesCache$;
    }

    const ref = collection(this.firestore, 'classes');
    const fetcher = source === 'cache' ? getDocsFromCache : getDocs;
    
    const observable = from(fetcher(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolClass),
      ),
      shareReplay(1)
    );

    // Cache the observable
    if (source === 'default') {
      this.classesCache$ = observable;
      this.classesCacheTime = now;
    }

    return observable;
  }

  async createClass(data: Partial<SchoolClass>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'classes'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async deleteClass(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'classes', id));
  }

  // ==================== CASCADE DELETE ====================
  private async deleteNotificationsBySubmission(
    submissionId: string,
  ): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'teacherNotifications'),
        where('submissionId', '==', submissionId),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
  }

  private async deleteNotificationsByDiscussion(
    discussionId: string,
  ): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'teacherNotifications'),
        where('discussionId', '==', discussionId),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
  }

  private async deleteDiscussionReplies(discussionId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'discussionReplies'),
        where('discussionId', '==', discussionId),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
  }

  async deleteSubmissionFull(submissionId: string): Promise<void> {
    const sub = await this.getSubmission(submissionId);
    if (sub?.imageIds?.length) {
      await this.imageService.deleteSubmissionImages(sub.imageIds);
    }
    await this.deleteCommentsBySubmission(submissionId);
    await this.deleteGrade(submissionId);
    await this.deleteNotificationsBySubmission(submissionId);
    await this.deleteSubmission(submissionId);
  }

  async deleteAssignmentCascade(id: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'submissions'),
        where('assignmentId', '==', id),
      ),
    );
    for (const d of snap.docs) {
      await this.deleteSubmissionFull(d.id);
    }
    await this.deleteAssignment(id);
  }

  async deleteDiscussionCascade(discussionId: string): Promise<void> {
    await this.deleteDiscussionReplies(discussionId);
    await this.deleteNotificationsByDiscussion(discussionId);
    await deleteDoc(doc(this.firestore, 'discussions', discussionId));
  }

  async deleteStudentCascade(uid: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'submissions'),
        where('studentId', '==', uid),
      ),
    );
    for (const d of snap.docs) {
      await this.deleteSubmissionFull(d.id);
    }
    const commentSnap = await getDocs(
      query(
        collection(this.firestore, 'comments'),
        where('authorId', '==', uid),
      ),
    );
    await this.deleteCommentImagesOf(commentSnap.docs.map((d) => d.data()));
    commentSnap.forEach((d) => deleteDoc(d.ref));
    await this.deleteStudent(uid);
  }

  async deleteGroupCascade(groupId: string): Promise<void> {
    const assignmentSnap = await getDocs(
      query(
        collection(this.firestore, 'assignments'),
        where('groupId', '==', groupId),
      ),
    );
    for (const d of assignmentSnap.docs) {
      await this.deleteAssignmentCascade(d.id);
    }
    const discSnap = await getDocs(
      query(
        collection(this.firestore, 'discussions'),
        where('groupId', '==', groupId),
      ),
    );
    for (const d of discSnap.docs) {
      await this.deleteDiscussionCascade(d.id);
    }
    const studentSnap = await getDocs(
      query(
        collection(this.firestore, 'students'),
        where('groupId', '==', groupId),
      ),
    );
    for (const d of studentSnap.docs) {
      await this.deleteStudentCascade(d.id);
    }
    await this.deleteGroup(groupId);
  }

  async deleteClassCascade(classId: string): Promise<void> {
    const groupSnap = await getDocs(
      query(
        collection(this.firestore, 'groups'),
        where('classId', '==', classId),
      ),
    );
    for (const d of groupSnap.docs) {
      await this.deleteGroupCascade(d.id);
    }
    await this.deleteClass(classId);
  }

  // ==================== GROUPS ====================
  getGroupsByClass(
    classId: string,
    source: 'default' | 'server' | 'cache' = 'default',
  ): Observable<Group[]> {
    const ref = query(
      collection(this.firestore, 'groups'),
      where('classId', '==', classId),
    );
    const fetcher =
      source === 'server'
        ? getDocsFromServer
        : source === 'cache'
          ? getDocsFromCache
          : getDocs;
    return from(fetcher(ref)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Group)),
    );
  }

  getAllGroups(): Observable<Group[]> {
    // Use cache if valid
    const now = Date.now();
    if (this.groupsCache$ && (now - this.groupsCacheTime) < this.CACHE_TTL) {
      return this.groupsCache$;
    }

    const observable = from(getDocs(collection(this.firestore, 'groups'))).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Group)),
      shareReplay(1)
    );

    this.groupsCache$ = observable;
    this.groupsCacheTime = now;
    return observable;
  }

  async createGroup(data: Partial<Group>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'groups'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async deleteGroup(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'groups', id));
  }

  // ==================== STUDENTS ====================
  getStudentsByGroup(groupId: string): Observable<Student[]> {
    const ref = query(
      collection(this.firestore, 'students'),
      where('groupId', '==', groupId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Student),
      ),
    );
  }

  getGroup(id: string): Observable<Group | null> {
    return from(getDoc(doc(this.firestore, 'groups', id))).pipe(
      map((d) => (d.exists() ? ({ id: d.id, ...d.data() } as Group) : null)),
    );
  }

  async getStudent(uid: string): Promise<Student | null> {
    const d = await getDoc(doc(this.firestore, 'students', uid));
    if (!d.exists()) return null;
    return { uid: d.id, ...d.data() } as Student;
  }

  async createStudentDoc(uid: string, data: Partial<Student>): Promise<void> {
    if (uid) {
      await setDoc(doc(this.firestore, 'students', uid), {
        ...data,
        createdAt: new Date().toISOString(),
      });
    } else {
      const ref = await addDoc(collection(this.firestore, 'students'), {
        ...data,
        uid: '',
        createdAt: new Date().toISOString(),
      });
      await updateDoc(ref, { uid: ref.id });
    }
  }

  async updateStudent(uid: string, data: Partial<Student>): Promise<void> {
    await updateDoc(doc(this.firestore, 'students', uid), data as any);
  }

  async updateTeacher(uid: string, data: Partial<Teacher>): Promise<void> {
    await updateDoc(doc(this.firestore, 'teachers', uid), data as any);
  }

  async deleteStudent(uid: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'students', uid));
  }

  async getDocById(collectionName: string, id: string): Promise<any | null> {
    const d = await getDoc(doc(this.firestore, collectionName, id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() };
  }

  async setDoc(collectionName: string, id: string, data: any): Promise<void> {
    await setDoc(doc(this.firestore, collectionName, id), data);
  }

  // ==================== ASSIGNMENTS ====================
  getAssignmentsByGroup(groupId: string): Observable<Assignment[]> {
    const ref = query(
      collection(this.firestore, 'assignments'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Assignment)
          .sort((a, b) => {
            const timeA = a.createdAt || a.sessionDate || '';
            const timeB = b.createdAt || b.sessionDate || '';
            return timeB.localeCompare(timeA);
          }),
      ),
    );
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const d = await getDoc(doc(this.firestore, 'assignments', id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Assignment;
  }

  async createAssignment(data: Partial<Assignment>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'assignments'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<void> {
    await updateDoc(doc(this.firestore, 'assignments', id), data as any);
  }

  async deleteAssignment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'assignments', id));
  }

  // ==================== HIDDEN ASSIGNMENTS ====================
  /** Id các bài bị ẩn với học sinh; trả mảng rỗng nếu chưa có document hoặc đọc lỗi. */
  getHiddenAssignmentIds(studentId: string): Observable<string[]> {
    if (!studentId) return of([]);
    return from(getDoc(doc(this.firestore, 'hiddenAssignments', studentId))).pipe(
      map((d) => (d.exists() ? ((d.data() as HiddenAssignments).assignmentIds ?? []) : [])),
      catchError(() => of([])),
    );
  }

  getHiddenAssignmentsByGroup(groupId: string): Observable<HiddenAssignments[]> {
    const ref = query(
      collection(this.firestore, 'hiddenAssignments'),
      where('groupId', '==', groupId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => snap.docs.map((d) => d.data() as HiddenAssignments)),
    );
  }

  /** Một trang bài tập của nhóm, tạo mới nhất trước; truyền `after` là cursor trang trước. */
  async getAssignmentsPage(
    groupId: string,
    pageSize: number,
    after?: QueryDocumentSnapshot,
  ): Promise<{ items: Assignment[]; cursor?: QueryDocumentSnapshot; hasMore: boolean }> {
    const constraints = [
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
      ...(after ? [startAfter(after)] : []),
      limit(pageSize),
    ];
    const snap = await getDocs(query(collection(this.firestore, 'assignments'), ...constraints));
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Assignment),
      cursor: snap.docs[snap.docs.length - 1] ?? after,
      hasMore: snap.docs.length === pageSize,
    };
  }

  /** Lần nộp của một học sinh cho các bài tập cho trước. */
  async getSubmissionsByStudentForAssignments(
    studentId: string,
    assignmentIds: string[],
  ): Promise<Submission[]> {
    const snaps = await Promise.all(
      this.chunkArray(assignmentIds, 30).map((chunk) =>
        getDocs(
          query(
            collection(this.firestore, 'submissions'),
            where('studentId', '==', studentId),
            where('assignmentId', 'in', chunk),
          ),
        ),
      ),
    );
    return snaps.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission));
  }

  async getCommentsBySubmissionIds(submissionIds: string[]): Promise<SubmissionComment[]> {
    const snaps = await Promise.all(
      this.chunkArray(submissionIds, 30).map((chunk) =>
        getDocs(
          query(collection(this.firestore, 'comments'), where('submissionId', 'in', chunk)),
        ),
      ),
    );
    return snaps.flatMap((s) =>
      s.docs.map((d) => ({ id: d.id, ...d.data() }) as SubmissionComment),
    );
  }

  /** Bài tập của nhóm mà học sinh được thấy (đã bỏ Bài bị ẩn). */
  getVisibleAssignmentsForStudent(groupId: string, studentId: string): Observable<Assignment[]> {
    return forkJoin([
      this.getAssignmentsByGroup(groupId),
      this.getHiddenAssignmentIds(studentId),
    ]).pipe(
      map(([assignments, hiddenIds]) => {
        const hidden = new Set(hiddenIds);
        return assignments.filter((a) => !hidden.has(a.id));
      }),
    );
  }

  async setHiddenAssignments(data: HiddenAssignments): Promise<void> {
    await setDoc(doc(this.firestore, 'hiddenAssignments', data.studentId), data);
  }

  async deleteSubmission(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'submissions', id));
  }

  async deleteGrade(submissionId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'grades'),
        where('submissionId', '==', submissionId),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
  }

  async deleteCommentsBySubmission(submissionId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'comments'),
        where('submissionId', '==', submissionId),
      ),
    );
    await this.deleteCommentImagesOf(snap.docs.map((d) => d.data()));
    snap.forEach((d) => deleteDoc(d.ref));
  }

  /** Xóa Ảnh đính kèm của các bình luận sắp bị xóa. */
  private async deleteCommentImagesOf(comments: any[]): Promise<void> {
    const ids = comments.flatMap((c) => (c?.['imageIds'] as string[]) || []);
    if (ids.length) await this.imageService.deleteCommentImages(ids);
  }

  // ==================== SUBMISSIONS ====================
  getSubmissionsByAssignment(assignmentId: string): Observable<Submission[]> {
    const ref = query(
      collection(this.firestore, 'submissions'),
      where('assignmentId', '==', assignmentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission),
      ),
    );
  }

  // ==================== BATCH QUERIES (Optimization for N+1) ====================
  
  // Batch query: Get all submissions for a student (replaces per-assignment queries)
  getSubmissionsByStudent(studentId: string): Observable<Submission[]> {
    const ref = query(
      collection(this.firestore, 'submissions'),
      where('studentId', '==', studentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission),
      ),
    );
  }

  // Batch query: Get all grades for a student (replaces per-submission queries)
  getGradesByStudent(studentId: string): Observable<Grade[]> {
    const ref = query(
      collection(this.firestore, 'grades'),
      where('studentId', '==', studentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Grade)),
    );
  }

  // Batch query: Get grades for multiple submissions in one query
  getGradesBySubmissionIds(submissionIds: string[]): Observable<Grade[]> {
    // Firestore supports up to 30 values in 'in' clause
    const chunks = this.chunkArray(submissionIds, 30);
    
    return from(Promise.all(chunks.map(chunk => {
      const ref = query(
        collection(this.firestore, 'grades'),
        where('submissionId', 'in', chunk)
      );
      return getDocs(ref);
    }))).pipe(
      map((snapshots) => {
        const grades: Grade[] = [];
        snapshots.forEach(snap => {
          grades.push(...snap.docs.map(d => ({ id: d.id, ...d.data() }) as Grade));
        });
        return grades;
      })
    );
  }

  // Batch query: Get replies for multiple discussions
  getRepliesByDiscussionIds(discussionIds: string[]): Observable<DiscussionReply[]> {
    const chunks = this.chunkArray(discussionIds, 30);
    
    return from(Promise.all(chunks.map(chunk => {
      const ref = query(
        collection(this.firestore, 'discussionReplies'),
        where('discussionId', 'in', chunk)
      );
      return getDocs(ref);
    }))).pipe(
      map((snapshots) => {
        const replies: DiscussionReply[] = [];
        snapshots.forEach(snap => {
          replies.push(...snap.docs.map(d => ({ id: d.id, ...d.data() }) as DiscussionReply));
        });
        return replies;
      })
    );
  }

  // Batch query: Get users by IDs (for avatars in discussions/results)
  getUsersByIds(userIds: string[], type: 'teachers' | 'students'): Observable<any[]> {
    const chunks = this.chunkArray(userIds, 30);
    
    return from(Promise.all(chunks.map(chunk => {
      const ref = query(
        collection(this.firestore, type),
        where('__name__', 'in', chunk)
      );
      return getDocs(ref);
    }))).pipe(
      map((snapshots) => {
        const users: any[] = [];
        snapshots.forEach(snap => {
          users.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return users;
      })
    );
  }

  // ==================== DASHBOARD (aggregation, không tải bản ghi) ====================
  private readonly PENDING_STATUSES = ['submitted', 'grading'];

  /** Số liệu tổng quan cho dashboard giáo viên; server tự đếm/cộng, chỉ tốn vài lượt đọc. */
  async getDashboardStats(): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    gradedToday: number;
    averageScore: number | null;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const grades = collection(this.firestore, 'grades');
    const [students, pending, gradedToday, scored] = await Promise.all([
      getCountFromServer(collection(this.firestore, 'students')),
      getCountFromServer(
        query(
          collection(this.firestore, 'submissions'),
          where('status', 'in', this.PENDING_STATUSES),
        ),
      ),
      getCountFromServer(query(grades, where('gradedAt', '>=', today))),
      // Điểm 0 là Chấm không điểm, không tính vào trung bình
      getAggregateFromServer(query(grades, where('scoreValue', '>', 0)), {
        total: sum('scoreValue'),
        n: count(),
      }),
    ]);
    const { total, n } = scored.data();
    return {
      totalStudents: students.data().count,
      pendingSubmissions: pending.data().count,
      gradedToday: gradedToday.data().count,
      averageScore: n > 0 ? total / n : null,
    };
  }

  /** Mọi Lần nộp chờ chấm (vừa nộp hoặc đang chấm dở). */
  async getPendingSubmissions(): Promise<Submission[]> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'submissions'),
        where('status', 'in', this.PENDING_STATUSES),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission);
  }

  async getAssignmentsByIds(ids: string[]): Promise<Assignment[]> {
    const snaps = await Promise.all(
      this.chunkArray(ids, 30).map((chunk) =>
        getDocs(
          query(
            collection(this.firestore, 'assignments'),
            where('__name__', 'in', chunk),
          ),
        ),
      ),
    );
    return snaps.flatMap((s) =>
      s.docs.map((d) => ({ id: d.id, ...d.data() }) as Assignment),
    );
  }

  // Helper: Chunk array for Firestore 'in' clause limit
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getSubmissionByStudentAndAssignment(
    studentId: string,
    assignmentId: string,
  ): Observable<Submission | null> {
    const ref = query(
      collection(this.firestore, 'submissions'),
      where('studentId', '==', studentId),
      where('assignmentId', '==', assignmentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => {
        if (snap.empty) return null;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Submission;
      }),
    );
  }

  getAllSubmissionsByStudentAndAssignment(
    studentId: string,
    assignmentId: string,
  ): Observable<Submission[]> {
    const ref = query(
      collection(this.firestore, 'submissions'),
      where('studentId', '==', studentId),
      where('assignmentId', '==', assignmentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => {
        const subs = snap.docs.map((d, i) => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            attemptNumber: data['attemptNumber'] || i + 1,
          } as Submission;
        });
        subs.sort(
          (a, b) =>
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime(),
        );
        return subs;
      }),
    );
  }

  async getSubmission(id: string): Promise<Submission | null> {
    const d = await getDoc(doc(this.firestore, 'submissions', id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Submission;
  }

  async getSubmissionByStudentAssignment(
    studentId: string,
    assignmentId: string,
  ): Promise<Submission | null> {
    const q = query(
      collection(this.firestore, 'submissions'),
      where('studentId', '==', studentId),
      where('assignmentId', '==', assignmentId),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Submission;
  }

  async createSubmission(data: Partial<Submission>): Promise<string> {
    const attempt = data.attemptNumber || 1;
    // Dùng Document ID cố định: {assignmentId}_{studentId}_{attemptNumber}
    // Đảm bảo tính duy nhất tuyệt đối (idempotency), 100% không thể sinh bản ghi thứ hai dù gặp race condition hay mạng chập chờn.
    const submissionId =
      data.assignmentId && data.studentId
        ? `${data.assignmentId}_${data.studentId}_${attempt}`
        : null;

    if (submissionId) {
      const subRef = doc(this.firestore, 'submissions', submissionId);
      const existing = await getDoc(subRef);
      if (existing.exists()) {
        // Bản ghi Lần nộp này đã được lưu trước đó; trả về ID cũ và không gửi thông báo/email lặp lại
        return submissionId;
      }
      await setDoc(subRef, {
        ...data,
        attemptNumber: attempt,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });
      await this.notifyTeachersNewSubmission(
        submissionId,
        data.studentId || '',
        data.assignmentId || '',
      );
      this.requestEmailNotice('submission', submissionId);
      return submissionId;
    }

    const ref = await addDoc(collection(this.firestore, 'submissions'), {
      ...data,
      attemptNumber: attempt,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    });
    if (data.assignmentId) {
      await this.notifyTeachersNewSubmission(
        ref.id,
        data.studentId || '',
        data.assignmentId,
      );
      this.requestEmailNotice('submission', ref.id);
    }
    return ref.id;
  }

  /**
   * Nhờ email-api gửi Email thông báo cho sự kiện vừa tạo. API tự đọc lại
   * dữ liệu và bỏ qua nếu người viết không phải học sinh. Không chờ, không báo lỗi:
   * gửi email thất bại thì Thông báo trên thanh vẫn còn (xem docs/adr/0003).
   */
  private requestEmailNotice(kind: EmailNoticeKind, id: string): void {
    if (!environment.emailApiUrl) return;
    try {
      fetch(environment.emailApiUrl, {
        method: 'POST',
        // text/plain để tránh preflight CORS; keepalive để không bị hủy khi chuyển trang.
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ kind, id }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  private async notifyTeachersNewSubmission(
    submissionId: string,
    studentId: string,
    assignmentId: string,
  ): Promise<void> {
    try {
      let authorName = studentId;
      let content = assignmentId;
      try {
        const student = await getDoc(
          doc(this.firestore, 'students', studentId),
        );
        if (student.exists())
          authorName = (student.data() as any)['fullName'] || studentId;
      } catch {}
      try {
        const assignment = await getDoc(
          doc(this.firestore, 'assignments', assignmentId),
        );
        if (assignment.exists())
          content = (assignment.data() as any)['title'] || assignmentId;
      } catch {}

      const teacherIds = await this.getAllTeacherIds();
      for (const tid of teacherIds) {
        await addDoc(collection(this.firestore, 'teacherNotifications'), {
          teacherId: tid,
          type: 'new_submission',
          submissionId,
          assignmentId,
          authorName,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch (e) {}
  }

  async markNotificationsReadBySubmission(submissionId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'teacherNotifications'),
        where('submissionId', '==', submissionId),
      ),
    );
    snap.forEach((d) => updateDoc(d.ref, { isRead: true }));
  }

  async updateSubmissionStatus(id: string, status: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissions', id), { status });
  }

  /**
   * Đồng bộ trạng thái 'graded' cho tất cả bản ghi có cùng số lần nộp của học sinh,
   * tránh tình trạng giáo viên đã chấm điểm nhưng bản ghi trùng khác vẫn mang status: 'submitted'.
   */
  async syncSubmissionsGraded(
    assignmentId: string,
    studentId: string,
    attemptNumber: number,
  ): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'submissions'),
        where('assignmentId', '==', assignmentId),
        where('studentId', '==', studentId),
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data();
        if (
          (data['attemptNumber'] || 1) === attemptNumber &&
          data['status'] !== 'graded'
        ) {
          await updateDoc(d.ref, { status: 'graded' });
        }
      }
    } catch {}
  }

  async updateSubmissionImageIds(
    id: string,
    imageIds: string[],
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissions', id), { imageIds });
  }

  async updateSubmissionGradedImageIds(
    id: string,
    gradedImageIds: string[],
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissions', id), { gradedImageIds });
  }

  async updateSubmission(id: string, data: Partial<Submission>): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissions', id), data as any);
  }

  // ==================== GRADES ====================
  getGradeBySubmission(submissionId: string): Observable<Grade | null> {
    const ref = query(
      collection(this.firestore, 'grades'),
      where('submissionId', '==', submissionId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => {
        if (snap.empty) return null;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Grade;
      }),
    );
  }

  getGradesByAssignment(assignmentId: string): Observable<Grade[]> {
    const ref = query(
      collection(this.firestore, 'grades'),
      where('assignmentId', '==', assignmentId),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Grade)),
    );
  }

  // Batch query: Get grades for multiple assignments in one query
  getGradesByAssignmentIds(assignmentIds: string[]): Observable<Grade[]> {
    const chunks = this.chunkArray(assignmentIds, 30);
    return from(Promise.all(chunks.map(chunk => {
      const ref = query(
        collection(this.firestore, 'grades'),
        where('assignmentId', 'in', chunk)
      );
      return getDocs(ref);
    }))).pipe(
      map((snapshots) => {
        const grades: Grade[] = [];
        snapshots.forEach(snap => {
          grades.push(...snap.docs.map(d => ({ id: d.id, ...d.data() }) as Grade));
        });
        return grades;
      })
    );
  }

  async createOrUpdateGrade(data: Partial<Grade>): Promise<void> {
    let existing;
    if (data.submissionId) {
      existing = query(
        collection(this.firestore, 'grades'),
        where('submissionId', '==', data.submissionId),
      );
    } else if (data.studentId && data.assignmentId) {
      existing = query(
        collection(this.firestore, 'grades'),
        where('studentId', '==', data.studentId),
        where('assignmentId', '==', data.assignmentId),
      );
    }
    let snap;
    if (existing) {
      snap = await getDocs(existing);
    } else {
      snap = { empty: true } as any;
    }
    if (snap.empty) {
      await addDoc(collection(this.firestore, 'grades'), {
        ...data,
        gradedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(doc(this.firestore, 'grades', snap.docs[0].id), {
        scoreValue: data.scoreValue,
        comment: data.comment,
        gradedBy: data.gradedBy,
        gradedAt: new Date().toISOString(),
      });
    }
  }

  // ==================== COMMENTS ====================
  getCommentsBySubmission(
    submissionId: string,
  ): Observable<SubmissionComment[]> {
    const ref = query(
      collection(this.firestore, 'comments'),
      where('submissionId', '==', submissionId),
      orderBy('createdAt', 'asc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubmissionComment),
      ),
    );
  }

  getCommentsBySubmissionAndImage(
    submissionId: string,
    imageIndex: number,
  ): Observable<SubmissionComment[]> {
    const ref = query(
      collection(this.firestore, 'comments'),
      where('submissionId', '==', submissionId),
      where('imageIndex', '==', imageIndex),
      orderBy('createdAt', 'asc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubmissionComment),
      ),
    );
  }

  async addComment(data: Partial<SubmissionComment>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'comments'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    if (data.submissionId) {
      await this.notifyTeachersSubmissionComment(
        data.submissionId,
        ref.id,
        data.authorName || '',
        data.content || '',
        data.imageIndex,
        data.authorId,
      );
      if (data.authorRole !== 'teacher') this.requestEmailNotice('comment', ref.id);
    }
    return ref.id;
  }

  async updateComment(
    id: string,
    data: Partial<SubmissionComment>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'comments', id), data as any);
  }

  async deleteComment(id: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'teacherNotifications'),
        where('commentId', '==', id),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
    const comment = await getDoc(doc(this.firestore, 'comments', id));
    await this.deleteCommentImagesOf([comment.data()]);
    await deleteDoc(doc(this.firestore, 'comments', id));
  }

  async updateDiscussionReply(
    id: string,
    data: Partial<DiscussionReply>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'discussionReplies', id), data as any);
  }

  async deleteDiscussionReply(id: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.firestore, 'teacherNotifications'),
        where('replyId', '==', id),
      ),
    );
    snap.forEach((d) => deleteDoc(d.ref));
    await deleteDoc(doc(this.firestore, 'discussionReplies', id));
  }

  async updateDiscussion(id: string, data: Partial<Discussion>): Promise<void> {
    await updateDoc(doc(this.firestore, 'discussions', id), data as any);
  }

  private async notifyTeachersSubmissionComment(
    submissionId: string,
    commentId: string,
    authorName: string,
    content: string,
    imageIndex?: number,
    authorId?: string,
  ): Promise<void> {
    try {
      const teacherIds = await this.getAllTeacherIds();
      for (const tid of teacherIds) {
        if (tid === authorId) continue;
        await addDoc(collection(this.firestore, 'teacherNotifications'), {
          teacherId: tid,
          type: 'submission',
          submissionId,
          commentId,
          imageIndex: imageIndex ?? 0,
          authorName,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch (e) {}
  }

  private async getAllTeacherIds(): Promise<string[]> {
    const snap = await getDocs(collection(this.firestore, 'teachers'));
    return snap.docs.map((d) => d.id);
  }

  getNotificationsForTeacher(
    teacherId: string,
  ): Observable<TeacherNotification[]> {
    const ref = query(
      collection(this.firestore, 'teacherNotifications'),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as TeacherNotification,
        ),
      ),
    );
  }

  async markNotificationRead(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'teacherNotifications', id), {
      isRead: true,
    });
  }

  async markAllNotificationsRead(teacherId: string): Promise<void> {
    const ref = query(
      collection(this.firestore, 'teacherNotifications'),
      where('teacherId', '==', teacherId),
      where('isRead', '==', false),
      limit(400),
    );
    const snap = await getDocs(ref);
    if (snap.empty) return;

    const batch = writeBatch(this.firestore);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  }

  async updateCommentReactions(
    commentId: string,
    reactions: Record<string, string>,
  ): Promise<void> {
    const sanitized = Object.fromEntries(
      Object.entries(reactions).filter(([k]) => k),
    );
    await updateDoc(doc(this.firestore, 'comments', commentId), {
      reactions: sanitized,
    });
  }

  async updateDiscussionReplyReactions(
    replyId: string,
    reactions: Record<string, string>,
  ): Promise<void> {
    const sanitized = Object.fromEntries(
      Object.entries(reactions).filter(([k]) => k),
    );
    await updateDoc(doc(this.firestore, 'discussionReplies', replyId), {
      reactions: sanitized,
    });
  }

  // ==================== DISCUSSIONS ====================
  getDiscussionsByGroup(groupId: string): Observable<Discussion[]> {
    const ref = query(
      collection(this.firestore, 'discussions'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Discussion),
      ),
    );
  }

  /** Một trang chủ đề thảo luận của nhóm, mới nhất trước; truyền `after` là cursor trang trước. */
  async getDiscussionsPage(
    groupId: string,
    pageSize: number,
    after?: QueryDocumentSnapshot,
  ): Promise<{ items: Discussion[]; cursor?: QueryDocumentSnapshot; hasMore: boolean }> {
    const constraints = [
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
      ...(after ? [startAfter(after)] : []),
      limit(pageSize),
    ];
    const snap = await getDocs(query(collection(this.firestore, 'discussions'), ...constraints));
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Discussion),
      cursor: snap.docs[snap.docs.length - 1] ?? after,
      hasMore: snap.docs.length === pageSize,
    };
  }

  async createDiscussion(data: Partial<Discussion>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'discussions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    await this.notifyTeachersNewDiscussion(
      ref.id,
      data.authorName || '',
      data.content || '',
      data.authorId,
    );
    this.requestEmailNotice('discussion', ref.id);
    return ref.id;
  }

  private async notifyTeachersNewDiscussion(
    discussionId: string,
    authorName: string,
    content: string,
    authorId?: string,
  ): Promise<void> {
    try {
      const teacherIds = await this.getAllTeacherIds();
      for (const tid of teacherIds) {
        if (tid === authorId) continue;
        await addDoc(collection(this.firestore, 'teacherNotifications'), {
          teacherId: tid,
          type: 'discussion',
          discussionId,
          replyId: '',
          authorName,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch (e) {}
  }

  getDiscussion(id: string): Observable<Discussion | null> {
    return from(getDoc(doc(this.firestore, 'discussions', id))).pipe(
      map((d) =>
        d.exists() ? ({ id: d.id, ...d.data() } as Discussion) : null,
      ),
    );
  }

  getRepliesByDiscussion(discussionId: string): Observable<DiscussionReply[]> {
    const ref = query(
      collection(this.firestore, 'discussionReplies'),
      where('discussionId', '==', discussionId),
      orderBy('createdAt', 'asc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiscussionReply),
      ),
    );
  }

  async addReply(data: Partial<DiscussionReply>): Promise<DiscussionReply> {
    const createdAt = new Date().toISOString();
    const ref = await addDoc(collection(this.firestore, 'discussionReplies'), {
      ...data,
      createdAt,
    });
    if (data.discussionId) {
      await updateDoc(doc(this.firestore, 'discussions', data.discussionId), {
        lastReplyAt: createdAt,
      });
      await this.notifyTeachersDiscussionReply(
        data.discussionId,
        ref.id,
        data.authorName || '',
        data.content || '',
        data.authorId,
      );
      this.requestEmailNotice('reply', ref.id);
    }
    return {
      id: ref.id,
      discussionId: data.discussionId || '',
      authorId: data.authorId || '',
      authorName: data.authorName || '',
      authorAvatarUrl: data.authorAvatarUrl || '',
      content: data.content || '',
      imageUrl: data.imageUrl || '',
      createdAt,
    } as DiscussionReply;
  }

  private async notifyTeachersDiscussionReply(
    discussionId: string,
    replyId: string,
    authorName: string,
    content: string,
    authorId?: string,
  ): Promise<void> {
    try {
      const teacherIds = await this.getAllTeacherIds();
      for (const tid of teacherIds) {
        if (tid === authorId) continue;
        await addDoc(collection(this.firestore, 'teacherNotifications'), {
          teacherId: tid,
          type: 'discussion',
          discussionId,
          replyId,
          authorName,
          content,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch (e) {}
  }

  // ==================== PERMISSIONS ====================
  getPermissionsForOwner(ownerId: string): Observable<Permission[]> {
    const ref = query(
      collection(this.firestore, 'permissions'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Permission),
      ),
    );
  }

  getPermissionsByRequester(requesterId: string): Observable<Permission[]> {
    const ref = query(
      collection(this.firestore, 'permissions'),
      where('requesterId', '==', requesterId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Permission),
      ),
    );
  }

  async requestPermission(data: Partial<Permission>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'permissions'), {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async updatePermissionStatus(
    id: string,
    status: 'granted' | 'denied',
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'permissions', id), { status });
  }

  // ==================== NOTIFICATIONS ====================
  getNotificationsByUser(userId: string): Observable<any[]> {
    const ref = query(
      collection(this.firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }

  // ==================== TEACHERS ====================
  async getAllTeachers(): Promise<Teacher[]> {
    const snap = await getDocs(collection(this.firestore, 'teachers'));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Teacher);
  }
}
