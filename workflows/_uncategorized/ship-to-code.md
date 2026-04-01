---
description: 🚢 Chuyển đổi mã nguồn từ ngôn ngữ bất kỳ sang ngôn ngữ bất kỳ với cấu trúc hiện đại.
skill: ship-to-code
---

# /ship-to-code — Universal Code Porting Workflow

> **Skill:** `ship-to-code` v1.0 | **Tech:** Agnostic (Any-to-Any)
> **Philosophy:** "Map Dependencies → Bootstrap Architecture → Translate Idiomatically → Parity Check"

---

## ⚡ QUICK START

User cung cấp: Source code hoặc thư mục chứa codebase cũ, và cho biết NGÔN NGỮ NGUỒN + NGÔN NGỮ ĐÍCH.  
Ví dụ:  
- "Dịch folder này từ Java sang Go"
- "/ship-to-code từ Python Django sang Node.js NestJS"
- "Dùng codebase Ruby làm tham chiếu để viết lại bằng Rust"

Workflow dẫn dắt qua pipeline **6 Phases** để đảm bảo quá trình chuyển đổi an toàn, kiến trúc chuẩn xác, và không bị thất thoát business logic.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
porting_session:
  source_lang: "[Nguồn]"
  target_lang: "[Đích]"
  source_dir: "[path_to_source]"
  current_phase: 0
  dependency_matrix: pending
  completed_modules: []
```

### Bước 0.2: Xác nhận input

```
🚢 Universal Code Porting v1.0

Xin chào! Để đảm bảo tính chính xác cho quá trình migrate (vừa không rớt logic, vừa chuẩn idiomatic code), cho phép em hỏi để map cấu trúc:
1. Thư mục chứa code nguồn cũ nằm ở đâu trên máy anh?
2. Ngôn ngữ / Framework gốc là gì?
3. Trọng tâm của framework / kiến trúc đích anh đang hướng đến là gì? (Ví dụ: Go standard layout vs NestJS Clean Architecture)
```

---

## 📋 Pipeline Overview (6 Phases)

| Phase | Name | Focus | Output |
|-------|------|-------|--------|
| 0 | 🔍 Ecosystem Mapping | Quét configuration dependencies của code cũ, đề xuất specs/thư viện thay thế. | Dependency Matrix |
| 1 | 🏗️ Architecture Design | Phân tích app entry points, lifecycle. Thiết kế cấu trúc thư mục mới phù hợp môi trường đích. | Project Scaffold |
| 2 | 💾 Data & Domain | Port Database schemas/Migrations, Models/DTOs, API Clients, Core Repositories. | Stable Data Layer |
| 3 | 🧮 Logic & Utils | Dịch thuật toán, mã hóa crypto, helper functions. **PHẢI có Unit Tests**. | Logic + Test Parity |
| 4 | 🎨 Presentation/Controllers | Dịch Controllers/Routes (Backend) hoặc UI Components (Frontend/Mobile). | Final UX / Routes |
| 5 | ✅ Final Parity | Kiểm tra Branch coverage của edge-cases. Rà soát Data/Params Parity. | Ready to Deploy |

---

## 🔬 EXECUTION RULES

```yaml
never_skip:
  - Phase 0 (Mapping) — Bắt buộc phải ánh xạ thư viện Nguồn → Đích rõ ràng trước khi code.
  - Viết Unit Tests ở Phase 3 cho các utility xử lý chuỗi/mã hóa/thời gian.

never_do:
  - Dịch "word-by-word" (Line-by-line syntax translation). 
    Ví dụ: Không bê nguyên class tĩnh Java sang Go, không xài `try-catch` ép buộc trong Rust, v.v.
  - Tự ý bỏ qua các nhánh (if-else, try-catch) bắt lỗi ngầm trong codebase gốc.

always_do:
  - Report / Xin phép chỉ đạo sau mỗi Phase trước khi qua Phase mới.
  - Viết code **Idiomatic** — áp dụng convention, design patterns và best practices riêng biệt và tự nhiên nhất của NGÔN NGỮ ĐÍCH.
  - Đảm bảo I/O Parity (mọi Response Data, Crypto Hash) trả về phải GIỐNG Y HỆT API/Logic nguồn.
```

---

*ship-to-code workflow v1.0.0 — Any-to-Any Porting Pipeline*
