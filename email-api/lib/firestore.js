// Đọc/ghi Firestore qua REST. Luật Firestore của dự án cho phép đọc công khai
// các collection cần dùng, nên không cần service account.

function baseUrl() {
  const project = process.env.FIREBASE_PROJECT_ID || 'mathshine-check-274';
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
}

export function decodeValue(v) {
  if (!v || typeof v !== 'object') return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return undefined;
}

export function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

/**
 * Trả về { id, data, createTime, updateTime } hoặc null nếu không có document.
 * createTime/updateTime là giờ server, không phụ thuộc đồng hồ máy học sinh.
 */
export async function getDoc(collection, id) {
  if (!id) return null;
  const res = await fetch(`${baseUrl()}/${collection}/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${collection}/${id}: ${res.status}`);
  const json = await res.json();
  return {
    id,
    data: decodeFields(json.fields),
    createTime: json.createTime,
    updateTime: json.updateTime,
  };
}

/**
 * Đánh dấu `emailSentAt` cho document, chỉ thành công khi document chưa đổi
 * kể từ lần đọc (precondition updateTime). Trả về true nếu giành được quyền gửi.
 */
export async function claimEmail(collection, id, updateTime) {
  const params = new URLSearchParams({
    'updateMask.fieldPaths': 'emailSentAt',
    'currentDocument.updateTime': updateTime,
  });
  const res = await fetch(`${baseUrl()}/${collection}/${encodeURIComponent(id)}?${params}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { emailSentAt: { stringValue: new Date().toISOString() } } }),
  });
  return res.ok;
}

const encodeValue = (v) => (Array.isArray(v) ? { arrayValue: { values: v.map(encodeValue) } } : { stringValue: String(v) });

/**
 * Truy vấn một collection. where: [field, 'EQUAL' | 'IN', value]; orderBy: [field, 'ASCENDING' | 'DESCENDING'].
 * Chỉ dùng truy vấn một trường (lọc hoặc sắp) để không cần composite index.
 * Trả về [{ id, ...data }].
 */
export async function queryDocs(collection, { where, orderBy, limit } = {}) {
  const structuredQuery = { from: [{ collectionId: collection }] };
  if (where) structuredQuery.where = { fieldFilter: { field: { fieldPath: where[0] }, op: where[1], value: encodeValue(where[2]) } };
  if (orderBy) structuredQuery.orderBy = [{ field: { fieldPath: orderBy[0] }, direction: orderBy[1] }];
  if (limit) structuredQuery.limit = limit;
  const res = await fetch(`${baseUrl()}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`Firestore query ${collection}: ${res.status}`);
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => ({ id: r.document.name.split('/').pop(), ...decodeFields(r.document.fields) }));
}

/** Gỡ `emailSentAt` khi gửi thất bại để lần gọi sau có thể gửi lại. */
export async function releaseEmail(collection, id) {
  const params = new URLSearchParams({ 'updateMask.fieldPaths': 'emailSentAt' });
  await fetch(`${baseUrl()}/${collection}/${encodeURIComponent(id)}?${params}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {} }),
  }).catch(() => {});
}
