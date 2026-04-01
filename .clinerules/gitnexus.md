---
description: 🔍 GitNexus Code Intelligence — Index, explore, và analyze codebase qua knowledge graph
---

# /gitnexus Workflow

> GitNexus cung cấp code intelligence qua knowledge graph. Index codebase → query qua MCP tools.

## Sub-commands

### `/gitnexus init` — Index project hiện tại

// turbo
1. Kiểm tra Node.js >= 18:
```bash
node --version
```

2. Index project:
```bash
npx -y gitnexus@latest analyze
```

3. Verify index:
```bash
npx gitnexus status
```

4. (Optional) Generate embeddings cho semantic search tốt hơn:
```bash
npx gitnexus analyze --embeddings
```

---

### `/gitnexus status` — Kiểm tra index

// turbo
1. Xem trạng thái index:
```bash
npx gitnexus status
```

2. Nếu stale → suggest re-index:
```bash
npx gitnexus analyze
```

---

### `/gitnexus impact <symbol>` — Quick impact analysis

1. Chạy impact analysis:
```
gitnexus_impact({target: "<symbol>", direction: "upstream"})
```

2. Đọc processes bị ảnh hưởng:
```
READ gitnexus://repo/{name}/processes
```

3. Report risk level cho user:
   - d=1 → WILL BREAK (PHẢI update)
   - d=2 → LIKELY AFFECTED (nên test)
   - d=3 → MAY NEED TESTING

---

### `/gitnexus explore` — Architecture overview

1. Đọc context overview:
```
READ gitnexus://repo/{name}/context
```

2. Xem functional areas:
```
READ gitnexus://repo/{name}/clusters
```

3. Liệt kê execution flows:
```
READ gitnexus://repo/{name}/processes
```

4. Present tổng quan cho user:
   - Số symbols, relationships
   - Functional clusters
   - Key execution flows

---

### `/gitnexus list` — Liệt kê repos đã index

// turbo
1. Liệt kê tất cả repos:
```bash
npx gitnexus list
```

---

### `/gitnexus clean` — Xóa index

1. Xóa index project hiện tại:
```bash
npx gitnexus clean
```

2. Xóa tất cả indexes (cẩn thận!):
```bash
npx gitnexus clean --all --force
```

---

## Notes

- GitNexus lưu index trong `.gitnexus/` (đã gitignored)
- Registry toàn cục ở `~/.gitnexus/registry.json`
- Hỗ trợ 13 ngôn ngữ: TypeScript, JavaScript, Python, Java, Kotlin, C#, Go, Rust, PHP, Ruby, Swift, C, C++
- MCP server serve TẤT CẢ repos đã index (không cần config per-project)
