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
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
} from '../models';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  // ==================== CLASSES ====================
  getClasses(
    source: 'default' | 'server' | 'cache' = 'default',
  ): Observable<SchoolClass[]> {
    const ref = collection(this.firestore, 'classes');
    const fetcher =
      source === 'server'
        ? getDocsFromServer
        : source === 'cache'
          ? getDocsFromCache
          : getDocs;
    return from(fetcher(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolClass),
      ),
    );
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
    return from(getDocs(collection(this.firestore, 'groups'))).pipe(
      map((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Group)),
    );
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
      orderBy('sessionDate', 'desc'),
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Assignment),
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

  async deleteAssignment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'assignments', id));
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
    snap.forEach((d) => deleteDoc(d.ref));
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
    const ref = await addDoc(collection(this.firestore, 'submissions'), {
      ...data,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async updateSubmissionStatus(id: string, status: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissions', id), { status });
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

  async createOrUpdateGrade(data: Partial<Grade>): Promise<void> {
    const existing = query(
      collection(this.firestore, 'grades'),
      where('submissionId', '==', data.submissionId),
    );
    const snap = await getDocs(existing);
    if (!snap.empty) {
      await updateDoc(doc(this.firestore, 'grades', snap.docs[0].id), {
        scoreValue: data.scoreValue,
        comment: data.comment,
        gradedBy: data.gradedBy,
        gradedAt: new Date().toISOString(),
      });
    } else {
      await addDoc(collection(this.firestore, 'grades'), {
        ...data,
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
        data.authorName || '',
        data.content || '',
        data.imageIndex,
        data.authorId,
      );
    }
    return ref.id;
  }

  private async notifyTeachersSubmissionComment(
    submissionId: string,
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
    );
    return from(getDocs(ref)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Discussion),
      ),
    );
  }

  async createDiscussion(data: Partial<Discussion>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'discussions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
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

  async addReply(data: Partial<DiscussionReply>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'discussionReplies'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    if (data.discussionId) {
      await updateDoc(doc(this.firestore, 'discussions', data.discussionId), {
        lastReplyAt: new Date().toISOString(),
      });
      await this.notifyTeachersDiscussionReply(
        data.discussionId,
        ref.id,
        data.authorName || '',
        data.content || '',
        data.authorId,
      );
    }
    return ref.id;
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
