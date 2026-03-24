# VNPT Dev Agent — MCP Server

AI Dev Agent tích hợp Jira cho lập trình viên VNPT AI.

## 🚀 Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env
cp .env.example .env
# → Mở .env và điền JIRA_PAT của bạn

# 3. Build TypeScript
npm run build
```

## 🔑 Lấy Jira Personal Access Token

1. Đăng nhập vào `https://one-ai.vnpt.vn`
2. Click vào **avatar** góc trên phải → **Profile**
3. Vào tab **Personal Access Tokens**
4. Click **Create Token** → đặt tên → **Create**
5. Copy token và dán vào `.env`

> ⚠️ Token chỉ hiển thị 1 lần, hãy copy ngay!

## ⚙️ Tích hợp Claude Desktop

Thêm vào file config của Claude Desktop:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vnpt-dev-agent": {
      "command": "node",
      "args": ["/ĐƯỜNG_DẪN_TUYỆT_ĐỐI/vnpt-dev-agent/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://one-ai.vnpt.vn",
        "JIRA_PAT": "your_token_here"
      }
    }
  }
}
```

> 💡 Hoặc để trống `env` và dùng file `.env` — cả 2 cách đều hoạt động.

Sau khi lưu config, **restart Claude Desktop**.

## 🧪 Test thử (không cần Claude Desktop)

```bash
# Chạy MCP Inspector để test tools thủ công
npm run inspect
```

## 📋 Danh sách Tools (Phase 1)

| Tool | Mô tả |
|------|-------|
| `list_my_open_issues` | Lấy danh sách task OPEN của bạn |
| `get_issue_detail` | Đọc chi tiết 1 issue |
| `log_work` | Logwork thời gian lên issue |
| `update_issue_status` | Chuyển trạng thái issue |
| `get_available_transitions` | Xem các transition có thể làm |
| `create_issue` | Tạo issue mới (Task/Sub-task/Bug) |

## 💬 Ví dụ câu lệnh trong Claude Desktop

Sau khi tích hợp xong, bạn chat với Claude:

```
"Cho tôi xem danh sách task OPEN của tôi trong project VNPTAI"

"Đọc chi tiết task VNPTAI-123 và phân tích tôi cần làm gì"

"Logwork 2h30m cho task VNPTAI-123, đã implement API endpoint login"

"Chuyển task VNPTAI-123 sang trạng thái In Review"
```

## 🗺️ Roadmap

- **Phase 1** ✅ Jira CRUD + logwork
- **Phase 2** 🔧 Generate code với context codebase
- **Phase 3** 🔀 SCM integration (tạo branch, MR)
- **Phase 4** 📄 Tạo sub-tasks từ file .md
