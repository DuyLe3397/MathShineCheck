export const environment = {
  production: true,
  /** API gửi Email thông báo (email-api/, deploy trên Vercel). Để trống thì không gửi. */
  emailApiUrl: 'https://mathshine-email-api.vercel.app/api/notify',
  /** API nhắn Zalo cho học sinh khi giáo viên chấm / nhận xét (email-api/api/zalo-notify.js). Để trống thì không gửi. */
  zaloNotifyUrl: 'https://mathshine-email-api.vercel.app/api/zalo-notify',
  /** Tên Zalo Bot học sinh nhắn mã liên kết; zaloBotUrl là link mở chat với bot (để trống nếu chưa có). */
  zaloBotName: 'Bot MathShine Check',
  zaloBotUrl: 'https://zalo.me/2202012185762172291',
  firebase: {
    apiKey: 'AIzaSyACnurThbikN3vxXLODB3DB9sKxSq-TDzM',
    authDomain: 'mathshine-check-274.firebaseapp.com',
    projectId: 'mathshine-check-274',
    storageBucket: 'mathshine-check-274.firebasestorage.app',
    messagingSenderId: '374397999468',
    appId: '1:374397999468:web:f357aae834fddabebf7b49',
  },
};
