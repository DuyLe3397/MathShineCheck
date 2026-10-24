# MathShine Check

Hệ thống giao bài, nộp bài và chấm điểm môn Toán cho giáo viên và học sinh, tổ chức theo Lớp → Nhóm.

## Language

**Bài có điểm**:
Một bài tập mà học sinh có ít nhất một Lần nộp được chấm có điểm (khác **Chấm không điểm**). Nếu chấm nhiều lần thì lấy điểm cao nhất.
_Avoid_: bài đã làm, bài đã nộp

**Chấm không điểm**:
Giáo viên đã chấm một Lần nộp (có thể kèm Nhận xét chung) nhưng không cho điểm; giáo viên thể hiện bằng cách nhập điểm 0. Ở mọi nơi hiển thị là "-", không tính vào điểm trung bình. Hệ thống không có điểm 0 thật.
_Avoid_: điểm 0, điểm liệt

**Bài thiếu điểm**:
Một bài tập trong phạm vi đang xét mà học sinh chưa có điểm — gồm chưa nộp, đã nộp nhưng chưa chấm, và mọi Lần nộp đều **Chấm không điểm**.
_Avoid_: bài trống, bài chưa làm

**Phạm vi thống kê**:
Tập bài tập của một Nhóm đang được xét trên trang Thống kê: các bài có ngày buổi học nằm trong khoảng Từ ngày – Đến ngày; không chọn ngày thì là toàn bộ bài của nhóm.

**Độ đủ điểm**:
Số **Bài có điểm** của một học sinh trong **Phạm vi thống kê**. Học sinh **đủ điểm** khi độ đủ điểm bằng số bài trong phạm vi.
_Avoid_: tiến độ, tỷ lệ hoàn thành

**Bài tập**:
Một bài giáo viên giao cho một Nhóm, gắn với một ngày buổi học. Người dùng hay gọi là "bài học" — cùng một thứ.
_Avoid_: bài học, lesson

**Lần nộp**:
Một lần học sinh nộp bài cho một Bài tập. Học sinh có thể nộp nhiều lần; mỗi Lần nộp được chấm riêng.
_Avoid_: bài nộp (khi cần phân biệt các lần)

**Lần nộp chờ chấm**:
Một Lần nộp chưa có kết quả chấm cuối cùng: học sinh vừa nộp, hoặc giáo viên đã mở chấm nhưng chưa chấm xong. Lần nộp đã chấm (kể cả **Chấm không điểm**) không còn là chờ chấm.
_Avoid_: bài chưa chấm, bài pending

**Nhận xét chung**:
Lời nhận xét tổng thể giáo viên viết cho một Lần nộp khi chấm, đi kèm điểm của lần đó. Mỗi Lần nộp có nhiều nhất một Nhận xét chung; chấm lại thì nhận xét mới thay nhận xét cũ.
_Avoid_: bình luận, comment

**Nhận xét theo ảnh**:
Các lời nhận xét giáo viên (hoặc học sinh) gửi trên từng ảnh của một Lần nộp, dạng trao đổi qua lại. Không phải Nhận xét chung.

**Ảnh đính kèm**:
Ảnh mà người viết (học sinh hoặc giáo viên) gắn vào một Nhận xét theo ảnh, nằm dưới phần chữ. Mỗi nhận xét có tối đa 3 ảnh đính kèm, xếp theo thứ tự người viết chọn và đánh số **Hình 1, Hình 2…**; khi bỏ bớt hoặc đổi chỗ thì số được đánh lại. Khác với ảnh của Lần nộp mà nhận xét đó nằm trên.
_Avoid_: ảnh bình luận, ảnh 1/ảnh 2 (dễ lẫn với ảnh bài nộp)

**Ghi chú ảnh**:
Lời giải thích không bắt buộc mà người viết gắn với một Ảnh đính kèm, hiển thị sau số thứ tự: "Hình 2: em sai dấu ở bước 3". Số "Hình N" luôn do hệ thống đánh theo vị trí; ghi chú đi theo ảnh khi đổi thứ tự.
_Avoid_: nhãn ảnh, caption

**Màn hình xem ảnh đính kèm**:
Màn hình phóng to khi người dùng bấm vào một Ảnh đính kèm trong nhận xét. Cho phép xem ảnh cỡ lớn kèm Ghi chú ảnh, chuyển ảnh bằng nút ‹ và › (hoặc phím mũi tên); hỗ trợ 2 ngón tay vuốt zoom hoặc nhấn đúp ở bất kỳ đâu trên màn hình, lướt ảnh trơn mượt có quán tính; chỉ đóng khi bấm đúng nút ✕ hình tròn màu xanh (bấm ra nền ngoài không đóng). Khi đóng (hoặc khi đổi ảnh), khung Ảnh đính kèm tương ứng trong bình luận được khoanh viền bo màu xanh (#2563eb) để đánh dấu vị trí vừa xem.
_Avoid_: lightbox, modal ảnh

**Đáp án đã chốt**:
Lời giải chuẩn từng câu của một bài tập, kèm biểu điểm từng bước, đã được giáo viên đồng ý. Đây là căn cứ duy nhất để chấm mọi Lần nộp của bài tập đó. Có thể bắt nguồn từ đáp án giáo viên đưa hoặc lời giải Claude đề xuất, nhưng chỉ thành Đáp án đã chốt khi giáo viên chốt.
_Avoid_: đáp án (khi chưa được chốt), key

**Báo cáo chấm**:
Bản chấm đề xuất cho một Lần nộp: điểm từng câu, từng lỗi ở ảnh nào dòng nào, sai vì sao, sửa thế nào, các chỗ cần giáo viên xem kỹ, và nhận xét soạn sẵn theo giọng giáo viên. Chỉ giáo viên đọc. Học sinh chỉ thấy những gì giáo viên đã duyệt và tự đưa lên MathShine.
_Avoid_: kết quả chấm, bài AI chấm

**Lỗ hổng**:
Một kiến thức hoặc kỹ năng học sinh làm hỏng, gom từ các lỗi cùng gốc (vd. quên điều kiện xác định ở hai câu là một Lỗ hổng). Thuộc một trong ba nhóm: kiến thức (chưa hiểu, nhớ sai), cẩn thận (biết mà làm ẩu), trình bày. Gọi tên theo kiến thức, không theo bài cụ thể, để so được giữa các bạn.
_Avoid_: lỗi (khi nói về gốc chung của nhiều lỗi)

**Tổng hợp lớp**:
Bản tổng hợp mọi Báo cáo chấm của một bài tập: đánh giá từng bạn, Lỗ hổng chung của lớp, và đề xuất buổi chữa (chữa câu nào, chữa gì, ví dụ từ bài làm thật, bài luyện thêm). Chỉ giáo viên đọc.
_Avoid_: báo cáo lớp, thống kê

**Công thức**:
Một biểu thức toán hiện dạng xếp chồng như sách giáo khoa hoặc máy Casio (phân số, căn trùm biểu thức, tích phân có cận, giới hạn, hệ/tuyển, vectơ có mũi tên…), chèn vào giữa chữ của một nhận xét, thảo luận hoặc mô tả. Một nội dung có thể chứa nhiều Công thức. Có hai cách tạo: soạn trong Bảng soạn công thức, hoặc dán vào ô chữ một lời giải viết sẵn có công thức đánh dấu kiểu LaTeX ($…$, $$…$$, \[…\]). Khi dán, các công thức đó tự thành Công thức; ký tự $ của tiền (giá $5) vẫn là chữ. Trong Email thông báo, Công thức hiện dạng một dòng, như (x+1)/(2x−3), kèm link mở trên MathShine.
_Avoid_: ký hiệu (khi nói về công thức xếp chồng), LaTeX, phương trình

**Bảng soạn công thức**:
Bảng trượt lên khi bấm nút *f*(*x*) cạnh các ô viết chữ (Nhận xét theo ảnh, Nhận xét chung, Ghi chú ảnh, thảo luận, Mô tả bài tập), dùng chung cho giáo viên và học sinh. Dùng để soạn một Công thức trực quan kiểu Casio bằng bàn phím toán riêng: gõ 2 rồi bấm phân số thì 2 nằm sẵn ở tử số, có ô trống để điền. Mọi ký hiệu toán, kể cả ≤ ∈ ℝ, đều nhập qua bảng này. Mỗi ký hiệu chỉ nằm ở một nhóm phím. In đậm và gạch chân là công tắc: khi đang bật thì mọi thứ gõ thêm đều được in đậm hoặc gạch chân, tắt thì gõ tiếp như thường. Một Công thức có thể có nhiều dòng (phím xuống dòng hoặc Enter); đang ở trong một hệ thì xuống dòng là thêm một phương trình vào hệ. Trên điện thoại, chạm giữ rồi kéo để dịch con trỏ từng chữ. Hoàn tác / Làm lại lùi hoặc tiến từng lần gõ. Bấm "Chèn" là đưa Công thức vào chỗ con trỏ. Bấm vào một Công thức đã chèn, hoặc bấm *f*(*x*) khi con trỏ đang nằm trong Công thức đó, là mở lại bảng để sửa.
_Avoid_: bàn phím toán, MathLive, trình soạn, editor

**Bài bị ẩn**:
Một Bài tập mà giáo viên đã ẩn khỏi giao diện của một học sinh cụ thể: không hiện ở trang chủ và bảng điểm của em đó. Chỉ là ẩn hiển thị, không phải chặn truy cập; bài nộp và điểm vẫn giữ nguyên.
_Avoid_: quyền xem, phân quyền, bị khóa

**Danh sách bài bị ẩn**:
Tập các **Bài bị ẩn** của một học sinh. Học sinh mới có danh sách trống, tức là thấy mọi Bài tập của nhóm, kể cả bài tạo sau này.

**Thông báo**:
Một mục trong tab Thông báo của giáo viên, sinh ra khi có Lần nộp mới, Nhận xét theo ảnh mới, hoặc thảo luận/trả lời thảo luận mới. Mỗi giáo viên nhận một bản riêng; bấm vào thì mở đúng chỗ của sự kiện đó.

**Email thông báo**:
Một email gửi tới hộp thư cố định của giáo viên mỗi khi **học sinh** tạo một Lần nộp, một Nhận xét theo ảnh, hoặc một thảo luận/trả lời thảo luận. Mỗi sự kiện đúng một email, dù có bao nhiêu giáo viên; giáo viên tự viết thì không gửi. Email kèm tên học sinh, nhóm/lớp, bài tập, toàn văn nội dung và một link mở đúng chỗ như khi bấm Thông báo. Không thay thế Thông báo: gửi email thất bại thì Thông báo vẫn còn.
_Avoid_: mail cmt, thông báo email

**Yêu cầu xem bài bạn**:
Học sinh xin một học sinh khác cho xem bài làm của mình ở một Bài tập; người được xin chấp nhận hoặc từ chối. Không liên quan tới Bài bị ẩn.
_Avoid_: quyền, permission (khi nói chung chung)

## Relationships

- Một **Nhóm** thuộc một **Lớp**; một **Học sinh** thuộc một **Nhóm**
- Một **Bài tập** thuộc một **Nhóm** và gắn với một ngày buổi học
- Mỗi **Học sinh** có một **Danh sách bài bị ẩn**, gồm không hoặc nhiều **Bài tập** thuộc nhóm của em đó
- Một **Học sinh** có không hoặc nhiều **Lần nộp** cho một **Bài tập**; mỗi **Lần nộp** có nhiều nhất một điểm kèm một **Nhận xét chung**, và không hoặc nhiều **Nhận xét theo ảnh**; với mỗi cặp (Bài tập, Học sinh), mỗi số thứ tự lần (Lần 1, Lần 2...) là **duy nhất** (không bao giờ có hai bản ghi trùng cùng số lần nộp).
- Mỗi **Nhận xét theo ảnh** có từ 0 đến 3 **Ảnh đính kèm** có thứ tự
- Mỗi bài trong **Phạm vi thống kê** là **Bài có điểm** hoặc **Bài thiếu điểm** đối với từng học sinh

## Example dialogue

> **Giáo viên:** "Lọc từ 01/09 đến 15/09 có 5 bài, em A có điểm cả 5 bài, em B mới có 3 bài."
> **Dev:** "Vậy **Độ đủ điểm** của A là 5/5 — A **đủ điểm**, đứng trên B (3/5)."

## Flagged ambiguities

- "Set quyền cho học sinh được xem bài nào" — không phải khái niệm quyền; đã chốt là **Danh sách bài bị ẩn**: mặc định thấy hết, giáo viên chỉ ẩn bớt, để bài mới tự hiện với cả nhóm.
- "Điểm 0 thì không hiển thị" — đã chốt: 0 không phải một điểm số mà là **Chấm không điểm**; bài đó là **Bài thiếu điểm** (trước đây điểm 0 được tính là Bài có điểm).
- "Nhận xét chung với mỗi lần chấm bài" — đã chốt: một nhận xét cho mỗi **Lần nộp**, không lưu lịch sử các lần chấm lại.
- "Cmt" — có thể là **Nhận xét theo ảnh** trên Lần nộp, hoặc thảo luận/trả lời thảo luận; khi nói về **Email thông báo** thì gồm cả hai.
- "Có điểm trước" từng được hiểu theo thời gian hoàn thành — đã chốt: chỉ xét số lượng **Bài có điểm**, không xét thời gian.
- "Học sinh bấm nộp nhiều lần bị trùng bài nộp" — đã chốt: hệ thống bảo đảm tính duy nhất của **Lần nộp** ở cả 3 tầng (khóa đồng bộ UI khi đang nén/tải ảnh, Document ID cố định trên Firestore `{assignmentId}_{studentId}_{attemptNumber}`, và tự động gom nhóm deduplicate trên UI theo số thứ tự lần nộp). Lần nộp tiếp theo luôn tính từ số lần nộp cao nhất hiện có + 1.
