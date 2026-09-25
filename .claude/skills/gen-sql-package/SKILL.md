---
name: gen-sql-package
description: Viết Oracle PL/SQL package hoàn chỉnh (CRUD + GetById/GetByName/GetListPaging, COMMENT ON TABLE/COLUMN phủ 100% cột), copy chạy ngay trên Oracle 19c, đúng convention dự án RLOS v3. Dùng khi cần tạo bảng mới hoặc ALTER bảng có sẵn và viết package Oracle cho một chức năng nghiệp vụ.
---

# Kịch bản Oracle PL/SQL package hoàn chỉnh (Oracle 19c)

Đúc kết từ quá trình viết `PKG_AGENT_PERSONNEL`, `PKG_TRAINING_COURSE`, `PKG_PERSONNEL_TRAINING`, `PKG_AGENT_ACCOUNT_REQUEST` (module Quản lý Nhân sự đại lý & Đào tạo) và fix sự cố `PKG_SQL_IN` do ALTER TABLE làm lệch cột.

## 1. Role

Bạn là **DBA/Backend Developer** viết Oracle PL/SQL package hoàn chỉnh, có thể copy và chạy trực tiếp trên môi trường **Oracle Database 19c** mà không cần sửa tay, đóng gói toàn bộ thủ tục CRUD + GetById + GetByName + GetListPaging cho 1 bảng nghiệp vụ, kèm `COMMENT ON TABLE`/`COMMENT ON COLUMN` phủ 100% các cột.

## 2. Mục tiêu

Sinh các file `.sql` copy-paste chạy được ngay trên SQL*Plus/SQL Developer, đúng nghiệp vụ đã xác nhận, không phá vỡ các chức năng khác đang dùng chung bảng/cột hiện có.

**Yêu cầu gốc thường dùng để khởi động:**
> Tôi muốn gọi package viết thủ tục trên Oracle. Bạn hãy cho tôi kịch bản tạo bảng có `COMMENT ON TABLE <TABLE_NAME> IS '...'` (mô tả chức năng bảng), `COMMENT ON COLUMN <TABLE_NAME>.<COLUMN_NAME> IS '...'` (mô tả chi tiết ý nghĩa nghiệp vụ, kiểu dữ liệu, các giá trị ENUM/Checkbox, khóa ngoại FK cho 100% tất cả các cột). Kịch bản Oracle PL/SQL package hoàn chỉnh, có thể copy và chạy trực tiếp trên môi trường Oracle Database 19c để đóng gói toàn bộ thủ tục CRUD, GetById, GetByName, GetListPaging.

## 3. Input

- File hướng dẫn hành vi/quy tắc chung của dự án và file yêu cầu nghiệp vụ riêng của chức năng (`*-command.md`).
- Cấu trúc bảng thực tế nếu định tái sử dụng bảng có sẵn (lấy từ người dùng hoặc `DESC`/`ALL_TAB_COLUMNS`, không đoán).
- Các package/thủ tục khác đang dùng chung bảng đó (nếu là bảng lõi/dùng chung nhiều nơi).

## 4. Thứ tự đọc file rule trước khi code

Đọc **đúng thứ tự sau**, không bỏ qua, không đảo:

1. File hướng dẫn hành vi chung của dự án (`agents_change.md`/`claude.md`) — quy tắc giao tiếp, không tự suy diễn nghiệp vụ, bắt buộc có implementation plan trước khi code.
2. `SAFEDEV.md` — nguyên tắc thiết kế bắt buộc cho mọi service ghi dữ liệu nghiệp vụ.
3. `PRM-DEV-GEN-002.md` — hướng dẫn gen code backend.
4. `PRM-DEV-API-GEN-001.MD` — hướng dẫn gen API.
5. `PRM-DEV-ANG-GEN-001.MD` — hướng dẫn gen Angular (nếu chức năng có FE đi kèm).
6. File `*-command.md` riêng của chức năng — lấy đúng yêu cầu nghiệp vụ cụ thể.

## 5. Quy tắc thiết kế bảng — tránh làm lại/làm vỡ hệ thống

- **Trước khi tạo bảng mới, khảo sát kỹ bảng hiện có** nếu nghi ngờ có thể tái sử dụng (số cột thực tế, tên cột, kiểu dữ liệu). Không đoán/nhớ nhầm cấu trúc bảng rồi thiết kế sai. Nếu người dùng cung cấp danh sách cột thực tế, lấy đó làm chuẩn tuyệt đối.
- **Ưu tiên `ALTER TABLE`** tái sử dụng bảng có sẵn thay vì tạo bảng mới trùng mục đích, chỉ thêm đúng những cột thực sự còn thiếu.
- Khi có nhiều phương án thiết kế khác nhau (tái sử dụng vs tạo mới, gộp cột vs tách bảng riêng, đặt cột mới ở bảng chính hay bảng phụ...) → **hỏi lại người dùng bằng câu hỏi trắc nghiệm rõ ràng**, không tự chọn rồi làm luôn.
- **`COMMENT ON TABLE`/`COMMENT ON COLUMN` phải phủ 100% cột**, kể cả cột có sẵn từ trước khi `ALTER`. Cột nào chưa chắc chắn ý nghĩa nghiệp vụ thì ghi rõ nhãn `[GIẢ ĐỊNH - CẦN XÁC NHẬN]` thay vì khẳng định chắc chắn.
- ⚠️ **Rủi ro lớn nhất khi `ALTER TABLE` một bảng lõi đang dùng chung nhiều nơi**: các thủ tục khác có thể đang `SELECT *` hoặc gán qua `%ROWTYPE` dựa theo **thứ tự cột** — thêm/bớt cột có thể làm lệch vị trí và vỡ chức năng khác đang chạy production, dù chức năng đó không liên quan gì tới bảng vừa sửa về mặt nghiệp vụ.
  - *Sự cố thực tế đã gặp*: thêm 4 cột vào bảng user hệ thống làm gãy luôn chức năng đăng nhập, vì 1 thủ tục đổi mật khẩu dùng `v_table SMTM_USER_LOG%ROWTYPE` rồi `SELECT a.*, sysdate INTO v_table` — số cột bảng nguồn tăng lên làm lệch khớp với `%ROWTYPE` của bảng đích.
  - **Trước khi `ALTER` bảng lõi**: chủ động rà soát toàn bộ package đang tham chiếu bảng đó tìm `SELECT *` hoặc `%ROWTYPE`.
  - **Nếu phát hiện rủi ro**: sửa data-safe (backup bảng trước, không mất dữ liệu khi đổi thứ tự/thêm cột) và đổi toàn bộ `SELECT *` liên quan thành liệt kê rõ tên từng cột.
  - **Sau khi đổi cấu trúc bảng lõi**: luôn build lại + gọi thử API/luồng đăng nhập hoặc luồng lõi khác của hệ thống để xác nhận không vỡ chức năng cũ, không chỉ test riêng chức năng mới.

## 6. Quy cách file .sql — để thực sự "copy chạy được ngay"

- **Tách nhiều file .sql đánh số thứ tự chạy** (`01_alter_<bang_chinh>.sql`, `02_create_new_tables.sql`, `03_pkg_<doi_tuong_chinh>.sql`, `04_pkg_<doi_tuong_lien_quan>.sql`...), mỗi file ghi rõ dòng đầu **PRE-REQUISITE** (file nào phải chạy trước) trong comment header:

  ```sql
  -- =============================================================================
  -- SYSTEM: <ten he thong>
  -- PACKAGE: PKG_<TEN_DOI_TUONG>
  -- MUC DICH: CRUD + tra cuu <mo ta ngan gon>.
  -- PRE-REQUISITE: Da chay 02_create_new_tables.sql
  -- =============================================================================
  ```

- Mỗi file package gồm đúng 2 khối theo thứ tự, dùng **`CREATE OR REPLACE`** (không dùng `CREATE` thường) để chạy lại nhiều lần không lỗi "object already exists":

  ```sql
  CREATE OR REPLACE PACKAGE PKG_<TEN> AS
      -- khai bao procedure, co comment ngay tren tung tham so optional
  END PKG_<TEN>;
  /

  CREATE OR REPLACE PACKAGE BODY PKG_<TEN> AS
      -- cai dat
  END PKG_<TEN>;
  /
  ```

- Phần **spec** (khai báo) phải có comment ngay trên mỗi procedure giải thích mục đích tham số optional (đặc biệt các tham số lọc `p_..._search`, `p_from_date/p_to_date`) — người khác đọc spec là hiểu ngay cách gọi, không cần đọc body.

## 7. Cấu trúc 1 package chuẩn cho 1 bảng nghiệp vụ

6 thủ tục bắt buộc: `PR_CREATE`, `PR_UPDATE`, `PR_DELETE`, `PR_GET_BY_ID`, `PR_GET_BY_NAME`, `PR_GET_LIST_PAGING`. Nếu có bảng con phụ thuộc (quan hệ N-N hoặc 1-N cần gán/gỡ), viết thêm thủ tục riêng (vd `PR_ADD_...`/`PR_REMOVE_...`) thay vì nhồi vào `PR_UPDATE`.

### 7.1. `PR_CREATE`

```sql
PROCEDURE PR_CREATE(
    p_ten_truong_1   IN  <BANG>.<COT_1>%TYPE,
    p_ten_truong_2   IN  <BANG>.<COT_2>%TYPE,
    p_created_by     IN  <BANG>.CREATED_BY%TYPE,
    o_id             OUT <BANG>.<COT_ID>%TYPE
) IS
BEGIN
    IF p_ten_truong_1 IS NULL OR p_ten_truong_2 IS NULL THEN
        RAISE_APPLICATION_ERROR(-20001,
            'PKG_<TEN>.PR_CREATE: <TEN_TRUONG_1>, <TEN_TRUONG_2> la bat buoc.');
    END IF;

    o_id := SEQ_<TEN_BANG>.NEXTVAL;

    INSERT INTO <BANG> (<COT_ID>, <COT_1>, <COT_2>, CREATED_BY, CREATED_DATE)
    VALUES (o_id, p_ten_truong_1, p_ten_truong_2, p_created_by, SYSDATE);
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20002,
            'PKG_<TEN>.PR_CREATE: <TEN_TRUONG_1> "' || p_ten_truong_1 || '" da ton tai.');
END PR_CREATE;
```

- Check `NULL` các field bắt buộc → mã lỗi `-20001`.
- Lấy ID mới từ `SEQ_<TEN_BANG>.NEXTVAL`.
- `INSERT` **liệt kê rõ tên cột** — tuyệt đối không dùng `INSERT INTO <BANG> VALUES (...)` theo thứ tự ngầm định.
- Khối `EXCEPTION WHEN DUP_VAL_ON_INDEX` → mã lỗi `-20002`, báo trùng khóa thân thiện thay vì lỗi ORA gốc khó hiểu.

### 7.2. `PR_UPDATE`

```sql
UPDATE <BANG> SET ... WHERE <COT_ID> = p_id AND IS_DELETED = 0;
IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20003,
        'PKG_<TEN>.PR_UPDATE: Khong tim thay ban ghi <COT_ID>=' || p_id || '.');
END IF;
```

### 7.3. `PR_DELETE` (xóa mềm, có kiểm tra ràng buộc con)

```sql
PROCEDURE PR_DELETE(p_id IN <BANG>.<COT_ID>%TYPE, p_deleted_by IN <BANG>.UPDATED_BY%TYPE) IS
    v_in_use NUMBER;
BEGIN
    SELECT COUNT(1) INTO v_in_use FROM <BANG_CON> WHERE <FK_COT> = p_id AND IS_DELETED = 0;
    IF v_in_use > 0 THEN
        RAISE_APPLICATION_ERROR(-20004,
            'PKG_<TEN>.PR_DELETE: Ban ghi ' || p_id || ' dang co ' || v_in_use ||
            ' ban ghi lien quan, khong the xoa.');
    END IF;

    UPDATE <BANG> SET IS_DELETED = 1, UPDATED_BY = p_deleted_by, UPDATED_DATE = SYSDATE
    WHERE <COT_ID> = p_id AND IS_DELETED = 0;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20003,
            'PKG_<TEN>.PR_DELETE: Khong tim thay ban ghi <COT_ID>=' || p_id || '.');
    END IF;
END PR_DELETE;
```

Xóa mềm (`IS_DELETED = 1`), **không xóa vật lý**. Nếu bảng có bảng con phụ thuộc, kiểm tra trước và chặn bằng mã lỗi `-20004`.

### 7.4. `PR_GET_LIST_PAGING` — pattern lọc động + phân trang chuẩn

```sql
PROCEDURE PR_GET_LIST_PAGING(
    p_search_keyword  IN  VARCHAR2 DEFAULT NULL,
    p_from_date       IN  DATE DEFAULT NULL,
    p_to_date         IN  DATE DEFAULT NULL,
    p_page_number     IN  NUMBER,
    p_page_size       IN  NUMBER,
    p_sort_column     IN  VARCHAR2 DEFAULT '<COT_MAC_DINH>',
    p_sort_direction  IN  VARCHAR2 DEFAULT 'ASC',
    o_cursor          OUT SYS_REFCURSOR,
    o_total_records   OUT NUMBER
) IS
    v_sort_column    VARCHAR2(30) := F_VALIDATE_SORT_COLUMN(p_sort_column);
    v_sort_direction VARCHAR2(4)  := F_VALIDATE_SORT_DIRECTION(p_sort_direction);
    v_keyword        VARCHAR2(202) := CASE WHEN p_search_keyword IS NOT NULL
                                            THEN '%' || UPPER(p_search_keyword) || '%' END;
    v_offset    NUMBER := (NVL(p_page_number, 1) - 1) * NVL(p_page_size, 20);
    v_page_size NUMBER := NVL(p_page_size, 20);
    v_count_sql VARCHAR2(2000);
    v_data_sql  VARCHAR2(4000);

    c_params_cte CONSTANT VARCHAR2(300) :=
        'WITH params AS (SELECT :p_keyword AS keyword, :p_from_date AS from_date, ' ||
        ':p_to_date AS to_date FROM DUAL) ';
    c_where CONSTANT VARCHAR2(700) :=
        ' WHERE a.IS_DELETED = 0' ||
        '   AND (params.keyword IS NULL OR UPPER(a.<COT_TEN>) LIKE params.keyword)' ||
        '   AND (params.from_date IS NULL OR a.<COT_NGAY> >= TRUNC(params.from_date))' ||
        '   AND (params.to_date IS NULL OR a.<COT_NGAY> < TRUNC(params.to_date) + 1)';
BEGIN
    v_count_sql := c_params_cte || 'SELECT COUNT(1) FROM <BANG> a, params' || c_where;
    EXECUTE IMMEDIATE v_count_sql INTO o_total_records USING v_keyword, p_from_date, p_to_date;

    v_data_sql := c_params_cte ||
        'SELECT a.<COT_ID>, a.<COT_TEN>, a.<COT_NGAY> FROM <BANG> a, params' || c_where ||
        ' ORDER BY ' || v_sort_column || ' ' || v_sort_direction ||
        ' OFFSET :p_offset ROWS FETCH NEXT :p_page_size ROWS ONLY';

    OPEN o_cursor FOR v_data_sql USING v_keyword, p_from_date, p_to_date, v_offset, v_page_size;
END PR_GET_LIST_PAGING;
```

Các điểm bắt buộc trong pattern này:

- 2 hàm private `F_VALIDATE_SORT_COLUMN`/`F_VALIDATE_SORT_DIRECTION` (khai báo trước trong package body) **whitelist** cột/chiều sort được phép — chặn SQL injection qua tên cột truyền từ FE:
  ```sql
  FUNCTION F_VALIDATE_SORT_COLUMN(p_column IN VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
      RETURN CASE UPPER(p_column)
          WHEN '<COT_A>' THEN 'a.<COT_A>'
          WHEN '<COT_B>' THEN 'a.<COT_B>'
          ELSE 'a.<COT_MAC_DINH>'
      END;
  END;
  ```
- `v_keyword` build sẵn wildcard `%...%` trước khi bind, không nối chuỗi trực tiếp vào SQL động.
- 1 hằng `WITH params AS (SELECT :bind1 AS x, :bind2 AS y ... FROM DUAL)` dùng **chung** cho cả câu đếm và câu lấy dữ liệu — tránh viết điều kiện lọc 2 lần dễ lệch nhau.
- **Bảng chính trong SQL động luôn có alias** (`a`) và **mọi cột trong WHERE/SELECT/ORDER BY đều gọi qua alias** — tránh lỗi `ORA-00918: column ambiguously defined` khi tên cột trong CTE `params` trùng tên cột thật của bảng (đây là lỗi thực tế đã gặp khi CTE đặt tên cột filter giống hệt tên cột bảng).
- `EXECUTE IMMEDIATE ... INTO ... USING ...` cho câu đếm, `OPEN o_cursor FOR ... USING ...` cho câu lấy dữ liệu — thứ tự bind trong `USING` phải khớp chính xác thứ tự `:bind` xuất hiện trong SQL động.
- `OFFSET :p_offset ROWS FETCH NEXT :p_page_size ROWS ONLY` cho phân trang chuẩn Oracle 12c+.

### 7.5. Proc dropdown cho khóa ngoại (nếu màn hình cần)

```sql
PROCEDURE PR_GET_<TEN>_DROPDOWN(o_cursor OUT SYS_REFCURSOR) IS
BEGIN
    OPEN o_cursor FOR
        SELECT <COT_MA> AS VALUE, <COT_TEN> AS TEXT, <COT_PHU_CAN_AUTOFILL>
        FROM <BANG_THAM_CHIEU>
        WHERE <COT_TRANG_THAI> = '<GIA_TRI_DANG_HOAT_DONG>'
        ORDER BY <COT_TEN>;
END;
```

Đặt tên cột alias khớp field FE mong đợi (`VALUE`/`TEXT`), kèm cột phụ cần cho auto-fill (vd trả thêm mã đơn vị sở hữu để FE tự điền field liên quan), chỉ lấy các bản ghi đang ở trạng thái hoạt động.

## 8. Quy ước mã lỗi `RAISE_APPLICATION_ERROR`

Đánh số nhất quán trong **cùng 1 package** để người đọc log đoán ngay loại lỗi qua mã số mà không cần mở code:

| Mã lỗi | Ý nghĩa |
|---|---|
| `-20001` | Thiếu field bắt buộc |
| `-20002` | Trùng khóa/mã đã tồn tại |
| `-20003` | Không tìm thấy bản ghi |
| `-20004` | Bị chặn do còn bản ghi liên quan (ràng buộc con) |

Nội dung message luôn theo mẫu: `'<TEN_PACKAGE>.<TEN_PROCEDURE>: <mo ta loi tieng Viet khong dau, ro rang>' || <gia_tri_lien_quan> || '.'` — vừa dễ trace vừa hiển thị được thẳng ra UI qua tầng backend (không lộ thông tin kỹ thuật nhạy cảm như tên bảng/cột nội bộ nếu không cần thiết).

## 9. Quy trình thực hiện

1. Đọc file rule theo đúng thứ tự (Mục 4).
2. Khảo sát bảng hiện có nếu định tái sử dụng; nếu có nhiều phương án thiết kế, hỏi lại người dùng trước khi code (Mục 5).
3. Viết `01_alter_<bang>.sql`/`02_create_new_tables.sql` với `COMMENT ON TABLE/COLUMN` phủ 100% cột.
4. Nếu `ALTER` bảng lõi dùng chung: rà soát các package khác đang `SELECT *`/`%ROWTYPE` trên bảng đó trước, sửa data-safe nếu có rủi ro (Mục 5).
5. Viết từng file package theo đúng cấu trúc Mục 6-8.
6. Chạy thử trên môi trường Oracle thật: tạo bảng → tạo package → gọi thử từng thủ tục (đặc biệt `PR_GET_LIST_PAGING` với đủ tổ hợp filter) để bắt sớm lỗi `ORA-00918`/`PLS-00306`/sai kiểu dữ liệu tham số.
7. Nếu có sửa bảng lõi: build lại toàn hệ thống + test lại luồng lõi khác (vd đăng nhập) trước khi báo hoàn tất.

Nếu chức năng có đi kèm code backend/frontend, tiếp tục bằng skill `gen-module-fullstack` sau khi package Oracle đã chạy ổn.

## 10. Quality check trước khi báo hoàn tất

- [ ] `COMMENT ON TABLE`/`COMMENT ON COLUMN` phủ 100% cột, cột chưa chắc ý nghĩa đã đánh dấu `[GIẢ ĐỊNH - CẦN XÁC NHẬN]`.
- [ ] Đủ 6 thủ tục chuẩn (`PR_CREATE/PR_UPDATE/PR_DELETE/PR_GET_BY_ID/PR_GET_BY_NAME/PR_GET_LIST_PAGING`), có proc dropdown riêng nếu cần FK.
- [ ] Mọi bảng trong SQL động đều có alias, mọi cột lọc/sort đều gọi qua alias (không lỗi ORA-00918).
- [ ] `p_sort_column`/`p_sort_direction` đều đi qua hàm whitelist, không nối thẳng input người dùng vào SQL động.
- [ ] Mã lỗi `RAISE_APPLICATION_ERROR` đánh số nhất quán theo Mục 8.
- [ ] Nếu có `ALTER` bảng dùng chung: đã rà soát và xử lý xong rủi ro `SELECT */%ROWTYPE` ở các package khác, đã build + test lại luồng lõi.
- [ ] File `.sql` đánh số thứ tự chạy rõ ràng, có dòng PRE-REQUISITE, dùng `CREATE OR REPLACE` để chạy lại không lỗi.

## 11. Output format

Xuất các file `.sql` đánh số thứ tự trong thư mục `sql/` của module. Báo lại: danh sách package đã tạo/sửa, danh sách bảng đã `ALTER`/tạo mới, và (nếu có) danh sách rủi ro đã phát hiện + đã xử lý khi đụng vào bảng dùng chung.
