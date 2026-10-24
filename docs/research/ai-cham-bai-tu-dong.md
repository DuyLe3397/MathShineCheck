# Nghiên cứu: dùng Claude hỗ trợ giáo viên chấm bài Toán tự động trong MathShine Check

> Ngày nghiên cứu: 2026-10-25. Mọi nguồn web dưới đây được truy cập ngày 2026-10-25.
> Phạm vi: AI đọc ảnh bài làm viết tay, so với đề và đáp án, đề xuất dấu mực đỏ, Nhận xét theo ảnh, Nhận xét chung và điểm. Mọi thứ AI tạo ra đều là **bản nháp ẩn** cho tới khi giáo viên duyệt.
> Bối cảnh: giáo viên đã mua gói Claude Pro, muốn dùng Claude vì tin vào khả năng đọc ảnh, và muốn dấu chấm cùng giọng nhận xét giống mình.
>
> Quy ước: trích dẫn repo theo dạng `file:dòng`, đọc trên working copy ngày 2026-10-25. Lúc đọc, `firestore.rules` và `src/app/models/index.ts` có thay đổi chưa commit. Số liệu ghi "(tính)" là do tôi tự tính từ công thức và bảng giá chính thức. Ý nào chưa có nguồn gốc kiểm chứng thì ghi **chưa xác minh**. Tài liệu này chỉ là nghiên cứu: không sửa code, không đổi rule.

---

## 1. Tóm tắt và khuyến nghị

**Trả lời ngắn từng câu hỏi**

1. **Gói Pro không cho gọi Claude API.** "The Pro plan does not include API usage through the Claude Console" ([Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)). API là sản phẩm riêng, trả tiền theo token qua Console. Pro **có** Claude Code, nhưng dùng chung hạn mức 5 giờ và hạn mức tuần với claude.ai ([Claude Code với Pro](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)). Vì vậy, với gói Pro hiện có, có hai cách chạy khả thi:
   - giáo viên tự tải ảnh lên claude.ai;
   - giáo viên mở Claude Code trên máy mình (đăng nhập bằng Pro) và ra lệnh. Claude Code gọi API của MathShine qua một MCP server hoặc script.

   Cả hai cách đều cần giáo viên ngồi chạy. Muốn chạy tự động không người thì phải dùng API trả theo token (mục 3).
2. **Claude không tạo được ảnh**: "it cannot generate, produce, edit, manipulate, or create images" ([Vision FAQ](https://platform.claude.com/docs/en/build-with-claude/vision)). Ảnh "mực đỏ" phải làm thế này: Claude trả **JSON gồm tọa độ pixel và loại dấu**, rồi code của MathShine vẽ lên ảnh. Tài liệu nói tọa độ của Claude "approximate", nên giáo viên phải được kéo chỉnh dấu trước khi duyệt (mục 4).
3. **Chi phí API cho một lớp 40 bài, mỗi bài 3 ảnh (tính):**

   | Model | Giá thường | Dùng Batch API |
   |---|---|---|
   | Opus 5.5 | khoảng **8 USD** | khoảng 4 USD |
   | Sonnet 5.5 | khoảng 4 USD | khoảng 2 USD |
   | Haiku 5.5 | khoảng 0,2 USD | khoảng 0,1 USD |

   Khoảng dao động từ 2 đến 14 USD với Opus, tùy số ảnh và độ dài lời giải thích (mục 3.6). Một ảnh 1920×1440 mà app đang lưu tốn 3.588 token.
4. **Rule Firestore hiện không ẩn được gì với học sinh.** Học sinh không đăng nhập Firebase Auth (`auth.service.ts:117-128`), và gần như mọi collection đều là `allow read: if true` (`firestore.rules:66-71` cho `comments`, `:59-64` cho `grades`, `:93-111` cho thông báo và ảnh). Vì vậy:
   - Bản nháp AI **phải nằm ở collection mới** chỉ giáo viên đọc được (`gradingDrafts`). Không được nằm trong `comments`, `grades`, `submissionImages`, `teacherNotifications`.
   - `isTeacher()` hiện tại chỉ kiểm tra có document `teachers/{uid}` không. Document này người dùng tự tạo được (`firestore.rules:5,7-10`; `auth.service.ts:81-90`), và Firebase Auth mặc định cho tự đăng ký. Phải siết lại `isTeacher()` thì phần "ẩn" mới có nghĩa (mục 6.2).
5. **"Giống giáo viên chấm"** làm được ở mức khá:
   - giọng văn: dùng nhận xét cũ của chính giáo viên làm ví dụ mẫu (few-shot);
   - nét mực: cùng màu `#ef4444`, cùng độ dày bút như công cụ vẽ hiện có, kèm mẫu ✓ ✗ do giáo viên tự vẽ.

   Nhưng **không bảo đảm** học sinh không nhận ra, và AI vẫn đọc sai chữ viết tay. Bước duyệt là bắt buộc (mục 7).
6. **Chính sách sử dụng** (bản có hiệu lực từ 12/11/2026) có nhóm rủi ro cao "Education and credentials". Nhóm này áp dụng cho việc chấm bài thi quyết định tuyển sinh, tốt nghiệp hoặc cấp chứng chỉ. Khi rơi vào nhóm đó, chính sách yêu cầu (a) người có chuyên môn duyệt thực chất và (b) người bị ảnh hưởng "clearly told that AI was used". Bài tập về nhà thường ngày có thuộc nhóm này không thì cần giáo viên/nhà trường tự đánh giá (mục 8).

**Khuyến nghị:** xây **một lõi chung** gồm:
- Bản nháp chấm (`gradingDrafts`);
- rule chỉ giáo viên đọc;
- màn hình duyệt trong trang Chấm bài;
- API nhỏ trên Vercel.

Bộ chạy AI thì để thay được:
1. Thử nghiệm ngay **không cần code**: chạy 10 bài đã chấm tay qua Claude Code hoặc claude.ai bằng gói Pro, rồi đo độ chính xác (mục 9).
2. Nếu đạt, dùng **phương án B** (Claude Code + Pro gọi API MathShine).
3. Chỉ chuyển sang **phương án C** (Claude API + Batch, tự động) khi số bài vượt quá hạn mức Pro.

## 2. Bảng so sánh phương án

| | **A. claude.ai (Pro) thủ công** | **B. Claude Code (Pro) + API MathShine** | **C. Dịch vụ tự động, Claude API** | **D. Lai B + C** |
|---|---|---|---|---|
| Cách chạy | Tải ảnh bài làm (nút tải đã có), dán vào claude.ai kèm prompt và đáp án. Chép JSON kết quả vào nút "Nhập kết quả AI" trong trang Chấm bài | Giáo viên mở Claude Code trên máy, gõ "chấm bài tập X". Claude gọi công cụ MCP/script để lấy bài và ảnh, rồi đẩy bản nháp lên | Hàm Vercel theo lịch (cron) gom bài mới, gửi Message Batches API, nhận kết quả và ghi bản nháp | Dùng B hằng ngày. Khi dồn bài hoặc hết hạn mức thì bật C. Cùng một API và một kiểu bản nháp |
| Chi phí thêm | 0 USD (trong hạn mức Pro) | 0 USD (trong hạn mức Pro, dùng chung với claude.ai) | Khoảng 2–8 USD mỗi lớp 40 bài với Opus 5.5 Batch, khoảng 1–4 USD với Sonnet 5.5 Batch (mục 3.6) | Như B, cộng C khi bật |
| Công sức xây | Thấp: nút nhập JSON, bản nháp, rule, màn hình duyệt | Trung bình: phần của A, cộng API Vercel và MCP server/script | Cao hơn B: thêm hàng đợi, cron, theo dõi batch, xử lý lỗi, giữ khóa API | B + C |
| Mức tự động | Thấp: mỗi bài vài thao tác tay | Trung bình: một lệnh chấm cả lô, giáo viên vẫn phải mở máy | Cao: chạy không cần giáo viên, giáo viên chỉ duyệt | Cao khi cần |
| Rủi ro chính | Thao tác tay dễ nhầm bài. Mỗi tin nhắn tối đa 20 ảnh. Ảnh học sinh nằm trên tài khoản cá nhân (phụ thuộc cài đặt Model Improvement, mục 8.3) | Hạn mức Pro không công bố số cụ thể. Điều khoản nói hạn mức Pro giả định "ordinary, individual usage". Không chạy được khi không có người (mục 3.3) | Phải giữ bí mật khóa API và service account. Chi phí tăng theo số bài. Giới hạn Vercel 300 giây và body 4,5 MB | Phức tạp nhất |

Dù chọn phương án nào thì vẫn phải có phần lõi ở mục 6: rule ẩn, bản nháp và màn hình duyệt. Nếu thiếu phần này thì phương án nào cũng có thể để lộ bản nháp cho học sinh.

## 3. Gói Pro, Claude API, Claude Code, MCP (câu hỏi 1)

### 3.1 claude.ai với gói Pro
- Pro có giá 20 USD/tháng ở Mỹ, có "More usage per session than the Free plan", có hạn mức phiên reset mỗi 5 giờ và hạn mức tuần, và **có Claude Code**. Pro "does not include API usage through the Claude Console" ([What is the Pro plan?](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)).
- Gói trả phí và API là hai sản phẩm riêng: "Claude paid plans and the Claude Console are separate products designed for different purposes" ([Why is API usage billed separately](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan)). Tài khoản Claude và tài khoản Console có thể dùng chung email nhưng hoạt động độc lập ([Claude account và Console account](https://support.claude.com/en/articles/8987223-can-i-have-a-claude-account-and-a-console-account)).
- Giới hạn ảnh trên claude.ai: tối đa 20 ảnh mỗi tin nhắn, mỗi ảnh tối đa 10 MB ([Vision – Request limits](https://platform.claude.com/docs/en/build-with-claude/vision)).
- Tài liệu không công bố số tin nhắn cụ thể. Mức dùng phụ thuộc độ dài hội thoại, độ phức tạp, model và mức effort ([How do usage and length limits work?](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)). Ảnh tốn bao nhiêu hạn mức thì **chưa xác minh**.

### 3.2 Claude API (Console)
- Trả theo token, nạp trước tiền vào Console ([How do I pay for my Claude API usage?](https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage)). Giá ở mục 3.6.
- Đây là con đường **duy nhất được phép** cho một dịch vụ tự động. Tài liệu pháp lý của Claude Code viết: developer xây sản phẩm "should use API key authentication through Claude Console", và Anthropic không cho phép "route requests through Free, Pro, or Max plan credentials on behalf of their users" ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)).

### 3.3 Claude Code với gói Pro
- Gói Pro dùng được Claude Code trong terminal và trong IDE (VS Code, JetBrains…). Hạn mức "shared across Claude and Claude Code, meaning all activity in both tools counts against the same limits" ([Use Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)).
- Hết hạn mức thì có thể bật usage credits. Khi đó phần vượt tính theo giá API. **Lưu ý:** nếu máy có biến môi trường `ANTHROPIC_API_KEY` thì Claude Code dùng khóa đó và tính tiền API thay vì dùng gói (cùng nguồn).
- Pro được dùng model nào trong Claude Code thì bài hướng dẫn không nói. **Chưa xác minh.** Giáo viên có thể kiểm tra bằng lệnh `/model` và `/status`.
- **Đọc ảnh:** công cụ Read của Claude Code trả PNG, JPEG, GIF, WebP "as visual content that Claude can see". Ảnh lớn được Claude Code "resizes and recompresses… so Claude may see a downscaled version" ([Tools reference](https://code.claude.com/docs/en/tools-reference)). Ngưỡng thu nhỏ cụ thể của Claude Code **chưa xác minh**. Điều này ảnh hưởng tới việc quy đổi tọa độ (mục 4.4).
- **Chạy bằng script:** `claude -p "…"` chạy không tương tác, có `--output-format json` và `--json-schema` để ép đầu ra theo schema ([Run Claude Code programmatically](https://code.claude.com/docs/en/headless)). Chế độ `--bare`, chế độ được khuyên dùng cho CI, **không dùng đăng nhập gói** mà cần `ANTHROPIC_API_KEY` (cùng nguồn). Vì vậy script chạy bằng gói Pro phải là `claude -p` thường, không có `--bare`, và chạy trên máy đã đăng nhập.
- **Giới hạn về điều khoản:** "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK". Đăng nhập OAuth của gói dành cho "ordinary use of Claude Code and other native Anthropic applications" ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)). Giáo viên tự mở Claude Code để chấm bài của lớp mình là cách dùng cá nhân. Còn dựng một máy chủ chạy 24/7 bằng tài khoản Pro thì không khớp với các câu trên. Ranh giới chính xác giữa hai trường hợp **chưa xác minh**; muốn chắc thì nên hỏi Anthropic.

### 3.4 MCP và công cụ tùy chỉnh
- **Trong Claude Code:** thêm server cục bộ bằng `claude mcp add --transport stdio <tên> -- <lệnh>` ("Stdio servers run as local processes on your machine"), hoặc server từ xa bằng `--transport http <url>`. Đầu ra của công cụ MCP bị cảnh báo khi vượt 10.000 token và mặc định bị cắt ở 25.000 token (`MAX_MCP_OUTPUT_TOKENS`) ([MCP](https://code.claude.com/docs/en/mcp)). Công cụ MCP trả ảnh thì Claude có thấy không: chưa đọc tới đoạn đó, **chưa xác minh**. Cách chắc chắn: công cụ MCP tải ảnh về thư mục tạm rồi trả đường dẫn, Claude đọc ảnh bằng Read.
- **Trong claude.ai (custom connector):** Pro thêm được remote MCP server. Nhưng kết nối đi "from Anthropic's cloud infrastructure", nên server "must be reachable over the public internet". Có thể gắn khóa cố định qua "Request headers" ([Custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)). Như vậy chính hàm Vercel của MathShine có thể làm MCP server cho claude.ai. Ảnh trả từ connector có hiển thị cho Claude trên claude.ai không thì **chưa xác minh**.

### 3.5 Model nên dùng

| Model | ID | Giá (input / output, USD mỗi triệu token) | Ghi chú chính thức |
|---|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | 4 / 20 | "start with Claude Opus 5.5 for most workloads". Effort mặc định `medium` |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2 / 10 | "The best combination of speed and intelligence" |
| Claude Haiku 5.5 | `claude-haiku-5-5` | từ 0,10 / 0,50 | "high-volume, latency-sensitive tasks such as classification, extraction, and routing" |

Nguồn: [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). Cả ba model đều có 1M token ngữ cảnh, tối đa 128K token đầu ra, và nhận ảnh. Theo bảng tầng độ phân giải ("Claude 4.7 and later models" là tầng cao), cả ba đều ở **tầng độ phân giải cao**: cạnh dài tối đa 2.576 px, tối đa 4.784 token thị giác ([Vision](https://platform.claude.com/docs/en/build-with-claude/vision)). Có thể kiểm tra lại bằng Models API.

Đề xuất: thử nghiệm song song **Opus 5.5** (đặt effort `high` cho việc chấm) và **Sonnet 5.5** trên cùng 10 bài, rồi chọn theo tỉ lệ đúng. Haiku 5.5 không nên dùng để chấm vì việc chấm cần suy luận. Mức chênh chất lượng giữa các model với chữ viết tay tiếng Việt **chưa xác minh**: tài liệu không có số đo cho loại việc này.

### 3.6 Ước tính chi phí API

**Cách tính token ảnh (chính thức):** "An image… costs `⌈width / 28⌉ × ⌈height / 28⌉` visual tokens". Ảnh vượt giới hạn tầng thì bị thu nhỏ, tối đa 4.784 token ở tầng cao ([Vision – Resolution and token cost](https://platform.claude.com/docs/en/build-with-claude/vision)).

**Ảnh thật trong MathShine:** `compressImage` thu cạnh dài về 1920, 1600, 1280 hoặc 1024 px, chất lượng JPEG từ 0,88 xuống, cho tới khi chuỗi base64 ≤ 900.000 ký tự (`image.service.ts:35-68`). Ảnh điện thoại 4:3 vì vậy thường là:
- 1920×1440: 69 × 52 = **3.588 token** (tính);
- 1600×1200: 2.494 token;
- 1280×960: 1.610 token.

Cả ba cỡ đều nằm trong giới hạn tầng cao, nên **không bị thu nhỏ**. Tọa độ Claude trả về khớp 1:1 với ảnh đang lưu. Đây là điểm thuận lợi (mục 4.4).

**Bảng giá dùng để tính** ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing)):
- Opus 5.5: 4 USD input, 20 USD output, cache hit 0,20 USD, ghi cache 5 phút 5 USD.
- Sonnet 5.5: 2 / 10 / 0,10 / 2,50 USD.
- Haiku 5.5 (prompt ≤ 100.000 token): 0,10 / 0,50 / 0,01 / 0,125 USD.
- Batch API "50 percent discount on both input and output tokens". Batch và cache cộng dồn được.
- Token suy nghĩ (adaptive thinking) tính như token output, nên ước tính output dưới đây đã gồm cả suy nghĩ.

**Giả định cho một lớp 40 bài (tính):**
- phần dùng chung (hướng dẫn, đề, đáp án, ví dụ giọng văn) có thể cache;
- phần riêng mỗi bài gồm ảnh, khoảng 500–1.500 token chữ, và đầu ra.

| Kịch bản | Ảnh/bài | Input/bài | Output/bài | Opus 5.5 thường | Opus 5.5 Batch + cache | Sonnet 5.5 thường | Sonnet 5.5 Batch + cache | Haiku 5.5 thường |
|---|---|---|---|---|---|---|---|---|
| Thấp | 2 | ~13.700 | 3.000 | 4,59 USD | 1,85 USD | 2,29 USD | 0,93 USD | 0,11 USD |
| Trung bình | 3 | ~19.800 | 6.000 | **7,96 USD** | 3,39 USD | 3,98 USD | 1,70 USD | 0,20 USD |
| Cao | 4 | ~27.900 | 12.000 | 14,06 USD | 6,14 USD | 7,03 USD | 3,07 USD | 0,35 USD |

Ghi chú về bảng:
- Đầu ra là phần đắt nhất: với Opus ở kịch bản trung bình, output chiếm khoảng 60% chi phí.
- Nếu chấm hai lượt (lượt 1 chấm, lượt 2 khoanh vùng trên ảnh cắt nhỏ, mục 4.5) thì chi phí ảnh tăng khoảng 1,5–2 lần.
- Cache 5 phút có thể hết hạn khi batch chạy lâu; có loại cache 1 giờ giá ghi 8 USD (Opus). Con số "Batch + cache" là ước tính lạc quan.
- Lượng output thực tế với lời giải tiếng Việt **chưa xác minh**. Phải đo bằng `usage` trong lần thử đầu.

**Với gói Pro (phương án A/B):** không tốn thêm tiền nhưng tiêu hạn mức. Một lô 40 bài ăn hết bao nhiêu phần hạn mức 5 giờ thì **chưa xác minh**. Đo bằng `/usage` trong Claude Code khi thử 10 bài.

## 4. Claude đọc bài Toán viết tay (câu hỏi 2)

### 4.1 Giới hạn chính thức ([Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support))
- **Định dạng:** JPEG, PNG, GIF, WebP. Ảnh động chỉ lấy khung đầu.
- **Kích thước:** tối đa 8000×8000 px. Mỗi ảnh tối đa 10 MB (base64) trên API. Một request tối đa 32 MB.
- **Số ảnh:** tối đa 600 ảnh mỗi request API với model 1M ngữ cảnh. Nếu một request có hơn 20 ảnh thì mỗi ảnh bị giới hạn chặt hơn; muốn an toàn thì giữ cạnh ≤ 2000 px hoặc ≤ 20 ảnh mỗi request. Trên claude.ai: 20 ảnh mỗi tin nhắn.
- **PDF:** tối đa 600 trang mỗi request (100 trang nếu ngữ cảnh dưới 1M). Mỗi trang được xử lý "as both text and image", khoảng 1.500–3.000 token chữ mỗi trang, cộng chi phí ảnh. Trang PDF được rasterize ở kích thước mình không kiểm soát, nên tọa độ "can't be reliably mapped back onto the page" ([Coordinates](https://platform.claude.com/docs/en/build-with-claude/vision-coordinates)). Vì vậy **không gửi bài làm dạng PDF** nếu cần vẽ dấu.
- Ảnh đặt **trước** phần chữ trong prompt cho kết quả tốt hơn. Khi gửi nhiều ảnh, nên ghi nhãn "Image 1:", "Image 2:"… (cùng nguồn).

### 4.2 Các hạn chế tài liệu nêu
Trích mục [Limitations](https://platform.claude.com/docs/en/build-with-claude/vision#limitations):
- **Accuracy:** "might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels". Ảnh chụp nghiêng, mờ, thiếu sáng là chuyện thường với bài làm chụp bằng điện thoại.
- **Spatial reasoning:** "coordinate and localization outputs are approximate… verify outputs before relying on them".
- **Counting:** chỉ "approximate counts".
- Kết luận của tài liệu: "Do not use Claude for tasks requiring perfect precision or sensitive image analysis without human oversight".

Tài liệu **không** có số đo độ chính xác khi đọc chữ viết tay hay công thức toán viết tay, nên con số này **chưa xác minh** và phải tự đo (mục 9).

### 4.3 Claude không xuất ảnh: cách làm "mực đỏ"
Claude "is an image understanding model only… cannot generate, produce, edit, manipulate, or create images" ([Vision FAQ](https://platform.claude.com/docs/en/build-with-claude/vision)). Quy trình đề xuất:

1. Claude nhận ảnh (đúng cỡ đang lưu), đề và đáp án.
2. Claude trả **JSON theo schema**. Trên API, dùng structured outputs `output_config.format`. Tài liệu tọa độ khuyên dùng chính cách này ([Coordinates](https://platform.claude.com/docs/en/build-with-claude/vision-coordinates), [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)). Trong Claude Code thì dùng `--json-schema`.
3. Code của MathShine vẽ dấu lên canvas của trang Chấm bài **dưới dạng lớp vector có thể sửa**. Chỉ khi giáo viên bấm duyệt mới "đốt" dấu vào JPEG, giống nút 💾 Lưu hiện nay (`grading.component.ts:1419-1441`).

Ví dụ schema (rút gọn):

```json
{
  "imageIndex": 0,
  "imageSize": [1440, 1920],
  "lines": [
    { "line": 3, "bbox": [112, 410, 1290, 486], "readAs": "f'(x) = 2x + 1" }
  ],
  "marks": [
    { "type": "cross", "line": 3, "bbox": [980, 418, 1040, 478], "confidence": "medium" },
    { "type": "underline", "line": 3, "bbox": [700, 470, 960, 486] },
    { "type": "note", "line": 3, "anchor": [1300, 440], "text": "sai dấu" },
    { "type": "tick", "line": 5, "anchor": [1310, 600] }
  ],
  "comments": [
    { "imageIndex": 0, "line": 3, "content": "Đạo hàm sai ở bước 2: \\(f'(x)=\\dfrac{-1}{(x+1)^2}\\)" }
  ],
  "overall": { "proposedScore": 7.5, "comment": "…", "rubric": [{ "item": "Câu 1a", "points": 1, "max": 1 }] }
}
```

Các loại dấu đề xuất: `tick` (✓), `cross` (✗), `underline` (gạch chân), `strike` (gạch bỏ), `circle` (khoanh), `note` (chữ ghi chú ngắn), `score` (điểm từng câu).

### 4.4 Độ chính xác định vị theo tài liệu
- **Hệ tọa độ:** "Claude works best with absolute pixel coordinates". Nên yêu cầu `[x1, y1, x2, y2]` theo pixel. Không nên yêu cầu tọa độ chuẩn hóa 0–1000. Gốc `(0,0)` ở góc trên bên trái ([Coordinates](https://platform.claude.com/docs/en/build-with-claude/vision-coordinates)).
- **Tọa độ là theo ảnh sau khi Claude thu nhỏ.** Claude thu ảnh về cỡ lớn nhất thỏa cả giới hạn cạnh lẫn giới hạn token. Sau đó Claude đệm cạnh dưới và cạnh phải lên bội số của 28; khi quy đổi phải chia theo cỡ đã thu nhỏ, **không** theo cỡ đã đệm. Cách tin cậy nhất là tự thu ảnh trước khi gửi. Nếu muốn chặn thu nhỏ ngầm thì đặt `"transformations": {"oversized_image": "error"}` trên khối ảnh (cùng nguồn).
  - Ảnh 1920×1440 của app nằm trong giới hạn tầng cao, nên qua **API** thì tọa độ dùng thẳng được (tính).
  - Qua **Claude Code**, công cụ Read có thể tự thu nhỏ ảnh lớn (mục 3.3), ngưỡng **chưa xác minh**. Vì vậy MCP server hoặc script nên tự thu ảnh về một cỡ cố định (ví dụ cạnh dài 1568 px) và ghi cỡ đó vào prompt.
- **Chi tiết nhỏ:** "Small elements lose precision when an image is downscaled: for fine targets, crop the region of interest and send the crop" (cùng nguồn).
- **Computer use cũng dùng tọa độ pixel:** ví dụ `left_click` với `coordinate: [x, y]` trên ảnh chụp màn hình. Nếu thu nhỏ ảnh chụp thì phải nhân tọa độ ngược lại. Tài liệu cũng cảnh báo "Small targets may be missed" và "Accuracy varies by model" ([Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)). Ở đây là chọn vùng cỡ một dòng chữ, lớn hơn nhiều so với nút bấm nhỏ trên màn hình. Nhưng sai số thực tế trên bài viết tay **chưa xác minh**.

### 4.5 Cách giảm sai
1. **Chia hai bước: đọc rồi mới chấm.** Bước 1: Claude chép lại từng dòng (`lines[].readAs`) kèm bbox. Bước 2: Claude chấm dựa trên bản chép, mỗi dấu phải trích số `line`. Giáo viên nhìn bản chép là biết ngay AI đọc nhầm chỗ nào. Bản chép cũng giúp đặt dấu vào đúng dòng ngay cả khi bbox lệch.
2. **Dấu bám theo dòng, không bám theo điểm.** Code vẽ ✓/✗ ở lề phải của bbox dòng, còn gạch chân thì vẽ theo đáy bbox. Như vậy dấu không cần chính xác tới từng pixel.
3. **Lưới tham chiếu.** Trên bản sao gửi cho AI (không phải ảnh lưu), vẽ lưới mờ có nhãn, ví dụ ô A1…H12. Yêu cầu AI trả cả nhãn ô lẫn pixel; nếu hai giá trị lệch nhau quá một ô thì đánh dấu `confidence: low`. Hiệu quả của cách này với Claude 5.5 **chưa xác minh**: tài liệu không nói tới, cần thử A/B trong đợt thử nghiệm.
4. **Cắt nhỏ để xác định lại vị trí** khi `confidence` thấp: gửi riêng vùng ảnh quanh dòng đó, rồi cộng tọa độ gốc của vùng cắt (theo [Coordinates](https://platform.claude.com/docs/en/build-with-claude/vision-coordinates)).
5. **Kiểm tra bằng code:** bbox phải nằm trong ảnh, số `line` phải tồn tại, công thức phải vẽ được bằng KaTeX (mục 6.6). Bản nào sai thì loại.
6. **Giáo viên kéo chỉnh:** màn hình duyệt cho kéo, xóa, thêm dấu trên lớp vector trước khi duyệt (mục 6.4). Đây là bước quyết định, các bước trên chỉ giúp giảm số lần phải sửa.

## 5. Hiện trạng codebase (đã đọc)

- **Ảnh lưu dạng base64 ngay trong Firestore.** App không dùng Firebase Storage: `submissionImages` (`image.service.ts:113-127`), `commentImages` (`:207-219`), `gradedImages` (`:185-205`). Mỗi ảnh một document, vì giới hạn "1 MiB (1,048,576 bytes)" mỗi document ([Firestore quotas](https://firebase.google.com/docs/firestore/quotas)). `app.config.ts` chỉ nạp Auth và Firestore; repo không có `storage.rules`. Vì vậy "URL ảnh" không có sẵn: API phải đọc base64 rồi trả ảnh.
- **Học sinh không có Firebase Auth.** Đăng nhập học sinh chỉ lưu `localStorage` (`auth.service.ts:117-128`). Mọi yêu cầu của học sinh tới Firestore đều có `request.auth == null`, giống hệt một người lạ trên Internet. Rule không phân biệt được "học sinh A" với "người ngoài". Rule chỉ phân biệt được "giáo viên đã đăng nhập" với "mọi người còn lại".
- **Rule hiện tại** (`firestore.rules`):
  - `isTeacher()` = đã đăng nhập và có `teachers/{uid}` (`:5`). Nhưng `teachers/{uid}` cho chính chủ ghi (`:7-10`), và app tự tạo document này khi một tài khoản Auth đăng nhập lần đầu (`auth.service.ts:81-90`).
  - `comments`: đọc, tạo, sửa, xóa đều `if true` (`:66-71`).
  - `grades`: đọc `if true` (`:59-64`).
  - `submissions`: đọc, tạo, sửa `if true` (`:51-57`).
  - `notifications`, `teacherNotifications`, `submissionImages`, `commentImages`, `gradedImages`: `read, write: if true` (`:93-111`).
  - `assignments`: đọc `if true` (`:40-44`).
- **Nhận xét theo ảnh** là collection `comments` riêng (không nằm chung document với bài nộp), có `submissionId` và `imageIndex` (`models/index.ts:81-98`). Học sinh đọc bằng `where('submissionId','==',…)` (`firestore.service.ts:1000-1014`, gọi từ `results.component.ts:860`). Huy hiệu "chưa đọc" tính theo `createdAt` so với `lastCommentSeenAt` (`home.component.ts:694-717`, qua `firestore.service.ts:450`).
- **Nhận xét chung và điểm** nằm cùng một document `grades` (`models/index.ts:70-79`), ghi bởi `createOrUpdateGrade` (`firestore.service.ts:964`). Học sinh thấy điểm ngay khi document được ghi (`results.component.ts:844-849`). Vì vậy **điểm AI đề xuất không được ghi vào `grades`** trước khi duyệt.
- **Vẽ mực hiện nay:**
  - Công cụ bút mặc định màu `#ef4444`, cỡ 2 (`grading.component.ts:979-980`). Nét bút cảm ứng có độ dày theo lực nhấn (khoảng `:1245-1280`).
  - Nút Lưu **ghi đè ảnh gốc** trong `submissionImages` (`grading.component.ts:1419-1441`), nên ảnh gốc mất.
  - Trường `gradedImageIds` (`models/index.ts:63`) và các hàm `saveGradedImage`/`getGradedImage` có sẵn nhưng không trang nào dùng (grep `src/`).
  - Bạn bè được cấp quyền cũng tải `submissionImages` (`peers.component.ts:530`). Vì vậy ảnh nháp của AI **không được** ghi vào `submissionImages` trước khi duyệt.
- **Thông báo:**
  - `addComment` sinh `teacherNotifications` kèm toàn văn `content` cho các giáo viên khác (`firestore.service.ts:1032-1049`, `:1093-1118`). Collection này ai cũng đọc được.
  - Email chỉ gửi khi người viết là học sinh: `load-event.js:42` trả `not-student` nếu không tìm thấy `students/{authorId}`. Client chỉ gọi email khi `authorRole !== 'teacher'` (`firestore.service.ts:1045`).
- **email-api** đọc và ghi Firestore qua REST mà **không có service account**, dựa vào việc rule cho đọc công khai (`email-api/lib/firestore.js:1-2`). Nó chạy trên Vercel, Node 22, chỉ phụ thuộc `nodemailer` (`email-api/package.json`).
- **Công thức** lưu dạng `\(…\)` trong chuỗi (ADR 0006, `src/app/shared/math/math-text.ts:9-25`). Hiển thị bằng KaTeX 0.19.0 với `trust: false`, `maxSize: 8` và macro riêng (`katex.ts:63-69`). `$…$` chỉ được đổi lúc **dán** vào ô chữ (`paste-math.ts`), lúc hiển thị không hiểu `$…$` (ADR 0006).

## 6. Thiết kế đề xuất trong MathShine (câu hỏi 3)

### 6.1 Mô hình dữ liệu: bản nháp nằm riêng
Nguyên tắc: **nội dung nào chưa duyệt thì không được nằm trong collection công khai.** "Học sinh được xem / không được xem" khi đó là chuyện vị trí lưu:
- **không được xem** = đang nằm trong `gradingDrafts`, chỉ giáo viên đọc;
- **được xem** = đã chuyển sang `comments`/`grades` như nhận xét bình thường.

```
gradingDrafts/{submissionId}            ← chỉ giáo viên
  status: 'pending' | 'approved' | 'rejected'
  source: 'ai' | 'teacher'
  model, createdAt, createdBy ('api:<tên khóa>'), approvedAt?, approvedBy?
  proposedScore, overallComment, rubric[]
  readLines: { [imageIndex]: [{ line, bbox, readAs }] }   ← bản AI chép lại từng dòng
  marks:     { [imageIndex]: [{ id, type, line, bbox|anchor, text?, confidence }] }
  imageSizes: { [imageIndex]: [w, h] }                     ← cỡ ảnh AI đã thấy
gradingDrafts/{submissionId}/items/{itemId}   ← mỗi Nhận xét theo ảnh nháp
  imageIndex, content (chuỗi có \(…\)), visibleToStudent: false, status, editedByTeacher
answerKeys/{assignmentId}               ← đáp án, chỉ giáo viên
  content (chuỗi \(…\)), imageIds[] (ảnh đáp án trong draftImages)
draftImages/{id}                        ← ảnh đáp án / ảnh minh họa nháp, chỉ giáo viên
  base64Data (≤ ~900.000 ký tự như compressImage)
```

- **Đáp án phải ở collection riêng.** `assignments` ai cũng đọc được (`firestore.rules:40-44`), nên nếu ghi đáp án vào `description` thì học sinh đọc được qua SDK.
- Dấu mực lưu ở **dạng vector** (bbox và loại dấu), không lưu ảnh đã đốt. Cách này nhẹ (vài KB), giáo viên sửa được, và học sinh không thấy được.
- Ảnh minh họa đi kèm bình luận nháp nằm trong `draftImages`. Khi duyệt mới chép sang `commentImages`.

**Phương án thay thế (không khuyến nghị):** thêm trường `visibleToStudent` vào `comments`, với rule `allow read: if isTeacher() || resource.data.visibleToStudent == true`. Cách này phải làm thêm nhiều việc:
- **Sửa mọi truy vấn của học sinh.** Firestore viết rõ "security rules are not filters—queries are all or nothing", và truy vấn phải có điều kiện khớp với rule ([Rules and queries](https://firebase.google.com/docs/firestore/security/rules-query)). Truy vấn của học sinh phải thêm `where('visibleToStudent','==',true)` ở `firestore.service.ts:450` và `:1000-1030`, và phải thêm composite index.
- **Ghi thêm trường cho toàn bộ bình luận cũ.** "Only documents where the given field exists can match the query" ([Queries](https://firebase.google.com/docs/firestore/query-data/queries)).
- **Khóa quyền sửa `comments`.** Hiện ai cũng sửa được (`:69`), tức là ai cũng tự bật `visibleToStudent` lên được.

Tách collection riêng tránh được cả ba việc này và không đụng vào code học sinh đang chạy.

### 6.2 Những chỗ cần đổi ở `firestore.rules`

1. **Siết `isTeacher()` trước tiên**, vì mọi phần "ẩn" đều dựa vào nó.
   - Firebase Auth mặc định "enables users to sign-up… without administrative intervention". Tắt bằng "User actions" trong Authentication Settings ([Users in Firebase Projects](https://firebase.google.com/docs/auth/users)).
   - Đổi `isTeacher()` sang danh sách cho phép mà client không ghi được:
     ```
     function isTeacher() {
       return request.auth != null
         && exists(/databases/$(database)/documents/teacherAllowlist/$(request.auth.uid));
     }
     match /teacherAllowlist/{uid} { allow read: if request.auth != null && request.auth.uid == uid; allow write: if false; }
     ```
     `teacherAllowlist` chỉ được thêm từ Firebase Console hoặc Admin SDK. Phải thêm uid các giáo viên hiện có trước khi deploy, nếu không mọi thao tác ghi của giáo viên sẽ bị chặn.
   - `auth.service.ts:81-90`, chỗ tự tạo `teachers/{uid}`, không còn cấp quyền nữa nhưng vẫn chạy được.
2. **Thêm các collection chỉ giáo viên đọc:**
   ```
   match /gradingDrafts/{submissionId} {
     allow read, write: if isTeacher();
     match /items/{itemId} { allow read, write: if isTeacher(); }
   }
   match /answerKeys/{assignmentId} { allow read, write: if isTeacher(); }
   match /draftImages/{id}          { allow read, write: if isTeacher(); }
   match /aiApiKeys/{id}            { allow read, write: if false; }   // chỉ API (Admin SDK) đọc
   ```
3. **Không đổi rule công khai hiện có** trong phạm vi tính năng này. Ghi rõ trong code: **không** chép nội dung nháp vào `teacherNotifications`, `notifications`, `comments`, `grades`, `submissionImages`, `gradedImages`, `commentImages`. Tất cả các collection này đều `read: if true`.
4. **API dùng Admin SDK.** "The server client libraries bypass all Cloud Firestore Security Rules" ([Get started with Security Rules](https://firebase.google.com/docs/firestore/security/get-started)). Vì vậy:
   - API phải tự giới hạn những gì nó được ghi (chỉ ghi `gradingDrafts`, `draftImages`);
   - service account phải là bí mật mới trên Vercel. Khác email-api hiện nay, vốn không có service account (`email-api/lib/firestore.js:1-2`).
5. **Giới hạn còn lại:** khi bình luận đã duyệt, học sinh có thể đã tải về. App dùng `persistentLocalCache` (`app.config.ts:21-26`). Nên "ẩn lại" một bình luận đã hiện (chuyển ngược về nháp) không xóa được bản đã nằm trên máy học sinh.

### 6.3 API cho AI (hàm Vercel, giống email-api)

Có thể đặt trong project email-api (`api/grading/*.js`) hoặc một project Vercel riêng. Xác thực bằng `Authorization: Bearer <khóa riêng của giáo viên>`. Lưu SHA-256 của khóa trong `aiApiKeys` hoặc biến môi trường, không lưu khóa thô. Mỗi khóa gắn với một `teacherId` và có thể thu hồi.

| Endpoint | Việc |
|---|---|
| `GET /api/grading/pending?assignmentId=` | Danh sách Lần nộp `status == 'submitted'` chưa có `gradingDrafts` |
| `GET /api/grading/assignment/{id}` | Tiêu đề, mô tả (đề), đáp án từ `answerKeys`, mã ảnh đáp án |
| `GET /api/grading/submission/{id}` | `assignmentId`, `attemptNumber`, `imageIds`, cỡ từng ảnh. **Không** trả tên học sinh (không cần cho việc chấm) |
| `GET /api/grading/image/{imageId}` | Trả JPEG nhị phân, tối đa khoảng 0,9 MB. Phải thấp hơn giới hạn body 4,5 MB của Vercel ([Vercel Functions Limits](https://vercel.com/docs/functions/limitations)) |
| `GET /api/grading/style-examples?limit=30` | Nhận xét cũ của **chính** giáo viên đó: `comments` có `authorRole == 'teacher'` và `authorId` khớp, cùng `grades.comment` có `gradedBy` khớp. Đã bỏ tên học sinh |
| `POST /api/grading/drafts/{submissionId}` | Nhận JSON như mục 4.3. Server **ép** `visibleToStudent: false` và `status: 'pending'`, bỏ qua mọi giá trị client gửi lên |

Kiểm tra phía server trước khi ghi:
- bbox nằm trong `imageSizes`;
- mỗi `content` vẽ được bằng `katex.renderToString(…, { throwOnError: true })` với đúng macro của `katex.ts`;
- độ dài chuỗi hợp lý;
- `submissionId` tồn tại.

Cũng nên giới hạn số request trên mỗi khóa. Hàm Vercel Hobby chạy tối đa 300 giây (cùng nguồn), đủ cho các lệnh đọc/ghi này. Riêng phương án C phải dùng Batch API rồi kiểm tra kết quả theo lịch, không chờ trong một lần gọi.

**Cho phương án B:** một MCP server stdio nhỏ (Node) bọc các endpoint trên thành công cụ `list_pending`, `get_submission`, `fetch_image` (lưu ảnh vào thư mục tạm, trả đường dẫn), `submit_draft`. Thêm bằng `claude mcp add --transport stdio mathshine -- node mcp.js` ([MCP](https://code.claude.com/docs/en/mcp)). Khóa API nằm trong biến môi trường của MCP server, không đưa vào prompt.

### 6.4 Luồng duyệt của giáo viên (trang Chấm bài)

1. Danh sách bài có nhãn "Có bản nháp AI".
2. Trong `grading.component`, khung "Bản nháp AI" (chỉ giáo viên thấy) gồm:
   - lớp dấu vector chồng lên ảnh, tái dùng `drawCanvas` hiện có: kéo, đổi loại, xóa, thêm dấu;
   - danh sách bình luận nháp theo ảnh, mỗi mục sửa được bằng ô chữ có nút *f*(*x*), kèm công tắc "Học sinh được xem" (mặc định **tắt**);
   - bản chép từng dòng `readAs` để kiểm tra AI đọc đúng không;
   - điểm đề xuất điền sẵn vào ô điểm nhưng **chưa lưu**.
3. **"Chấp nhận"** làm lần lượt:
   1. đốt các dấu đã chỉnh vào JPEG. Trước đó lưu ảnh gốc vào một bản sao chỉ giáo viên đọc, vì luồng Lưu hiện tại ghi đè ảnh gốc;
   2. tạo `comments` cho từng mục đã bật "được xem", dùng `addComment` hiện có với `authorRole: 'teacher'` và uid giáo viên;
   3. lưu điểm và Nhận xét chung qua `saveGrade` hiện có;
   4. đặt `gradingDrafts.status = 'approved'` và ghi lại mục nào giáo viên đã sửa.

   Mục nào giáo viên để tắt thì vẫn nằm ở nháp.
4. **"Bỏ"** đặt `status = 'rejected'`. Có thể chấm tay như cũ.

Quyết định mở: ảnh đã chấm nên ghi đè `submissionImages` như hiện nay (học sinh thấy ngay, không phải sửa trang học sinh), hay chuyển sang dùng `gradedImageIds` (giữ ảnh gốc, nhưng phải sửa `results.component` và `peers.component` để hiển thị)?

### 6.5 Thông báo và email không được lộ bản nháp
- API ghi thẳng bằng Admin SDK, không đi qua `addComment`. Vì vậy không sinh `teacherNotifications` và không gọi email-api. Dù có gọi, email-api cũng bỏ qua vì người viết không phải học sinh (`load-event.js:42`).
- Nếu muốn báo "AI đã chấm xong bài tập X", chỉ ghi nội dung chung chung, **không** chép nhận xét. `teacherNotifications` ai cũng đọc được (`firestore.rules:97-99`).
- Huy hiệu "chưa đọc" của học sinh đếm `comments` mới (`home.component.ts:694-717`). Bản nháp không nằm trong `comments` nên không được đếm, tức là không lộ cả số lượng. Khi duyệt, `createdAt` là giờ duyệt nên học sinh thấy là nhận xét mới.
- Nếu đi theo phương án thay thế (trường `visibleToStudent` trong `comments`) thì phải lọc ở cả huy hiệu lẫn chuông thông báo. Đây là thêm một lý do để tách collection.

### 6.6 Định dạng công thức
- AI phải xuất đúng dạng lưu của app: chữ thường xen `\(…LaTeX…\)` (ADR 0006, `math-text.ts:9`). Trong JSON, dấu `\` phải được escape thành `\\(`.
- **Không** dùng `$…$` hay `\[…\]`. Phần hiển thị không hiểu các dạng đó, chúng chỉ được đổi khi dán (ADR 0006). Nếu muốn an toàn hơn, server chạy cùng hàm đổi của `paste-math.ts` lên chuỗi AI trả về.
- Chỉ dùng lệnh KaTeX 0.19 vẽ được và các macro của app, ví dụ `\dfrac`, `\overrightarrow{AB}`, `cases`. Server kiểm tra bằng KaTeX như mục 6.3.
- Email và chuông thông báo đã có bộ chuyển công thức sang dạng một dòng (`email-api/lib/math-text.js`, `mathPlain` pipe), không cần thêm gì.

## 7. "Giống giáo viên chấm" (câu hỏi 4)

**Giọng nhận xét (khả thi khá):**
- Lấy 20–50 nhận xét cũ của chính giáo viên từ `comments` (`authorRole == 'teacher'`, `authorId` khớp) và `grades.comment` làm ví dụ mẫu. Bỏ tên học sinh trước khi gửi.
- Kèm vài cặp "lỗi → cách giáo viên nhận xét" để AI học cách xưng hô, độ dài, cách dùng công thức.
- Phần ví dụ này giữ nguyên giữa các bài, nên cache được (mục 3.6).
- Trong app, nhận xét vốn là **chữ gõ** (`grading.component.ts:1131-1158`), không phải chữ viết tay. Nên giọng văn là phần dễ làm giống nhất.

**Nét mực (khả thi một phần):**
- Vẽ bằng đúng màu `#ef4444` và độ dày như bút của app (`grading.component.ts:979-980`). Thêm biến thiên độ dày giống nét bút cảm ứng (khoảng `:1245-1280`) và run nét nhẹ: dịch điểm ngẫu nhiên 1–2 px, đường cong thay đường thẳng.
- **Mẫu dấu thật:** giáo viên tự vẽ 5–10 biến thể ✓, ✗, gạch chân, khoanh, và vài chữ hay dùng ("sai", "?", "đúng"). Vẽ ngay trên canvas của app, lưu dạng nét vector. Khi đặt dấu, chọn ngẫu nhiên một biến thể, xoay ±5°, đổi cỡ ±10%.
- **Chữ ghi chú dài bằng "chữ tay giả" là phần dễ lộ nhất.** Nên để dấu trên ảnh ngắn gọn (dấu, điểm từng câu, chữ ngắn từ mẫu). Giải thích dài thì để ở Nhận xét theo ảnh dạng chữ gõ, như giáo viên vẫn làm.

**Giới hạn cần nói thẳng:**
- Không có cách nào **bảo đảm** học sinh không nhận ra. Học sinh có thể nhận ra qua văn phong lặp lại, dấu đặt quá đều, hoặc nhận xét sai kiểu "máy" (ví dụ đọc nhầm chữ rồi phê một lỗi không có thật).
- AI đọc chữ viết tay và chấm vẫn sai (mục 4.2). Tài liệu yêu cầu "human oversight" cho việc cần chính xác. **Bước duyệt bắt buộc**, và giáo viên chịu trách nhiệm từng nhận xét gửi đi dưới tên mình.

## 8. Minh bạch và chính sách (câu hỏi 5)

### 8.1 Chính sách sử dụng nói gì
Theo [Usage Policy](https://www.anthropic.com/legal/aup), bản ghi "Effective Nov 12, 2026". Bản đang có hiệu lực trước ngày đó có điểm nào khác không thì **chưa xác minh**; trang có liên kết "version history".
- Có mục **yêu cầu cho trường hợp rủi ro cao**. Một trong các lĩnh vực là **"Education and credentials"**, gồm: tuyển, loại hoặc xếp hạng thí sinh; chấm bài thi/đánh giá quyết định tuyển sinh, tốt nghiệp, cấp phép hoặc chứng chỉ (trừ trắc nghiệm); kết luận gian lận học thuật, đình chỉ hoặc đuổi học.
- Yêu cầu khi rơi vào các trường hợp đó:
  - người có chuyên môn "must meaningfully review… with the authority to change or modify it" trước khi dùng kết quả;
  - người bị ảnh hưởng "must be clearly told that AI was used to produce it".
- Có các ngoại lệ, ví dụ bản nháp hay phân tích nội bộ không phải là khuyến nghị cuối cùng được giao.
- Với chatbot/agent giao tiếp trực tiếp với người dùng: phải cho người dùng biết họ đang nói chuyện với AI. Cấm "convince people they are interacting with a human when they are not".

### 8.2 Áp vào MathShine
- Trong mô hình đề xuất, AI **không** nói chuyện trực tiếp với học sinh. AI chỉ soạn bản nháp, giáo viên sửa và gửi dưới tên mình.
- Bài tập về nhà hằng tuần thường không phải bài thi "quyết định tuyển sinh, tốt nghiệp, cấp chứng chỉ". Nhưng nếu điểm này được đưa vào học bạ hoặc xét lên lớp thì có thể rơi vào nhóm rủi ro cao. Khi đó chính sách yêu cầu **thông báo cho học sinh**, mâu thuẫn trực tiếp với mong muốn "học sinh không nhận ra". Việc xếp loại cụ thể là diễn giải chính sách, **chưa xác minh**. Nên đọc toàn văn hoặc hỏi Anthropic nếu điểm được dùng chính thức.
- Rủi ro thực tế ngoài chính sách: quy định của nhà trường hoặc trung tâm về dùng AI; phản ứng của phụ huynh nếu phát hiện; mất lòng tin của học sinh nếu một nhận xét sai kiểu AI bị phát hiện.

### 8.3 Dữ liệu học sinh
- Qua **API**: "By default, we will not use your inputs or outputs from our commercial products" để huấn luyện ([Is my data used for model training? – commercial](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training)).
- Qua **claude.ai/Claude Code bằng gói Pro** (sản phẩm cá nhân): người dùng "choose to allow us to use your chats and coding sessions to improve Claude". Chat ẩn danh (Incognito) không được dùng để cải thiện model ([Is my data used for model training? – consumer](https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training)). Nếu đi phương án A hoặc B, nên tắt Model Improvement.
- Chỉ gửi ảnh bài làm và mã bài, không gửi tên học sinh (API ở mục 6.3 đã thiết kế như vậy).

**Khuyến nghị ngắn:** giáo viên duyệt và chịu trách nhiệm từng nhận xét. Lưu nhật ký "bản nháp AI → bản đã duyệt" trong `gradingDrafts` (chỉ giáo viên đọc). Có chính sách minh bạch với nhà trường/phụ huynh trước khi dùng rộng.

## 9. Khuyến nghị và lộ trình

**Bước 1 – Thử nghiệm độ chính xác, chưa viết code (1–2 buổi).**
- Chọn 10 bài **đã chấm tay**, đủ loại: chữ đẹp, chữ xấu, ảnh nghiêng, nhiều trang. Tải ảnh bằng nút tải trong trang Chấm bài. Nên lưu thêm bản sao ảnh trước khi chấm, vì luồng hiện tại ghi đè ảnh gốc.
- Dùng Claude Code (Pro) hoặc claude.ai, cùng một prompt: đề + đáp án + 10 nhận xét mẫu + yêu cầu xuất JSON theo mục 4.3. Thử cả Opus 5.5 và Sonnet 5.5 nếu gói cho phép.
- So với bản chấm tay. Đo:
  - (a) tỉ lệ dòng đọc đúng (`readAs`);
  - (b) lỗi bắt đúng / lỗi bỏ sót / lỗi bịa;
  - (c) chênh điểm |AI − giáo viên|;
  - (d) tỉ lệ dấu rơi đúng dòng;
  - (e) số phút giáo viên cần để sửa một bài;
  - (f) phần trăm hạn mức Pro đã dùng (`/usage`).
- Ngưỡng gợi ý để đi tiếp: không có lỗi bịa nào lọt qua mà giáo viên không nhận ra, chênh điểm ≤ 0,5 ở ít nhất 8/10 bài, và thời gian sửa ngắn hơn chấm tay. Đây là đề xuất, không có nguồn chuẩn.

**Bước 2 – Siết rule (có ích kể cả khi không làm AI).** Tắt tự đăng ký Firebase Auth, thêm `teacherAllowlist`, đổi `isTeacher()` (mục 6.2). Kiểm thử bằng Rules Emulator.

**Bước 3 – Lõi bản nháp.** Thêm `gradingDrafts`, `answerKeys`, `draftImages` và rule của chúng; khung "Bản nháp AI" trong trang Chấm bài (mục 6.4); nút "Nhập kết quả AI (JSON)". Đến đây phương án A đã chạy được.

**Bước 4 – API Vercel + MCP server cho Claude Code** (mục 6.3). Đến đây phương án B chạy được.

**Bước 5 – Giọng và nét mực.** Lấy ví dụ nhận xét mẫu, ghi mẫu dấu, vẽ có run nét (mục 7). Đo lại như bước 1 với 10 bài mới.

**Bước 6 (tùy chọn) – Phương án C.** Mở tài khoản Console, dùng Batch API theo lịch cron, đặt hạn mức chi tiêu. Chỉ làm khi số bài thực sự vượt hạn mức Pro.

Ước lượng công sức (chưa xác minh bằng spike):
- bước 2: khoảng 0,5–1 ngày;
- bước 3: 2–4 ngày (phần lớn là màn hình kéo chỉnh dấu);
- bước 4: 1–2 ngày;
- bước 5: 1–2 ngày;
- bước 6: 2–3 ngày.

## 10. Những điểm chưa xác minh và quyết định còn mở

**Chưa xác minh**
1. Pro được dùng model nào trong Claude Code, và một lô 40 bài tốn bao nhiêu phần hạn mức 5 giờ / hạn mức tuần.
2. Ranh giới giữa "ordinary, individual usage" và tự động hóa khi chạy `claude -p` bằng gói Pro.
3. Ngưỡng Claude Code tự thu nhỏ ảnh khi đọc bằng Read, tức là tọa độ có cần quy đổi không.
4. Claude Code và claude.ai (custom connector) có cho Claude thấy ảnh trả về từ công cụ MCP không.
5. Độ chính xác đọc chữ viết tay, công thức tiếng Việt và độ chính xác bbox của Claude 5.5: tài liệu không có số đo.
6. Lưới tham chiếu (mục 4.5, ý 3) có giúp ích với Claude 5.5 không.
7. Lượng token output thực tế mỗi bài, nên chi phí ở mục 3.6 có thể lệch.
8. Bản Usage Policy có hiệu lực trước 12/11/2026, và bài tập về nhà có thuộc nhóm "Education and credentials" không.

**Quyết định mở cho giáo viên**
1. Chọn phương án khởi đầu: A, B, hay đi thẳng C?
2. Ảnh đã chấm: ghi đè ảnh gốc như hiện nay, hay chuyển sang `gradedImageIds` để giữ ảnh gốc?
3. Có thông báo cho học sinh/phụ huynh rằng có AI hỗ trợ chấm không (mục 8.2)?
4. Model: Opus 5.5 hay Sonnet 5.5, quyết định sau khi có kết quả bước 1.
5. Ai được tạo khóa API, và một khóa được ghi bản nháp cho những nhóm/lớp nào?

## 11. Nguồn

**Anthropic – sản phẩm, gói, điều khoản**
- Pro plan: https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- API tính tiền riêng: https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan
- Thanh toán API: https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage
- Claude account và Console account: https://support.claude.com/en/articles/8987223-can-i-have-a-claude-account-and-a-console-account
- Claude Code với Pro/Max: https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
- Hạn mức sử dụng: https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
- Custom connector (remote MCP): https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Claude Code – Legal and compliance: https://code.claude.com/docs/en/legal-and-compliance
- Claude Code – chạy bằng script: https://code.claude.com/docs/en/headless
- Claude Code – MCP: https://code.claude.com/docs/en/mcp
- Claude Code – Tools reference (Read đọc ảnh): https://code.claude.com/docs/en/tools-reference
- Usage Policy: https://www.anthropic.com/legal/aup
- Dữ liệu và huấn luyện: https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training · https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training

**Claude API docs**
- Models overview: https://platform.claude.com/docs/en/about-claude/models/overview
- Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Vision: https://platform.claude.com/docs/en/build-with-claude/vision
- Coordinates and bounding boxes: https://platform.claude.com/docs/en/build-with-claude/vision-coordinates
- PDF support: https://platform.claude.com/docs/en/build-with-claude/pdf-support
- Structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Computer use tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool

**Firebase, Vercel**
- Rules không phải bộ lọc: https://firebase.google.com/docs/firestore/security/rules-query
- Server client libraries bỏ qua rule: https://firebase.google.com/docs/firestore/security/get-started
- Truy vấn không trả document thiếu trường: https://firebase.google.com/docs/firestore/query-data/queries
- Giới hạn 1 MiB mỗi document: https://firebase.google.com/docs/firestore/quotas
- Tắt tự đăng ký (User actions): https://firebase.google.com/docs/auth/users
- Vercel Functions Limits (300 giây Hobby, body 4,5 MB): https://vercel.com/docs/functions/limitations

**Repo (working copy 2026-10-25)**
- `firestore.rules`, `src/app/models/index.ts`, `src/app/services/auth.service.ts`, `src/app/services/firestore.service.ts`, `src/app/services/image.service.ts`
- `src/app/pages/teacher/grading.component.ts`, `src/app/pages/student/results.component.ts`, `src/app/pages/student/home.component.ts`, `src/app/pages/student/peers.component.ts`
- `src/app/shared/components/comment-attachments*.ts`, `src/app/shared/math/math-text.ts`, `src/app/shared/math/katex.ts`, `src/app/shared/math/paste-math.ts`
- `email-api/api/notify.js`, `email-api/lib/firestore.js`, `email-api/lib/load-event.js`, `email-api/lib/math-text.js`
- `docs/adr/0003-email-thong-bao-qua-vercel-gmail-smtp.md`, `docs/adr/0006-cong-thuc-kieu-casio-mathlive-katex.md`

**Tính toán cục bộ (2026-10-25):** số token ảnh theo `⌈w/28⌉×⌈h/28⌉` và bảng chi phí ở mục 3.6 được tính bằng một script Python nhỏ chạy ngoài repo, với giá của trang Pricing.
