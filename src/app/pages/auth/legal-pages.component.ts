import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-legal-pages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f5f7fa;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      }
      .top-bar {
        background: linear-gradient(90deg, #1e3a8a 0%, #312e81 100%);
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand {
        color: #fff;
        font-weight: 800;
        font-size: 1.1rem;
        text-decoration: none;
        letter-spacing: 0.5px;
      }
      .back-link {
        color: #c7d2fe;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .back-link:hover {
        color: #fff;
        text-decoration: underline;
      }
      .page-content {
        max-width: 820px;
        margin: 0 auto;
        padding: 40px 24px 60px;
      }
      .legal-card {
        background: #fff;
        border-radius: 16px;
        padding: 40px 48px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      h1 {
        font-size: 2rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 8px;
      }
      .updated {
        font-size: 0.85rem;
        color: #94a3b8;
        margin: 0 0 24px;
      }
      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e3a8a;
        margin: 28px 0 10px;
      }
      p {
        color: #475569;
        line-height: 1.7;
        margin: 0 0 12px;
      }
      ul {
        color: #475569;
        line-height: 1.8;
        margin: 0 0 12px;
        padding-left: 22px;
      }
      li {
        margin-bottom: 6px;
      }
      .contact-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .contact-list li {
        padding: 12px 16px;
        background: #f8fafc;
        border-radius: 10px;
        margin-bottom: 10px;
        color: #334155;
        font-size: 0.95rem;
      }
      .contact-list strong {
        color: #1e293b;
      }
      .footer-note {
        font-size: 0.85rem;
        color: #94a3b8;
        text-align: center;
        margin-top: 24px;
      }
      @media (max-width: 768px) {
        .legal-card {
          padding: 24px 20px;
        }
        h1 {
          font-size: 1.6rem;
        }
      }
    `,
  ],
  template: `
    <div class="top-bar">
      <a class="brand" routerLink="/role-select">MathShine Education</a>
      <a class="back-link" routerLink="/role-select">← Quay lại</a>
    </div>

    <div class="page-content">
      <div class="legal-card">
        @if (page === 'privacy-policy') {
          <h1>Chính sách quyền riêng tư</h1>
          <p class="updated">Cập nhật lần cuối: 2026</p>
          <p>
            MathShine Education cam kết bảo vệ quyền riêng tư của học sinh,
            phụ huynh và giáo viên khi sử dụng hệ thống. Chính sách này mô tả
            cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
          </p>
          <h2>1. Thông tin chúng tôi thu thập</h2>
          <ul>
            <li>Họ tên, lớp, nhóm của học sinh để xác thực đăng nhập.</li>
            <li>Ảnh bài làm, điểm số và nhận xét của giáo viên.</li>
            <li>Nội dung thảo luận và bình luận giữa học sinh và giáo viên.</li>
          </ul>
          <h2>2. Mục đích sử dụng</h2>
          <ul>
            <li>Quản lý và chấm điểm bài tập về nhà.</li>
            <li>Trao đổi thảo luận trong nhóm học tập.</li>
            <li>Cải thiện chất lượng giảng dạy và trải nghiệm người dùng.</li>
          </ul>
          <h2>3. Chia sẻ thông tin</h2>
          <p>
            Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của bạn cho bên
            thứ ba, trừ khi được pháp luật yêu cầu hoặc được bạn đồng ý rõ ràng.
          </p>
          <h2>4. Bảo mật dữ liệu</h2>
          <p>
            Dữ liệu được lưu trữ trên nền tảng Firebase của Google với mã hóa
            khi truyền tải. Chúng tôi áp dụng các biện pháp bảo mật hợp lý để
            bảo vệ thông tin khỏi truy cập trái phép.
          </p>
          <h2>5. Quyền của bạn</h2>
          <p>
            Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của
            mình bất kỳ lúc nào bằng cách liên hệ với giáo viên quản lý hoặc
            bộ phận hỗ trợ.
          </p>
        }

        @if (page === 'terms-of-service') {
          <h1>Điều khoản sử dụng</h1>
          <p class="updated">Cập nhật lần cuối: 2026</p>
          <p>
            Khi sử dụng MathShine Education, bạn đồng ý tuân thủ các điều khoản
            và điều kiện dưới đây.
          </p>
          <h2>1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc truy cập hệ thống, bạn xác nhận đã đọc và đồng ý với toàn
            bộ điều khoản này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
          </p>
          <h2>2. Tài khoản người dùng</h2>
          <ul>
            <li>Thông tin đăng nhập phải chính xác và thuộc về bạn.</li>
            <li>Bạn chịu trách nhiệm với mọi hoạt động trên tài khoản của mình.</li>
            <li>Không được mạo danh người khác hoặc sử dụng tài khoản trái phép.</li>
          </ul>
          <h2>3. Sử dụng hợp lý</h2>
          <ul>
            <li>Không đăng tải nội dung bất hợp pháp, xúc phạm hoặc vi phạm bản quyền.</li>
            <li>Không phá hoại, can thiệp hoặc lạm dụng hệ thống.</li>
            <li>Không chia sẻ thông tin bài làm, đáp án một cách gian lận.</li>
          </ul>
          <h2>4. Nội dung người dùng</h2>
          <p>
            Bạn giữ quyền sở hữu nội dung bạn đăng tải. Khi gửi bài làm, bạn cấp
            cho giáo viên quyền xem, chấm điểm và lưu trữ nội dung đó phục vụ
            mục đích học tập.
          </p>
          <h2>5. Thay đổi dịch vụ</h2>
          <p>
            Chúng tôi có thể cập nhật, tạm ngừng hoặc ngừng cung cấp một phần
            dịch vụ bất kỳ lúc nào để nâng cao chất lượng.
          </p>
          <h2>6. Giới hạn trách nhiệm</h2>
          <p>
            Hệ thống được cung cấp "nguyên trạng". Chúng tôi không chịu trách
            nhiệm đối với tổn thất gián tiếp phát sinh từ việc sử dụng dịch vụ.
          </p>
        }

        @if (page === 'acceptable-use-policy') {
          <h1>Chính sách sử dụng hợp lý</h1>
          <p class="updated">Cập nhật lần cuối: 2026</p>
          <p>
            Chính sách này quy định hành vi được phép và không được phép khi sử
            dụng nền tảng MathShine Education.
          </p>
          <h2>Hành vi được khuyến khích</h2>
          <ul>
            <li>Nộp bài đúng hạn, trung thực và đúng quy định.</li>
            <li>Trao đổi văn minh, tôn trọng trong thảo luận và bình luận.</li>
            <li>Giúp đỡ bạn bè học tập theo hướng tích cực.</li>
          </ul>
          <h2>Hành vi bị cấm</h2>
          <ul>
            <li>Sử dụng tài khoản của người khác hoặc giả mạo danh tính.</li>
            <li>Đăng tải nội dung xúc phạm, quấy rối hoặc phân biệt đối xử.</li>
            <li>Chia sẻ đáp án hoặc gian lận trong quá trình kiểm tra.</li>
            <li>Đăng tải thông tin sai lệch, quảng cáo hoặc thư rác.</li>
            <li>Cố tình làm hỏng dữ liệu hoặc can thiệp hệ thống.</li>
          </ul>
          <h2>Hậu quả vi phạm</h2>
          <p>
            Vi phạm chính sách có thể dẫn đến cảnh cáo, tạm khóa tài khoản hoặc
            xóa tài khoản tùy theo mức độ. Quyết định cuối cùng thuộc về ban
            quản trị.
          </p>
        }

        @if (page === 'contact') {
          <h1>Liên hệ</h1>
          <p class="updated">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
          <p>
            Nếu bạn có bất kỳ câu hỏi, góp ý hoặc cần hỗ trợ, vui lòng liên hệ
            với chúng tôi qua các kênh dưới đây.
          </p>
          <ul class="contact-list">
            <li>
              <strong>📧 Email:</strong> support&#64;mathshine.edu.vn
            </li>
            <li>
              <strong>📞 Hotline:</strong> 1900 1234 (8:00 - 18:00 hàng ngày)
            </li>
            <li>
              <strong>🌐 Website:</strong> https://mathshine-check-274.web.app
            </li>
            <li>
              <strong>🏢 Địa chỉ:</strong> Việt Nam
            </li>
          </ul>
          <p>
            Chúng tôi thường phản hồi trong vòng 24-48 giờ làm việc. Cảm ơn bạn
            đã tin tưởng và sử dụng MathShine Education!
          </p>
        }
      </div>

      <p class="footer-note">
        © 2026 MathShine Education. All rights reserved. | Developed by Duy Le
      </p>
    </div>
  `,
})
export class LegalPagesComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  page = '';

  ngOnInit(): void {
    const url = this.router.url.split('?')[0].replace(/^\//, '');
    this.page = url || 'contact';
  }
}
