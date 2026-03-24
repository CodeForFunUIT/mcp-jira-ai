// ─────────────────────────────────────────────
// formatter.ts
//
// Tại sao cần formatter riêng?
// Jira API trả về JSON rất "thô" và lồng sâu.
// AI (Claude) đọc plain text tốt hơn JSON phức tạp.
// Formatter chuyển dữ liệu thành markdown rõ ràng
// để Claude phân tích chính xác hơn.
// ─────────────────────────────────────────────
/**
 * Format danh sách issues thành bảng markdown
 * Giúp Claude nhanh chóng nắm bắt toàn cảnh task list
 */
export function formatIssueListForAI(issues, total) {
    const lines = [
        `# 📋 Danh sách Issues OPEN (${issues.length}/${total} issues)\n`,
    ];
    for (const issue of issues) {
        const f = issue.fields;
        const priority = priorityEmoji(f.priority?.name);
        const storyPoints = f.customfield_10016 ? ` | ${f.customfield_10016} SP` : "";
        const updated = formatDate(f.updated);
        lines.push(`## ${priority} [${issue.key}] ${f.summary}`, `- **Status:** ${f.status?.name}`, `- **Type:** ${f.issuetype?.name}${storyPoints}`, `- **Cập nhật:** ${updated}`, f.labels?.length ? `- **Labels:** ${f.labels.join(", ")}` : "", "");
    }
    lines.push("---", `💡 *Dùng \`get_issue_detail\` để đọc chi tiết từng task trước khi implement.*`);
    return lines.filter((l) => l !== "").join("\n");
}
/**
 * Format chi tiết 1 issue thành markdown đầy đủ
 * Bao gồm description, comments, subtasks
 */
export function formatIssueForAI(issue) {
    const f = issue.fields;
    const lines = [];
    // Header
    lines.push(`# ${priorityEmoji(f.priority?.name)} [${issue.key}] ${f.summary}`, "");
    // Metadata
    lines.push("## 📌 Thông tin chung", `- **Loại:** ${f.issuetype?.name}`, `- **Trạng thái:** ${f.status?.name}`, `- **Độ ưu tiên:** ${f.priority?.name}`, `- **Assignee:** ${f.assignee?.displayName ?? "Chưa assign"}`, `- **Tạo lúc:** ${formatDate(f.created)}`, `- **Cập nhật:** ${formatDate(f.updated)}`, f.customfield_10016 ? `- **Story Points:** ${f.customfield_10016}` : "", f.labels?.length ? `- **Labels:** ${f.labels.join(", ")}` : "", f.parent ? `- **Parent:** [${f.parent.key}] ${f.parent.fields.summary}` : "", "");
    // Description
    lines.push("## 📝 Mô tả");
    if (f.description) {
        // Jira dùng Jira Markup hoặc ADF — giữ nguyên để AI đọc
        lines.push(cleanJiraMarkup(f.description), "");
    }
    else {
        lines.push("_(Không có mô tả)_", "");
    }
    // Sub-tasks
    if (f.subtasks?.length) {
        lines.push("## 🔀 Sub-tasks");
        for (const sub of f.subtasks) {
            const statusIcon = sub.fields.status.name === "Done" ? "✅" : "⬜";
            lines.push(`- ${statusIcon} [${sub.key}] ${sub.fields.summary}`);
        }
        lines.push("");
    }
    // Comments (chỉ lấy 5 comment gần nhất)
    const comments = f.comment?.comments ?? [];
    if (comments.length > 0) {
        lines.push("## 💬 Comments gần đây");
        const recent = comments.slice(-5);
        for (const c of recent) {
            lines.push(`### ${c.author.displayName} — ${formatDate(c.created)}`, cleanJiraMarkup(c.body), "");
        }
    }
    // Gợi ý cho AI
    lines.push("---", "## 💡 Gợi ý bước tiếp theo", "Bạn muốn tôi:", "1. **Phân tích** và đề xuất hướng implement?", "2. **Generate code** cho task này?", "3. **Tạo sub-tasks** từ task này?", "4. **Chuyển trạng thái** sang 'In Progress'?");
    return lines.filter((l) => l !== null).join("\n");
}
// ─── Helpers ──────────────────────────────────
function priorityEmoji(priority) {
    const map = {
        Highest: "🔴",
        High: "🟠",
        Medium: "🟡",
        Low: "🟢",
        Lowest: "⚪",
    };
    return map[priority ?? ""] ?? "⚫";
}
function formatDate(isoString) {
    if (!isoString)
        return "N/A";
    return new Date(isoString).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
/**
 * Jira Markup → plain text đơn giản
 * Loại bỏ các ký tự markup phức tạp mà AI không cần
 */
function cleanJiraMarkup(text) {
    if (!text)
        return "";
    return text
        .replace(/\{code[^}]*\}([\s\S]*?)\{code\}/g, "\n```\n$1\n```\n")
        .replace(/\{noformat\}([\s\S]*?)\{noformat\}/g, "\n```\n$1\n```\n")
        .replace(/\[([^\]]+)\|([^\]]+)\]/g, "[$1]($2)")
        .replace(/^h([1-6])\.\s/gm, (_, n) => "#".repeat(Number(n)) + " ")
        .replace(/\*([^*]+)\*/g, "**$1**")
        .replace(/_(.*?)_/g, "_$1_")
        .trim();
}
//# sourceMappingURL=formatter.js.map