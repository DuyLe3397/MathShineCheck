import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';

/** Số Ảnh đính kèm tối đa của một Nhận xét theo ảnh. */
export const MAX_COMMENT_ATTACHMENTS = 3;

/** Một Ảnh đính kèm đang soạn/sửa: có `imageId` là ảnh đã lưu, chưa có là ảnh mới chọn. */
export interface AttachmentDraft {
  imageId?: string;
  dataUrl: string;
  /** Ghi chú ảnh, hiển thị sau "Hình N: ". */
  note?: string;
}

/** Ghi chú ảnh theo đúng thứ tự ảnh, để lưu song song với `imageIds`. */
export function notesOf(drafts: AttachmentDraft[]): string[] {
  return drafts.map((d) => (d.note || '').trim());
}

@Injectable({ providedIn: 'root' })
export class ImageService {
  private firestore = inject(Firestore);

  /** URL ảnh đính kèm vừa xem gần nhất để đánh dấu viền xanh trên toàn trang. */
  activeAttachmentUrl = signal<string | null>(null);

  compressImage(
    file: File,
    maxDim = 1920,
    quality = 0.88,
    maxBytes = 900000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const dimSteps = [...new Set([maxDim, 1920, 1600, 1280, 1024])].filter(
            (d) => d > 0 && d <= maxDim,
          );
          const qualitySteps = [...new Set([quality, 0.88, 0.8, 0.7, 0.6])].filter(
            (q) => q <= quality,
          );
          let dataUrl = this.encodeWithSize(img, dimSteps[0], qualitySteps[0]);
          for (const dim of dimSteps) {
            for (const q of qualitySteps) {
              dataUrl = this.encodeWithSize(img, dim, q);
              if (dataUrl.length <= maxBytes) break;
            }
            if (dataUrl.length <= maxBytes) break;
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Ảnh dán từ clipboard (thường là ảnh chụp màn hình PNG): vừa giới hạn thì giữ nguyên file,
   * không nén lại nên không mờ chữ; quá lớn mới chuyển JPEG chất lượng cao, cạnh dài tới 2560px.
   */
  async compressPastedImage(file: File, maxBytes = 900000): Promise<string> {
    const original = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    if (original.length <= maxBytes && /^data:image\/(png|jpeg|webp|gif);/.test(original)) {
      return original;
    }
    return this.compressImage(file, 2560, 0.92, maxBytes);
  }

  private encodeWithSize(
    img: HTMLImageElement,
    maxDim: number,
    quality: number,
  ): string {
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = h * (maxDim / w);
        w = maxDim;
      } else {
        w = w * (maxDim / h);
        h = maxDim;
      }
    }
    w = Math.round(w);
    h = Math.round(h);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  }

  async saveSubmissionImage(
    submissionId: string,
    studentId: string,
    base64Data: string,
    index: number,
  ): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'submissionImages'), {
      submissionId,
      studentId,
      index,
      base64Data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  // Ảnh đã tải trong phiên này, để chuyển trang không phải tải lại; ghi ảnh thì cập nhật luôn
  // Giữ tối đa 40 ảnh gần nhất (mỗi ảnh tới ~900KB), bỏ ảnh dùng lâu nhất
  private submissionImageCache = new Map<string, Promise<string | null>>();
  private readonly IMAGE_CACHE_MAX = 40;

  private cacheImage(imageId: string, value: Promise<string | null>): void {
    this.submissionImageCache.delete(imageId);
    this.submissionImageCache.set(imageId, value);
    if (this.submissionImageCache.size > this.IMAGE_CACHE_MAX) {
      const oldest = this.submissionImageCache.keys().next().value;
      if (oldest !== undefined) this.submissionImageCache.delete(oldest);
    }
  }

  getSubmissionImage(imageId: string): Promise<string | null> {
    let cached = this.submissionImageCache.get(imageId);
    if (!cached) {
      cached = getDoc(doc(this.firestore, 'submissionImages', imageId)).then(
        (d) => (d.exists() ? (d.data() as any)['base64Data'] || null : null),
      );
      // Lỗi mạng thì bỏ khỏi cache để lần sau thử lại
      const pending = cached;
      pending.catch(() => {
        if (this.submissionImageCache.get(imageId) === pending) {
          this.submissionImageCache.delete(imageId);
        }
      });
    }
    this.cacheImage(imageId, cached);
    return cached;
  }

  /** Tải lại một ảnh từ server, bỏ bản trong cache (ví dụ giáo viên khác vừa vẽ lên). */
  refreshSubmissionImage(imageId: string): Promise<string | null> {
    this.submissionImageCache.delete(imageId);
    return this.getSubmissionImage(imageId);
  }

  /** Tải song song nhiều ảnh, giữ đúng thứ tự, bỏ qua ảnh thiếu hoặc lỗi. */
  async getSubmissionImages(imageIds: string[]): Promise<string[]> {
    const results = await Promise.all(
      imageIds.map((id) => this.getSubmissionImage(id).catch(() => null)),
    );
    return results.filter((url): url is string => !!url);
  }

  async updateSubmissionImage(
    imageId: string,
    base64Data: string,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissionImages', imageId), {
      base64Data,
    });
    this.cacheImage(imageId, Promise.resolve(base64Data));
  }

  async saveGradedImage(
    submissionId: string,
    studentId: string,
    base64Data: string,
    index: number,
  ): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'gradedImages'), {
      submissionId,
      studentId,
      index,
      base64Data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async getGradedImage(imageId: string): Promise<string | null> {
    const d = await getDoc(doc(this.firestore, 'gradedImages', imageId));
    if (!d.exists()) return null;
    return (d.data() as any)['base64Data'] || null;
  }

  // ==================== ẢNH ĐÍNH KÈM BÌNH LUẬN ====================
  // Mỗi ảnh một document trong `commentImages` vì mỗi ảnh tới ~900KB, không nhét chung
  // nhiều ảnh vào một bình luận được (giới hạn 1MB/document).
  private commentImageCache = new Map<string, Promise<string | null>>();

  async saveCommentImage(base64Data: string): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'commentImages'), {
      base64Data,
      createdAt: new Date().toISOString(),
    });
    this.commentImageCache.set(ref.id, Promise.resolve(base64Data));
    return ref.id;
  }

  getCommentImage(imageId: string): Promise<string | null> {
    let cached = this.commentImageCache.get(imageId);
    if (!cached) {
      cached = getDoc(doc(this.firestore, 'commentImages', imageId))
        .then((d) => (d.exists() ? (d.data() as any)['base64Data'] || null : null))
        .catch(() => {
          this.commentImageCache.delete(imageId);
          return null;
        });
      this.commentImageCache.set(imageId, cached);
    }
    return cached;
  }

  /** Lưu các ảnh mới trong danh sách, trả về mã ảnh đúng theo thứ tự Hình 1, Hình 2… */
  persistAttachments(drafts: AttachmentDraft[]): Promise<string[]> {
    return Promise.all(
      drafts.map((d) => d.imageId ?? this.saveCommentImage(d.dataUrl)),
    );
  }

  /** Dựng danh sách ảnh để sửa từ một bình luận (kể cả bình luận cũ chỉ có imageUrl). */
  async loadAttachmentDrafts(c: {
    imageIds?: string[];
    imageNotes?: string[];
    imageUrl?: string;
  }): Promise<AttachmentDraft[]> {
    if (c.imageIds?.length) {
      const urls = await Promise.all(c.imageIds.map((id) => this.getCommentImage(id)));
      return c.imageIds
        .map((imageId, i) => ({
          imageId,
          dataUrl: urls[i] || '',
          note: c.imageNotes?.[i] || '',
        }))
        .filter((d) => d.dataUrl);
    }
    return c.imageUrl ? [{ dataUrl: c.imageUrl }] : [];
  }

  async deleteCommentImages(imageIds: string[]): Promise<void> {
    await Promise.all(
      imageIds.map((id) => {
        this.commentImageCache.delete(id);
        return deleteDoc(doc(this.firestore, 'commentImages', id)).catch(() => {});
      }),
    );
  }

  async deleteSubmissionImages(imageIds: string[]): Promise<void> {
    for (const id of imageIds) {
      this.submissionImageCache.delete(id);
      try {
        await deleteDoc(doc(this.firestore, 'submissionImages', id));
      } catch (e) {}
    }
  }
}
