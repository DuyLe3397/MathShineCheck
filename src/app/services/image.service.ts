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

  compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
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
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

  async getSubmissionImage(imageId: string): Promise<string | null> {
    const d = await getDoc(doc(this.firestore, 'submissionImages', imageId));
    if (!d.exists()) return null;
    return (d.data() as any)['base64Data'] || null;
  }

  async updateSubmissionImage(
    imageId: string,
    base64Data: string,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'submissionImages', imageId), {
      base64Data,
    });
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
      try {
        await deleteDoc(doc(this.firestore, 'submissionImages', id));
      } catch (e) {}
    }
  }
}
