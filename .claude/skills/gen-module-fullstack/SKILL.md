---
name: gen-module-fullstack
description: Code một module full-stack (.NET 8 Clean Architecture backend + Angular 17/NgModule + DevExtreme frontend) trên nền package Oracle đã có sẵn (xem skill gen-sql-package), mô phỏng đúng màn hình/tính năng tương tự đã có trong hệ thống RLOS v3. Dùng khi cần code màn hình danh sách/chi tiết mới cho một chức năng nghiệp vụ.
---

# Code full-stack 1 module (.NET 8 Clean Architecture + Angular 17 + DevExtreme)

Đúc kết từ quá trình code backend + frontend module Quản lý Nhân sự đại lý & Đào tạo (RLOS v3). Bổ sung cho skill `gen-sql-package` (phần Oracle) — skill này tập trung vào phần **.NET backend + Angular frontend** phía trên package SQL đã có sẵn.

## 1. Role

Bạn là Full-stack Developer làm việc trên dự án .NET 8 Clean Architecture + Angular 17 (NgModule) + DevExtreme, code theo đúng convention đã có sẵn trong repo — **không tự sáng tạo pattern mới** khi đã có màn hình/tính năng tương tự làm mẫu.

## 2. Mục tiêu

Code 1 module full-stack (Domain → Infrastructure → Application → API → Angular component) hoạt động đúng ngay lần chạy đầu, tái sử dụng tối đa service/component dùng chung đã có, không phá vỡ chức năng khác.

## 3. Input

- Package Oracle đã có sẵn (xem skill `gen-sql-package`) — biết trước tên procedure, tham số, thứ tự tham số.
- File rule đọc theo đúng thứ tự đã nêu trong skill `gen-sql-package` Mục 4 (đặc biệt `PRM-DEV-GEN-002.md`, `PRM-DEV-API-GEN-001.MD`, `PRM-DEV-ANG-GEN-001.MD`).
- Màn hình/tính năng tương tự đã có trong hệ thống để mô phỏng theo (vd `/identity/user-list` + `/identity/user-detail` khi làm màn hình danh sách/chi tiết mới).

## 4. Quy tắc bắt buộc

- Khi có màn hình tương tự đã tồn tại, **mô phỏng đúng theo pattern đó** (cấu trúc file, tên biến, thứ tự field, cách gọi service) thay vì tự nghĩ ra cách làm mới.
- Khi cần 1 API/service đã có sẵn (dropdown, upload file...), **hỏi rõ và tái sử dụng** thay vì viết API mới trùng chức năng — nếu không chắc, hỏi người dùng "dùng lại API nào".
- Không tự thêm tính năng/trường/validate ngoài yêu cầu ("simplicity first" — code tối thiểu giải quyết đúng yêu cầu).
- Sau mỗi thay đổi, **verify bằng build thật**, không chỉ đọc lại code bằng mắt (xem Mục 8).

---

## 5. Backend (.NET 8 Clean Architecture)

### 5.1. Cấu trúc thư mục theo layer

```
Shared/RlosV3.Domain/Dtos/<TenModule>/
    <Doi_tuong>Dto.cs
    Search<Doi_tuong>Dto.cs
    <CacDtoPhu>.cs                 // dropdown item, add/remove request...

Shared/RlosV3.Infrastructure/Repositories/<Doi_tuong>Repository/
    I<Doi_tuong>Repository.cs
    <Doi_tuong>Repository.cs       // raw ADO.NET, KHONG dung EF Core cho cac repo goi package Oracle

Services/API/RlosV3.Application/Services/<TenModule>/
    <Doi_tuong>Service.cs          // pass-through goi Repository, khong chua logic Oracle

Services/API/RlosV3.API/Controllers/
    <Doi_tuong>Controller.cs       // [Route("api/<module>/<doi-tuong>")], goi Service
```

Đăng ký DI: repository mới → `InfrastructureServiceRegistration.cs`; service mới → `ApplicationServiceRegistration.cs`. MediatR (nếu dùng CQRS) tự scan assembly, không cần đăng ký tay.

### 5.2. ⚠️ Gotcha bắt buộc nhớ khi dùng ODP.NET (Oracle.ManagedDataAccess)

- **`OracleCommand.BindByName` mặc định là `false`** — nghĩa là tham số bind theo **vị trí thêm vào `Parameters`**, không theo tên `p_xxx`. Nếu thứ tự `cmd.Parameters.Add(...)` trong C# không khớp tuyệt đối với thứ tự tham số trong signature PL/SQL (đặc biệt các tham số OUT thêm sau), sẽ lỗi `PLS-00306: wrong number or types of arguments` hoặc tệ hơn — **bind sai giá trị vào sai tham số mà không báo lỗi gì**. Luôn set:
  ```csharp
  using var cmd = new OracleCommand("PKG_XXX.PR_YYY", conn)
  {
      CommandType = CommandType.StoredProcedure,
      BindByName = true   // BẮT BUỘC tren MOI OracleCommand
  };
  ```
- **Tham số OUT kiểu số (`OracleDbType.Int32`...) có thể trả về dạng `Oracle.ManagedDataAccess.Types.OracleDecimal`**, không phải `int` .NET thuần. Convert trực tiếp sẽ crash:
  ```csharp
  // SAI - throw "Unable to cast object of type 'OracleDecimal' to type 'System.IConvertible'"
  return Convert.ToInt32(outputParam.Value);

  // ĐÚNG - luôn qua ToString() truoc
  return Convert.ToInt32(outputParam.Value.ToString());
  ```
  Áp dụng cho **mọi** OUT param số (id mới sinh ra từ `PR_CREATE`, `o_total_records` của phân trang...).
- **`STT` không có sẵn từ package** — nếu DTO có cột `Stt` để hiển thị số thứ tự, phải tự đếm khi map từng dòng reader, package không trả sẵn:
  ```csharp
  var stt = 0;
  while (await reader.ReadAsync())
  {
      stt++;
      var item = MapRow(reader);
      item.Stt = stt;
      result.Add(item);
  }
  ```
- Dựng `IPagedList<T>`/`PagedList<T>` bằng constructor không tham số + gán property tường minh (`PageNumber`, `PageSize`, `TotalItems`, `TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)`), không dùng constructor nhận `source` (dễ tính sai `TotalItems` khi `source` chỉ là 1 trang dữ liệu, không phải toàn bộ).
- Khi filter theo mã tham chiếu từ bảng khác (vd mã chi nhánh lấy từ `BANK_CODE` của bảng đại lý), dữ liệu cột đó có thể có **khoảng trắng thừa** nếu là cột fixed-width — so sánh chuỗi ở tầng backend (nếu có) hoặc FE đều phải `.Trim()` trước khi so sánh bằng, không so sánh bằng tuyệt đối `===`.

### 5.3. Quy ước response

- Thành công → trả **thẳng DTO/`IPagedList<T>`** ở top-level response, không bọc thêm trong `data`.
- Lỗi → `{ resCode, resDesc }` qua helper `HandleException` dùng chung ở mỗi Controller — parse `ex.Message` theo dấu `|` (resCode ở trước, resDesc ở sau) do `RAISE_APPLICATION_ERROR` bên Oracle đẩy lên qua `ORA-20xxx: <resCode có the encode trong message>`; nếu không có `|`, mặc định `resCode = "900"`.
- Insert/Update trả về `int` số dòng ảnh hưởng thường KHÔNG theo quy ước `{resCode, resDesc}` — kiểm tra kỹ Controller/Service tương ứng đang trả kiểu gì trước khi FE parse response (`response.resCode` sẽ `undefined` nếu response chỉ là số nguyên thô).

### 5.4. Gọi service dùng chung — không viết API mới trùng chức năng

- Upload/xóa/tải file → luôn qua `RlosV3.Integration.API` (`api/file-manager-file-system/*`), FE gọi qua service dùng chung (vd `ReconcileService.uploadFile/deleteFile/downloadFileBase64ByName`, `AvatarUploadService`) — không viết endpoint upload file mới.
- Dropdown chi nhánh/đơn vị dùng chung toàn hệ thống → tái sử dụng đúng API đã dùng ở màn hình tương tự gần nhất (vd `/identity/user-list` dùng `BranchService.getDropdownForIssueCode()` gọi `api/system/get-dropdown-for-atm-code`) — không tự viết proc/API dropdown mới nếu đã có cái tương đương.
- Frontend luôn gọi qua **API Gateway** (`CONST.API_URL`), route `/rlosv3api/*` → `RlosV3.API`, `/rlosv3interapi/*` → `RlosV3.Integration.API` — không bao giờ trỏ thẳng vào port của service backend cụ thể.

---

## 6. Frontend (Angular 17, NgModule)

### 6.1. Cấu trúc màn hình

```
fe/src/app/views/pages/<module>/<feature>/
    <ten-man-hinh>-list/
        <ten-man-hinh>-list.component.{ts,html,scss}
    <ten-man-hinh>-detail/
        <ten-man-hinh>-detail.component.{ts,html,scss}
```

Đăng ký component + route trong `<module>.module.ts`. Luôn dùng lại các wrapper component dùng chung sẵn có (`app-custom-text-box`, `app-custom-select-box`, `app-custom-date-box`, `app-custom-label`, `app-custom-error`, `app-custom-button`, `app-data-grid-control`) — **không** dùng thẳng `dx-text-box`/`dx-select-box`... trong màn hình nghiệp vụ.

### 6.2. Màn hình Danh sách

- Hàng bộ lọc (bootstrap `row`/`col-md-*`) + hàng nút thao tác **căn phải**, thứ tự cố định: `LÀM MỚI → TÌM KIẾM → Tạo mới` (xem màn hình mẫu `/system/ibservice-pack-list` nếu cần đối chiếu).
- `app-data-grid-control` nhận `[dataSource]`/`[columns]`/`[length]`/`[requestFilter]`, bắn `(loadData)` gọi lại `service.getList(params)`.
- Nút "Làm mới" phải đưa bộ lọc về đúng **giá trị mặc định thật** của màn hình (không phải luôn luôn về rỗng — nếu màn hình có mặc định kiểu "khoảng ngày = hôm nay trừ N tháng → hôm nay" thì Làm mới phải set lại đúng khoảng đó).

### 6.3. Màn hình Chi tiết

- Lấy `id` qua `route.params.subscribe(...)` (không chỉ đọc 1 lần ở `ngOnInit`) để xử lý đúng khi điều hướng giữa 2 bản ghi khác nhau của cùng component (Angular tái sử dụng instance component, không destroy/recreate).
- Pattern `isUpdate` (`'0'` = tạo mới, `'1'` = sửa) + `emptyData()` reset state mỗi khi route param đổi.
- Validate: `touchedMap`/`checkedMap` (key là path string field, vd `'data.email'`) + `app-custom-error` bind `[touched]`/`[(valid)]`. `onSave()` đánh dấu touched toàn bộ field bắt buộc, `await firstValueFrom(ngZone.onStable.pipe(take(1)))` rồi mới đọc `checkedMap` (đợi Angular chạy xong 1 vòng change detection để validate kịp cập nhật).
- Tab 2 màn hình (thông tin chi tiết + dữ liệu liên quan) dùng **Bootstrap `nav nav-tabs`** (`[class.active]` + `(click)` + `[hidden]`), **không dùng `dx-tabs` của DevExtreme** — quy ước hiển thị trong dự án này là dạng ô viền sát trái, không phải gạch chân căn giữa (tham khảo `/customer-manage/loan-interbank`).
- Dropdown A tự động điền field B (vd chọn Đại lý → tự điền Chi nhánh): chỉ gán B khi **tìm thấy match** trong danh sách A đã load, **không** gán rỗng khi không tìm thấy (tránh xóa nhầm dữ liệu B đã có sẵn lúc `A` chưa kịp load xong do race condition async). Nếu giá trị nguồn (vd `bankCode`) có thể vượt độ dài cột đích, kiểm tra length trước khi gán để tránh lỗi `ORA-12899` khi lưu.

### 6.4. Upload/xóa file (ảnh đại diện, chứng chỉ...)

- Đổi tên file kèm timestamp trước khi upload để tránh trùng tên trên FTP: `<ten_goc>_<yyyyMMddHHmmss>.<ext>`.
- Thư mục theo quy ước: `/rlos_ftp/{year}/Upload_HS/<TenLoaiFile>/[<id_lien_quan>/]`.
- Thứ tự bắt buộc: **upload file lên FTP trước → lưu đường dẫn vào DB sau** (không lưu DB trước rồi upload sau — nếu upload lỗi giữa chừng sẽ để lại bản ghi DB trỏ tới file không tồn tại).
- Với popup có nút "xóa file" riêng: theo pattern tham khảo `reconcile/create-req-1-list` — click "xóa" chỉ **đánh dấu** trên UI, chưa gọi API; chỉ khi bấm **Lưu** của popup mới thực sự gọi `deleteFile()` (nếu có đánh dấu xóa) rồi `uploadFile()` (nếu có chọn file mới) rồi mới gọi API cập nhật DB — đúng thứ tự xóa cũ → upload mới → cập nhật DB, và nếu bước nào lỗi thì dừng lại, không cập nhật DB nửa chừng.

---

## 7. Quy trình thực hiện

1. Đọc package Oracle đã có (tên proc, tham số, thứ tự) — xem skill `gen-sql-package`.
2. Tìm màn hình/tính năng tương tự gần nhất trong hệ thống để mô phỏng cấu trúc.
3. Code Domain (DTO) → Infrastructure (Repository, chú ý Mục 5.2) → Application (Service) → API (Controller) → đăng ký DI.
4. `dotnet build` xác nhận 0 lỗi trước khi sang FE.
5. Code Angular component (list rồi detail) theo Mục 6, tái sử dụng service/component dùng chung.
6. `ng build --configuration development` xác nhận 0 lỗi.
7. Chạy thử qua UI thật (hoặc `curl` thẳng API nếu chưa có FE) với dữ liệu thật, không chỉ test happy-path — thử cả trường hợp trùng khóa, thiếu field bắt buộc, FK không hợp lệ.
8. Nếu lỗi mơ hồ (500 chung chung, "0 Unknown Error") → `curl` thẳng vào API để đọc message lỗi thật từ Oracle/backend, không đoán qua log FE.

Nếu cần dữ liệu mẫu thật qua UI hoặc ảnh minh họa cho tài liệu, dùng tiếp skill `playwright-automation`.

## 8. Verification bắt buộc trước khi báo hoàn tất

- [ ] `dotnet build <đường dẫn>.sln 2>&1 | grep -c "error CS"` → phải ra `0`.
- [ ] `ng build --configuration development` (thư mục `fe/`) → chạy xong không có dòng lỗi, chỉ có warning CommonJS thông thường (an toàn, không phải lỗi).
- [ ] Đã gọi thử thật (UI hoặc `curl`) ít nhất luồng tạo mới + luồng lỗi validate cơ bản, không chỉ tin vào việc build sạch.
- [ ] Nếu có sửa file dùng chung (`system.module.ts`, service dùng chung...), đã kiểm tra không làm hỏng màn hình khác đang dùng chung file đó.
- [ ] Không còn import/biến không dùng do chính thay đổi của mình gây ra (dọn orphan sau khi refactor).

## 9. Output format

Báo lại: danh sách file đã tạo/sửa theo layer (Domain/Infrastructure/Application/API/Angular), kết quả 2 lệnh build, và danh sách API/service dùng chung đã tái sử dụng (thay vì viết mới) để người dùng biết chức năng nào đang phụ thuộc lẫn nhau.
