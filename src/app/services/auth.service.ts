import { Injectable, inject } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, User,
  browserLocalPersistence, setPersistence, browserSessionPersistence,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models';

const STUDENT_SESSION_KEY = 'mathshine_student';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  private profileDoneSubject = new BehaviorSubject<boolean>(false);
  profileDone$ = this.profileDoneSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(STUDENT_SESSION_KEY);
    if (saved) {
      try {
        const student = JSON.parse(saved);
        this.userProfileSubject.next({
          uid: student.id || student.uid,
          fullName: student.fullName,
          role: 'student',
          className: student.className,
          groupId: student.groupId,
        });
        this.profileDoneSubject.next(true);
      } catch {}
    }

    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        this.profileDoneSubject.next(false);
        this.tryLoadTeacherProfile(user.uid, 0);
      } else if (!localStorage.getItem(STUDENT_SESSION_KEY)) {
        setTimeout(() => {
          if (!this.currentUser) {
            this.userProfileSubject.next(null);
            this.profileDoneSubject.next(true);
          }
        }, 800);
      }
    });
  }

  private async tryLoadTeacherProfile(uid: string, attempt: number): Promise<void> {
    const maxAttempts = 3;
    try {
      const teacherDoc = await getDoc(doc(this.firestore, 'teachers', uid));
      if (teacherDoc.exists()) {
        const data = teacherDoc.data() as any;
        this.userProfileSubject.next({
          uid, fullName: data['fullName'], role: 'teacher', subject: data['subject'],
        });
        this.profileDoneSubject.next(true);
        return;
      }
      // Teacher authenticated but no Firestore doc — create one
      const user = this.currentUser;
      const emailName = user?.email?.split('@')[0] || uid;
      const defaultProfile = {
        uid, fullName: emailName, role: 'teacher', subject: '',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(this.firestore, 'teachers', uid), defaultProfile);
      this.userProfileSubject.next({ uid, fullName: emailName, role: 'teacher', subject: '' });
      this.profileDoneSubject.next(true);
    } catch {
      if (attempt < maxAttempts) {
        setTimeout(() => this.tryLoadTeacherProfile(uid, attempt + 1), 500);
      } else {
        this.userProfileSubject.next(null);
        this.profileDoneSubject.next(true);
      }
    }
  }

  async refreshProfile(): Promise<void> {
    const user = this.currentUser;
    if (user) {
      this.profileDoneSubject.next(false);
      this.tryLoadTeacherProfile(user.uid, 0);
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get currentProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  loginStudentAsGuest(student: any): void {
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
    this.userProfileSubject.next({
      uid: student.id || student.uid,
      fullName: student.fullName,
      role: 'student',
      className: student.className,
      groupId: student.groupId,
      avatarUrl: student.avatarUrl || '',
    });
    this.profileDoneSubject.next(true);
  }

  async setPersistenceMode(local: boolean): Promise<void> {
    await setPersistence(this.auth, local ? browserLocalPersistence : browserSessionPersistence);
  }

  async loginAsTeacher(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async registerTeacher(email: string, password: string, fullName: string, subject: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await setDoc(doc(this.firestore, 'teachers', result.user.uid), {
      uid: result.user.uid, fullName, subject, role: 'teacher', createdAt: new Date().toISOString(),
    });
    await this.refreshProfile();
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STUDENT_SESSION_KEY);
    const profile = this.currentProfile;
    if (profile?.role === 'teacher' || this.currentUser) {
      await signOut(this.auth);
    }
    this.userProfileSubject.next(null);
    this.profileDoneSubject.next(true);
  }

  getStudentByInfo(fullName: string, className: string, groupId: string): Observable<any> {
    const q = query(
      collection(this.firestore, 'students'),
      where('fullName', '==', fullName),
      where('className', '==', className),
      where('groupId', '==', groupId),
    );
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })),
    );
  }


}
