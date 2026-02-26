---
description: 🔐 Giao thức an toàn & sao lưu dữ liệu
---

# File Protection Rules

## Core Principles

- **_BẮT BUỘC_** tạo backup trước khi xóa bất kỳ file hoặc thư mục nào
- **_BẮT BUỘC_** di chuyển file vào thư mục backup thay vì xóa trực tiếp
- **_BẮT BUỘC_** giữ cấu trúc thư mục khi backup để dễ dàng phục hồi sau này
- **_BẮT BUỘC_** ghi log mỗi khi di chuyển file vào backup
- **_KHUYẾN NGHỊ_** kiểm tra file trước khi xóa để đảm bảo không ảnh hưởng đến chức năng hiện có

## Backup Directory Structure

- Create `_backups` directory in project root (added to .gitignore)
- Inside create structure by date: `_backups/YYYY-MM-DD/`
- In each date directory, maintain original directory structure for easy recovery
- Example: `src/components/Button.js` → `_backups/2024-05-10/src/components/Button.js`

## Backup Process

1. Determine current time to create backup directory if not exists
2. Create necessary directories in backup to maintain structure
3. Move file to backup directory instead of direct deletion
4. Update log file with information: time, original path, reason for deletion
5. Notify user about backup location

## Backup Log File

- Create and maintain `_backups/backup_log.md` file to record activities
- Each entry has format:
  ```
  ## [Date] - [Time]
  - File: `original_path/file_name`
  - Backup: `_backups/YYYY-MM-DD/original_path/file_name`
  - Reason: [Description of reason for deletion/move]
  - Performed by: [Name/ID]
  ```

## Automatic Backup Commands

- Use following command to backup file instead of direct deletion:
  ```bash
  # Instead of: rm file.txt
  mkdir -p _backups/$(date +%Y-%m-%d)/$(dirname "file.txt")
  mv file.txt _backups/$(date +%Y-%m-%d)/file.txt
  echo "## $(date '+%Y-%m-%d - %H:%M:%S')\n- File: \`file.txt\`\n- Backup: \`_backups/$(date +%Y-%m-%d)/file.txt\`\n- Reason: [Reason for deletion]\n- Performed by: [Name]\n\n$(cat _backups/backup_log.md 2>/dev/null || echo '')" > _backups/backup_log.md.tmp
  mv _backups/backup_log.md.tmp _backups/backup_log.md
  ```

## Recovery Rules

- Check `_backups/backup_log.md` to find file to recover
- Use basic command to recover:
  ```bash
  cp _backups/YYYY-MM-DD/original_path/file_name original_path/file_name
  ```
- Log recovery in log file with appropriate information

## Storage Policy

- Keep backups for at least 30 days
- Compress (zip) backup directories older than 7 days to save space
- Delete backups older than 90 days after confirming not needed
- Important backups should be marked in log to avoid automatic deletion

## Process for Large Refactoring

- Before large refactoring, create backup of all related files
- Use special directory `_backups/refactor-YYYY-MM-DD/` for large refactoring
- Add detailed information about refactoring purpose in log

## Integration with Git

- Backup is only supplementary measure, not replacement for version control
- Before recovering from backup, check if can recover from Git
- For uncommitted files, backup is primary protection measure
- Ensure add `_backups/` to `.gitignore` to avoid tracking backup files

## Backup Management Tools

- Consider creating script to:
  - List files in backup
  - Search backup files by name
  - Recover file from backup
  - Clean up old backups
  - Display statistics about backup size and file count

## When Backup Not Needed

- Temporary files that can be regenerated (like build files, cache)
- Log files and unimportant statistics data
- Files that are too large and can be regenerated
- In these cases, still confirm before deletion

## File Safety Checklist

Before any major file operation:

- [ ] Check if file is critical to project functionality
- [ ] Verify file is not referenced by other important files
- [ ] Create backup if file contains important data
- [ ] Log the operation in backup log
- [ ] Notify user about backup location
- [ ] Confirm operation with user if file seems important

## Emergency Recovery

If accidentally deleted important file:

1. Check `_backups/backup_log.md` for recent entries
2. Look for file in most recent backup directory
3. Recover using: `cp _backups/YYYY-MM-DD/path/to/file ./path/to/file`
4. Update log with recovery information
5. Verify file functionality after recovery

## Integration with Development Workflow

- Always backup before major refactoring
- Backup before deleting unused files
- Backup before moving files to different locations
- Backup before changing file extensions or formats
- Backup before merging or splitting files

---

_These rules ensure maximum file safety while maintaining development efficiency._