# Requirement: WBS Schedule Generator

## 1. Tổng quan

Ứng dụng cần hỗ trợ tạo schedule dự án dựa trên danh sách WBS/task và estimate theo từng team. Hiện tại workflow đang được thực hiện thủ công trên Google Sheets: nhập task, chia theo level, estimate theo Backend/Frontend/QC/BrS, sau đó tô màu theo tuần để tạo schedule.

Mục tiêu của ứng dụng là tự động hóa phần tính toán và vẽ schedule, giúp khi task hoặc estimate thay đổi thì schedule được generate lại tự động, không cần tô màu thủ công từ đầu.

Ứng dụng được thiết kế theo hướng **frontend-only**, lưu dữ liệu bằng `localStorage`, không cần backend, không cần tài khoản, không cần đồng bộ cloud trong giai đoạn MVP.

---

## 2. Mục tiêu chính

Ứng dụng cần đáp ứng các nhu cầu sau:

1. Cho phép input danh sách task theo cấu trúc WBS.
2. Hỗ trợ tối đa 4 cấp level task.
3. Cho phép nhập estimate riêng cho từng team/role.
4. Cho phép đánh dấu thứ tự schedule độc lập với thứ tự hiển thị trên WBS.
5. Tự động tính duration của task dựa trên estimate của các team.
6. Tự động chia task vào các tuần làm việc.
7. Tự động render schedule dạng bảng/timeline giống Google Sheets.
8. Hỗ trợ paste dữ liệu trực tiếp từ Google Sheets (cả qua màn hình import lẫn paste thẳng vào table grid).
9. Hỗ trợ copy dữ liệu (task + schedule) ngược ra clipboard dạng TSV để paste lại vào Google Sheets.
10. Lưu dữ liệu trên `localStorage`.
11. Có cơ chế export/import dữ liệu để backup.
12. Reorder task theo priority bằng drag/drop (core feature, không optional).
13. Undo/redo cho mọi thao tác chỉnh sửa task/config.
14. Schedule tự regenerate ngay khi data đổi, có visual feedback rõ ràng.

---

## 3. Phạm vi MVP

### 3.1. In scope

MVP cần có các chức năng sau:

- Tạo project schedule mới.
- Onboarding empty-state + nút "Load sample data" để user thử ngay không cần nhập.
- Cấu hình project cơ bản.
- Nhập task thủ công.
- Paste data từ Google Sheets (qua import screen + paste thẳng vào table grid).
- Preview dữ liệu trước khi import.
- Mapping column khi import.
- Chỉnh sửa task trong table (inline edit + keyboard grid navigation kiểu Excel, desktop-first).
- Nhập estimate theo role.
- Tự động tính duration mỗi task.
- Sắp xếp schedule theo `scheduleOrder`.
- Drag/drop reorder task để chỉnh priority.
- Undo/redo.
- Generate schedule tự động (live regenerate + visual feedback).
- Render weekly schedule board (today marker, date labels, group color, overflow hint).
- Copy task table + schedule ra clipboard dạng TSV (paste lại vào Google Sheets).
- Lưu dữ liệu vào `localStorage`.
- Export/import JSON.
- Clear/reset project (có confirm + undo).

### 3.2. Out of scope trong MVP

Các chức năng sau chưa cần làm trong MVP:

- Task dependency.
- Critical path.
- Resource leveling theo từng người.
- Calendar holiday.
- Multi-user collaboration.
- Permission/user account.
- Cloud sync.
- Notification.
- Integration trực tiếp với Google Sheets API.
- Export sang Excel/PDF.

---

## 4. Đối tượng sử dụng

Người dùng chính là project manager, tech lead hoặc người quản lý estimate/schedule dự án đang dùng Google Sheets để quản lý WBS.

Người dùng cần một công cụ đơn giản hơn Jira/MS Project nhưng tự động hơn Google Sheets.

---

## 5. Luồng sử dụng chính

### 5.1. Tạo schedule từ dữ liệu Google Sheets

1. User mở ứng dụng.
2. User tạo project mới hoặc mở project đang có.
3. User copy một range task từ Google Sheets.
4. User paste vào màn hình import.
5. Ứng dụng parse dữ liệu dạng TSV.
6. Ứng dụng tự detect header và map column.
7. User kiểm tra preview.
8. User xác nhận import.
9. Ứng dụng tạo danh sách task.
10. User chỉnh lại order/estimate nếu cần.
11. Ứng dụng generate schedule tự động.
12. User xem schedule board.

### 5.2. Chỉnh sửa estimate và tự update schedule

1. User sửa estimate của một task.
2. Ứng dụng update task data.
3. Ứng dụng tự tính lại duration.
4. Ứng dụng generate lại toàn bộ schedule.
5. Schedule board được cập nhật ngay.

### 5.3. Thay đổi thứ tự schedule

1. User thay đổi `scheduleOrder` hoặc drag/drop task.
2. Ứng dụng sort lại task theo order mới.
3. Ứng dụng generate lại schedule.
4. Timeline được cập nhật theo thứ tự mới.

---

## 6. Cấu hình project

Mỗi project cần có các cấu hình tối thiểu sau:

| Field | Type | Default | Ghi chú |
|---|---:|---:|---|
| `projectName` | string | Untitled Project | Tên project |
| `startDate` | string | current date | Ngày hoặc tháng bắt đầu schedule |
| `workingDaysPerWeek` | number | 5 | Số ngày làm việc mỗi tuần |
| `hoursPerDay` | number | 8 | Dùng khi input estimate theo hour |
| `inputMode` | enum | days | `days` hoặc `hours` |
| `skipThresholdDays` | number | 0.5 | Nếu tuần còn ít hơn hoặc bằng số này thì skip sang tuần sau |
| `roles` | array | Backend, Frontend, QC, BrS | Danh sách team/role |
| `displayMonths` | number | 3 | Số tháng hiển thị mặc định |
| `unitPerDay` | number | 10 | Đơn vị nội bộ để tránh lỗi số thực |

---

## 7. Data model

### 7.1. Role

```ts
export type Role = {
  id: string;
  key: string;
  name: string;
  color?: string;
  enabled: boolean;
};
```

Role mặc định:

```ts
const defaultRoles = [
  { key: "backend", name: "Backend", enabled: true },
  { key: "frontend", name: "Frontend", enabled: true },
  { key: "qc", name: "QC", enabled: true },
  { key: "brs", name: "BrS", enabled: true },
];
```

### 7.2. Task

```ts
export type Task = {
  id: string;
  code: string;

  level1: string;
  level2?: string;
  level3?: string;
  level4?: string;

  title: string;

  displayOrder: number;
  scheduleOrder: number;

  estimates: Record<string, number>;

  enabled: boolean;
  color?: string;
  note?: string;
};
```

Trong đó:

- `id`: định danh nội bộ của task.
- `code`: mã WBS, ví dụ `2.04`, `2.05.01`.
- `level1`: nhóm cấp 1.
- `level2`: task/module cấp 2.
- `level3`, `level4`: optional, dùng cho mở rộng sau này.
- `title`: tên task dùng để hiển thị.
- `displayOrder`: thứ tự hiển thị trong table.
- `scheduleOrder`: thứ tự dùng để generate schedule.
- `estimates`: estimate theo từng role, đơn vị là day.
- `enabled`: task có được đưa vào schedule hay không.

### 7.3. Project data

```ts
export type ProjectData = {
  version: 1;
  project: {
    id: string;
    name: string;
    startDate: string;
    workingDaysPerWeek: number;
    hoursPerDay: number;
    inputMode: "days" | "hours";
    skipThresholdDays: number;
    unitPerDay: number;
    displayMonths: number;
    roles: Role[];
  };
  tasks: Task[];
  updatedAt: string;
};
```

### 7.4. Generated schedule segment

Schedule segment không cần lưu vào `localStorage`. Đây là dữ liệu generated từ `tasks` và `project config`.

```ts
export type ScheduleSegment = {
  taskId: string;
  weekIndex: number;
  offsetUnits: number;
  durationUnits: number;
};
```

Trong đó:

- `weekIndex`: index tuần tính từ `startDate`.
- `offsetUnits`: task bắt đầu ở vị trí nào trong tuần.
- `durationUnits`: task chiếm bao nhiêu phần của tuần đó.

---

## 8. Quy đổi estimate

Để tránh lỗi tính toán số thực, ứng dụng nên quy đổi day sang unit nội bộ.

Quy ước mặc định:

```txt
1 day = 10 units
0.1 day = 1 unit
0.5 day = 5 units
5 days/week = 50 units
```

Ví dụ:

```txt
Backend = 1.5 days => 15 units
Frontend = 0.6 days => 6 units
QC = 0.3 days => 3 units
```

Khi hiển thị trên UI, convert ngược từ unit sang day.

---

## 9. Rule tính duration

### 9.1. Task duration

Vì các team làm việc song song, duration để vẽ schedule của mỗi task là giá trị lớn nhất trong estimate của các role.

```ts
function getTaskDuration(task: Task): number {
  return Math.max(...Object.values(task.estimates).filter(Boolean));
}
```

Ví dụ:

```txt
Task A:
Backend: 3 days
Frontend: 2 days
QC: 1 day

Duration = max(3, 2, 1) = 3 days
```

Không lấy tổng estimate của các team.

### 9.2. Group duration

Trong MVP, schedule có thể chạy theo từng row level 2.

Ở bản mở rộng, nếu task có level 3/4, ứng dụng có thể aggregate estimate từ các child task lên parent.

Ví dụ:

```txt
Authentication
- Login
- Register
- Forgot Password
```

Estimate của `Authentication` có thể được tính bằng tổng estimate của các task con theo từng role.

```ts
parent.backend = sum(children.backend);
parent.frontend = sum(children.frontend);
parent.qc = sum(children.qc);
parent.duration = max(parent.backend, parent.frontend, parent.qc);
```

---

## 10. Rule generate schedule

### 10.1. Input

Input của thuật toán gồm:

- Danh sách task đang enabled.
- Project config.
- Estimate của từng task.
- Schedule order của từng task.

### 10.2. Sort task

Task cần được sort theo `scheduleOrder`.

```ts
const sortedTasks = tasks
  .filter(task => task.enabled)
  .sort((a, b) => a.scheduleOrder - b.scheduleOrder);
```

### 10.3. Capacity mỗi tuần

Mặc định:

```txt
1 week = 5 working days
1 day = 10 units
weekCapacity = 50 units
```

### 10.4. Skip threshold

Nếu phần còn lại của tuần nhỏ hơn hoặc bằng `skipThreshold`, task tiếp theo sẽ được chuyển sang tuần kế tiếp.

Mặc định:

```txt
skipThreshold = 0.5 day = 5 units
```

### 10.5. Chia task qua nhiều tuần

Nếu task dài hơn phần còn lại của tuần hiện tại, task sẽ được chia thành nhiều segment.

Ví dụ:

```txt
Week capacity = 5 days
Week 1 còn 2 days
Task B = 5 days

=> Week 1: Task B chiếm 2 days
=> Week 2: Task B chiếm 3 days
```

### 10.6. Pseudo-code

```ts
function generateSchedule(tasks: Task[], config: ProjectConfig): ScheduleSegment[] {
  const segments: ScheduleSegment[] = [];
  const weekUsed: number[] = [];

  let weekIndex = 0;

  const weekCapacity = config.workingDaysPerWeek * config.unitPerDay;
  const skipThreshold = config.skipThresholdDays * config.unitPerDay;

  const sortedTasks = tasks
    .filter(task => task.enabled)
    .sort((a, b) => a.scheduleOrder - b.scheduleOrder);

  for (const task of sortedTasks) {
    let remaining = getTaskDurationUnits(task, config.unitPerDay);

    if (remaining <= 0) continue;

    while (remaining > 0) {
      const used = weekUsed[weekIndex] ?? 0;
      const available = weekCapacity - used;

      if (available <= skipThreshold) {
        weekIndex += 1;
        continue;
      }

      const take = Math.min(remaining, available);

      segments.push({
        taskId: task.id,
        weekIndex,
        offsetUnits: used,
        durationUnits: take,
      });

      weekUsed[weekIndex] = used + take;
      remaining -= take;

      const remainingInWeek = weekCapacity - weekUsed[weekIndex];

      if (remainingInWeek <= skipThreshold) {
        weekIndex += 1;
      }
    }
  }

  return segments;
}
```

---

## 11. Import dữ liệu từ Google Sheets

### 11.1. Format input

Khi copy từ Google Sheets, dữ liệu thường là TSV.

Ví dụ:

```txt
Level 1	Level 2	#	Backend (D)	Frontend (D)	QC	BrS	Order
Consumer Frontsite	Authentication	2.02	1.5	0.5	0.6	0	2
Consumer Frontsite	Pickup	2.03	0.5	0.2	0.3	0	3
Consumer Frontsite	Chef Plan	2.04	2.4	1.0	0.9	0	4
```

Ứng dụng cần hỗ trợ **2 đường vào** cho data từ Sheets:

**A. Màn hình import (full control):**

- Textarea để paste data.
- Button parse/preview.
- Preview table.
- Column mapping.
- Radio: "Replace all" hoặc "Append" vào task list hiện có.
- Button confirm import.

**B. Paste thẳng vào table grid (fast path):**

- User select 1 cell trong Task Table rồi `Ctrl/Cmd+V` → app parse TSV và fill multi-cell từ vị trí đó (giống Excel/Sheets).
- Tự tạo row mới nếu paste vượt số row hiện có.
- Number cell parse số tự động; text cell giữ nguyên.
- Đây là đường nhanh nhất cho user đã quen Sheets — ưu tiên trải nghiệm này mượt.

### 11.0. Copy ngược ra Sheets

- Button "Copy table (TSV)" và "Copy schedule (TSV)" copy ra clipboard để paste lại Google Sheets.
- Select range cell trong grid + `Ctrl/Cmd+C` copy đúng range dạng TSV.
- Mục tiêu: round-trip Sheets ↔ app không mất data, không lock-in.

### 11.2. Auto-detect header

Ứng dụng cần tự detect dòng đầu tiên có phải header không.

Các column alias cần hỗ trợ:

```ts
const columnAliases = {
  level1: ["Level 1", "L1", "Group", "Module"],
  level2: ["Level 2", "L2", "Feature", "Task"],
  level3: ["Level 3", "L3", "Subtask"],
  level4: ["Level 4", "L4"],
  code: ["#", "Code", "WBS", "No."],
  backend: ["Backend", "Backend (D)", "BE"],
  frontend: ["Frontend", "FrontEnd (D)", "FE"],
  qc: ["QC", "QA", "Tester"],
  brs: ["BrS", "BRS", "Business"],
  order: ["Order", "Priority", "Sort", "Schedule Order"],
};
```

### 11.3. Fill-down empty group cells

Google Sheets thường để trống cell group ở các dòng con. Khi import, ứng dụng cần tự fill-down giá trị gần nhất.

Input:

```txt
Level 1	Level 2	Backend
Setup	Frontend Setup	0
	Backend Setup	0.5
	Database	0.6
Consumer Frontsite	Authentication	1.5
	Pickup	0.5
```

Kết quả cần hiểu là:

```txt
Setup / Frontend Setup
Setup / Backend Setup
Setup / Database
Consumer Frontsite / Authentication
Consumer Frontsite / Pickup
```

### 11.4. Validate khi import

Ứng dụng cần validate các lỗi cơ bản:

- Thiếu `level1` hoặc `level2`.
- Estimate không phải số.
- Estimate âm.
- Schedule order bị trùng.
- Task không có estimate nào lớn hơn 0.

Các lỗi nhẹ nên hiển thị warning, không nhất thiết block import.

---

## 12. UI requirements

### 12.1. Layout chính

Ứng dụng gồm 4 khu vực chính:

1. Project Config.
2. Import from Google Sheets.
3. Task Input Table.
4. Schedule Board.

### 12.2. Project Config UI

Các field cần có:

- Project name.
- Start date hoặc start month.
- Working days per week.
- Hours per day.
- Input mode: days/hours.
- Skip threshold.
- Role management.
- Display range.

### 12.3. Task Input Table

Table cần có các column tối thiểu:

| Column | Ghi chú |
|---|---|
| Enabled | Có đưa vào schedule hay không |
| Schedule Order | Thứ tự dùng để vẽ schedule |
| Display Order | Thứ tự hiển thị |
| Code | Mã WBS |
| Level 1 | Nhóm cấp 1 |
| Level 2 | Task/module cấp 2 |
| Backend | Estimate Backend |
| Frontend | Estimate Frontend |
| QC | Estimate QC |
| BrS | Estimate BrS |
| Duration | Auto calculated |
| Note | Optional |

Chức năng cần có:

- Add row.
- Duplicate row.
- Delete row (multi-select + bulk delete).
- Inline edit.
- Search/filter.
- Sort by schedule order.
- **Drag/drop reorder (core feature, không optional)** — kéo row đổi `scheduleOrder`, schedule regenerate ngay. Có drag handle rõ ràng, hỗ trợ keyboard (Alt+↑/↓ để move row).
- Show/hide role columns.

**Keyboard grid navigation (kiểu Excel/Sheets — quan trọng cho user quen Sheets):**

- Arrow keys di chuyển giữa cell.
- `Enter` / `Tab` commit + move xuống/phải.
- `Ctrl/Cmd+V` paste TSV multi-cell (xem 11.B).
- `Ctrl/Cmd+C` copy range dạng TSV.
- `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` undo/redo.
- Fill-down: select cell có value → kéo/Ctrl+D copy xuống các row dưới.

**Visual feedback inline:**

- Duration column update real-time khi đổi estimate.
- Row có warning (estimate âm, duplicate order, no estimate) hiện badge/icon ngay tại row, không block.
- Row đang được vẽ vào schedule highlight nhẹ; row `enabled=false` hoặc duration=0 dim đi.
- Mỗi level1 group có color chip nhất quán với schedule bar (auto-assign, user override được).

### 12.4. Schedule Board UI

Schedule board cần có dạng bảng/timeline.

Left side sticky columns:

- Code.
- Level 1.
- Level 2.
- Estimate columns.
- Duration.

Right side scrollable timeline:

- Month header (year/month, ví dụ `2026/06`).
- Week header với date range thật của tuần (ví dụ `W1 (06/01–06/05)`), không chỉ W1/W2.
- Schedule bars.

**UX enhancements cho board:**

- **Today marker**: vertical line đánh dấu tuần hiện tại để biết đang ở đâu so với plan.
- **Bar color theo level1 group** (nhất quán với color chip trong table); cùng task chia nhiều tuần dùng cùng màu, segment liền mạch về thị giác.
- **Hover tooltip trên bar**: task title, role estimates, duration, week date range, % của tuần task chiếm.
- **Overflow/capacity hint**: nếu một tuần bị fill gần/đủ 50 units, hiện indicator nhẹ (vd thanh capacity dưới week header) để user thấy mật độ.
- **Live regenerate feedback**: khi data đổi, board re-render mượt; nếu tính nặng thì show subtle "updating…" thay vì freeze.
- **Zoom/density toggle**: compact vs comfortable week-cell width để xem nhiều tháng hơn hoặc rõ hơn.
- **Empty state**: khi chưa có task enabled, board hiện hướng dẫn ngắn thay vì bảng trống.

Ví dụ:

```txt
| Code | Level 1 | Level 2 | BE | FE | QC | Duration | 2026/06 W1 | W2 | W3 | W4 | 2026/07 W1 |
| 2.02 | Consumer | Auth | 1.5 | 0.5 | 0.6 | 1.5 |    bar    |    |    |    |           |
```

### 12.5. Schedule bar

Mỗi week cell nên render bar theo tỷ lệ số ngày trong tuần.

Ví dụ task chiếm 2 ngày cuối của tuần:

```txt
Week cell:
[      ======]
```

Công thức:

```ts
const leftPercent = (segment.offsetUnits / weekCapacity) * 100;
const widthPercent = (segment.durationUnits / weekCapacity) * 100;
```

CSS gợi ý:

```css
.week-cell {
  position: relative;
  width: 72px;
  height: 28px;
}

.schedule-bar {
  position: absolute;
  top: 4px;
  height: 20px;
  border-radius: 4px;
}
```

---

### 12.6. UX / interaction principles (max usability)

Mục tiêu: user đang dùng Google Sheets chuyển qua app phải thấy **nhanh hơn và ít thao tác hơn**, không phải học lại.

1. **Sheets-first muscle memory**: paste/copy TSV, keyboard grid nav, fill-down, drag reorder phải hoạt động như Sheets. Đây là yếu tố quyết định adoption.
2. **Zero-setup start**: mở app là dùng được — empty state có CTA "Paste from Sheets" và "Load sample data".
3. **Live by default**: mọi thay đổi task/estimate/order/config → schedule tự regenerate, không cần nút "Generate". Có thể có nút manual refresh dự phòng.
4. **Undo/redo toàn cục**: an toàn khi thử nghiệm; mọi mutation (edit, delete, reorder, import, clear) đều undo được.
5. **Một màn hình, không wizard**: Config / Table / Board cùng trang (Board có thể collapse), thấy thay đổi tác động ngay.
6. **Non-blocking validation**: lỗi nhẹ = warning inline, không chặn flow; chỉ block khi data thực sự không generate được.
7. **Autosave + safety**: debounce autosave (15.3), có indicator "Saved", confirm cho thao tác phá hủy, export JSON dễ thấy để backup.
8. **Consistency màu**: 1 level1 group = 1 màu xuyên suốt table chip + schedule bar.
9. **Performance êm**: thay đổi không gây giật; memoize schedule (mục 17).

---

## 13. Responsive requirements

Ứng dụng cần support từ mobile width `360px` trở lên.

### 13.1. Desktop

- Hiển thị đầy đủ table và schedule board.
- Header sticky.
- Left columns sticky.
- Timeline scroll ngang.
- Có thể hiển thị nhiều tháng cùng lúc.

### 13.2. Tablet

- Cho phép horizontal scroll.
- Giữ table không bị vỡ layout.
- Các action chính vẫn dễ bấm.

### 13.3. Mobile

- Support từ `360px` trở lên.
- Không được vỡ UI.
- Với schedule dạng table, cho phép page-level hoặc component-level horizontal overflow.
- Nếu khó responsive hoàn toàn, được phép dùng horizontal scroll.
- Left panel có thể collapse.
- Toolbar/action button nên wrap hoặc chuyển thành menu.
- Text dài cần được xử lý bằng ellipsis.
- Task Table và Schedule board: dùng horizontal scroll, không vỡ layout (không cần card view riêng cho mobile trong MVP — edit/nhập liệu nặng vẫn ưu tiên desktop).
- Schedule board: giữ left columns gọn (Code + Level 2 + Duration), phần còn lại h-scroll.

---

## 14. Text/layout requirements

Ứng dụng cần xử lý tốt các loại text dài/ngắn khác nhau:

- Tên task dài không được làm vỡ layout.
- Column có width giới hạn cần dùng ellipsis.
- Cần support text tiếng Việt, tiếng Anh, và có thể có Japanese character nếu app đa ngôn ngữ.
- Tooltip hoặc expanded view nên hiển thị full text khi bị truncate.

CSS gợi ý:

```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 15. localStorage requirements

### 15.1. Nguyên tắc lưu trữ

Chỉ lưu source data, không lưu generated schedule.

Cần lưu:

- Project config.
- Roles.
- Tasks.
- UI setting quan trọng nếu cần.

Không cần lưu:

- Schedule segments.
- Rendered table.
- DOM state.
- Dữ liệu duplicate có thể generate lại.
- **Undo/redo history**: giữ in-memory thôi (vd giới hạn ~50 snapshot), không persist vào `localStorage` để tránh phình bộ nhớ. Reload là reset history, data vẫn còn.

### 15.2. localStorage keys

```ts
schedule-app:project-list
schedule-app:project:{projectId}
```

### 15.3. Auto-save

Cần debounce khi ghi vào `localStorage`.

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(projectData));
  }, 500);

  return () => clearTimeout(timer);
}, [projectData]);
```

### 15.4. Backup

Cần có chức năng:

- Export project thành JSON.
- Import project từ JSON.
- Duplicate project.
- Clear project.

---

## 16. Validation requirements

Ứng dụng cần validate:

- Required fields: `level1`, `level2` hoặc `title`.
- Estimate phải là số hợp lệ.
- Estimate không được âm.
- Schedule order nên là số.
- Duplicate code cần warning.
- Duplicate schedule order cần warning.
- Task không có estimate cần warning.
- Task duration bằng 0 thì không render vào schedule.

---

## 17. Performance requirements

Dữ liệu dự kiến không quá lớn, nhưng vẫn cần tối ưu cơ bản:

- Không lưu generated schedule vào `localStorage`.
- Debounce auto-save.
- Memoize generated schedule khi tasks/config không đổi.
- Tránh render lại toàn bộ table không cần thiết.
- Với table lớn hơn 300 rows, cân nhắc virtualized table.

MVP có thể chưa cần virtualization nếu số lượng task nhỏ.

---

## 18. Accessibility requirements

Ứng dụng nên đáp ứng các yêu cầu cơ bản:

- Button có label rõ ràng.
- Input có label.
- Table có header rõ ràng.
- Có thể thao tác bằng keyboard ở mức cơ bản.
- Màu schedule bar không nên là thông tin duy nhất; nên có tooltip/title.
- Contrast đủ dễ đọc.

---

## 19. Suggested tech stack

Có thể dùng một trong các stack sau:

### Option A: React SPA

```txt
Vite
React
TypeScript
Tailwind CSS
Zustand hoặc Jotai
localStorage
```

### Option B: Next.js static app

```txt
Next.js
TypeScript
Tailwind CSS
localStorage
```

Vì app không cần backend, React + Vite là lựa chọn gọn nhất cho MVP.

---

## 20. Suggested folder structure

```txt
src/
  app/
    App.tsx
  components/
    ProjectConfig/
    TaskTable/
    ImportSheet/
    ScheduleBoard/
    RoleSettings/
  domain/
    schedule/
      generateSchedule.ts
      duration.ts
      calendar.ts
    import/
      parseTsv.ts
      mapColumns.ts
      validateImport.ts
  storage/
    projectStorage.ts
  types/
    project.ts
    task.ts
    schedule.ts
  utils/
    number.ts
    date.ts
```

---

## 21. Acceptance criteria

### 21.1. Import từ Google Sheets

- User có thể copy dữ liệu từ Google Sheets và paste vào app.
- App parse được dữ liệu TSV.
- App hiển thị preview trước khi import.
- App tự fill-down group cell bị trống.
- App map được các column phổ biến như Level 1, Level 2, Backend, Frontend, QC, BrS.

### 21.2. Tính duration

- Với mỗi task, app tính duration bằng max estimate của các role.
- Nếu tất cả estimate bằng 0, task không được render vào schedule.
- Nếu estimate thay đổi, duration update ngay.

### 21.3. Generate schedule

- Task được schedule theo `scheduleOrder`.
- Một tuần mặc định có 5 ngày làm việc.
- Task có thể được chia qua nhiều tuần.
- Nếu tuần hiện tại chỉ còn `<= 0.5 day`, app skip sang tuần tiếp theo.
- Schedule được generate lại khi task/order/config thay đổi.

### 21.4. Schedule board

- Board hiển thị được month header và week header.
- Mỗi task hiển thị bar trên timeline.
- Bar thể hiện đúng tỷ lệ duration trong week cell.
- Board có thể scroll ngang.
- Không bị vỡ UI ở mobile từ 360px trở lên.

### 21.5. Storage

- Project được lưu vào `localStorage`.
- Reload browser vẫn giữ được dữ liệu.
- User có thể export/import JSON.
- App không lưu generated schedule vào `localStorage`.

### 21.6. UX / usability

- Paste TSV thẳng vào table grid fill đúng multi-cell, tự tạo row khi tràn.
- Copy table và schedule ra clipboard dạng TSV, paste lại Sheets đúng cấu trúc.
- Keyboard grid nav (arrow/Enter/Tab), fill-down, undo/redo hoạt động.
- Drag/drop reorder đổi `scheduleOrder` và schedule regenerate ngay.
- Empty state có CTA paste/sample; "Load sample data" tạo project demo dùng được.
- Schedule board có today marker, week date range, group color, hover tooltip.
- Thao tác phá hủy (clear/delete/import replace) có confirm và undo được.

---

## 22. Future enhancements

Sau MVP, có thể mở rộng:

- Support task dependency.
- Support holiday/non-working days.
- Support custom working days per week theo từng giai đoạn.
- Support resource capacity theo từng role.
- Support schedule theo từng role riêng biệt.
- Support drag bar trực tiếp trên timeline.
- Two-way linking: click schedule bar ↔ highlight đúng row trong Task Table và ngược lại.
- Card view riêng cho mobile (edit qua bottom sheet).
- Export PNG.
- Export Excel.
- Import trực tiếp từ Google Sheets link.
- Cloud sync.
- Multi project dashboard.
- Version history.

---

## 23. Nguyên tắc thiết kế quan trọng

Source of truth phải là task data, không phải schedule đã render.

```txt
Task data + Project config => Generated schedule => UI render
```

Khi task, estimate, order hoặc config thay đổi, schedule cần được generate lại từ đầu.

Không nên lưu kết quả tô màu thủ công. Nếu lưu schedule đã render, app sẽ dễ bị lệch data và khó bảo trì.

---

## 24. Kết luận

Ứng dụng cần được xây dựng như một **local-first WBS Schedule Generator**.

Flow chính:

```txt
Google Sheets paste input
=> parse thành task data
=> estimate theo role
=> duration = max role estimates
=> sort theo schedule order
=> chia vào week capacity 5 days
=> skip nếu tuần còn <= 0.5 day
=> render weekly schedule board
=> lưu project vào localStorage
```

MVP nên tập trung vào việc giúp user thay thế thao tác tô màu thủ công trong Google Sheets bằng một schedule board được generate tự động, dễ chỉnh sửa, dễ import data và đủ nhẹ để chạy hoàn toàn trên browser.
