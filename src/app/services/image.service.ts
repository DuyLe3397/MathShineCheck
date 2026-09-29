import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private firestore = inject(Firestore);

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
          const dimSteps = [maxDim, 1600, 1280, 1024].filter((d) => d > 0);
          const qualitySteps = [quality, 0.8, 0.7, 0.6];
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

  async deleteSubmissionImages(imageIds: string[]): Promise<void> {
    for (const id of imageIds) {
      this.submissionImageCache.delete(id);
      try {
        await deleteDoc(doc(this.firestore, 'submissionImages', id));
      } catch (e) {}
    }
  }
}
