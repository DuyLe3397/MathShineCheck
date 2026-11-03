// Nối lib/zalo.js với Firestore REST và Zalo Bot API thật.
import { deleteDocument, getDoc, putDoc, queryDocs, writeDocIf } from './firestore.js';
import { notifySubmission, sendZaloMessage } from './zalo.js';

const db = { getDoc, queryDocs, writeDocIf, putDoc, deleteDocument };
const appUrl = () => process.env.APP_URL || 'https://mathshine-check-274.web.app';

/** Gửi Thông báo Zalo cho một Lần nộp (nút đỏ). Không bao giờ ném lỗi. */
export async function notifySubmissionSafe(submissionId) {
  try {
    return await notifySubmission(submissionId, { db, send: (chatId, text) => sendZaloMessage(chatId, text), appUrl: appUrl() });
  } catch (err) {
    console.error('zalo notify failed', submissionId, err);
    return { sent: 0, reason: 'error' };
  }
}
