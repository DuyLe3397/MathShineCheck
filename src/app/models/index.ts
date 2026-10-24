export interface Teacher {
  uid: string;
  fullName: string;
  subject: string;
  role: 'teacher';
  createdAt: string;
}

export interface Student {
  uid: string;
  fullName: string;
  className: string;
  groupId: string;
  username: string;
  phone?: string;
  avatarUrl?: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastHomeSeenAt?: string;
  lastScoreboardSeenAt?: string;
  lastDiscussionsSeenAt?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface Group {
  id: string;
  classId: string;
  name: string;
  teacherIds: string[];
  createdAt: string;
}

export interface Assignment {
  id: string;
  groupId: string;
  title: string;
  sessionDate: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

/** Danh sách bài bị ẩn của một học sinh — document id = uid học sinh. Không có document = không ẩn bài nào. */
export interface HiddenAssignments {
  studentId: string;
  groupId: string;
  assignmentIds: string[];
  updatedBy: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  imageIds: string[];
  gradedImageIds?: string[];
  attemptNumber?: number;
  status: 'submitted' | 'grading' | 'graded';
  submittedAt: string;
  lastCommentSeenAt?: string;
}

export interface Grade {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  scoreValue: number;
  comment: string;
  gradedBy: string;
  gradedAt: string;
}

export interface SubmissionComment {
  id: string;
  submissionId: string;
  imageIndex?: number;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole: 'teacher' | 'student';
  content: string;
  /** Ảnh đính kèm cũ (một ảnh base64 lưu thẳng trong bình luận) — chỉ còn ở bình luận chưa sửa lại. */
  imageUrl?: string;
  /** Ảnh đính kèm theo thứ tự Hình 1, Hình 2…; mỗi mã là một document trong `commentImages`. */
  imageIds?: string[];
  /** Ghi chú ảnh, song song theo vị trí với `imageIds` ('' là không có ghi chú). */
  imageNotes?: string[];
  createdAt: string;
  reactions?: Record<string, string>;
}

export interface Discussion {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  lastReplyAt?: string;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  reactions?: Record<string, string>;
}

export interface Permission {
  id: string;
  requesterId: string;
  ownerId: string;
  assignmentId: string;
  status: 'pending' | 'granted' | 'denied';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'graded' | 'permission_request' | 'permission_response' | 'new_comment' | 'new_reply';
  refId: string;
  isRead: boolean;
  createdAt: string;
}

export interface TeacherNotification {
  id: string;
  teacherId: string;
  type: 'discussion' | 'submission' | 'new_submission';
  discussionId?: string;
  replyId?: string;
  submissionId?: string;
  commentId?: string;
  assignmentId?: string;
  imageIndex?: number;
  authorName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  fullName: string;
  role: UserRole;
  className?: string;
  groupId?: string;
  subject?: string;
  avatarUrl?: string;
  bio?: string;
}
