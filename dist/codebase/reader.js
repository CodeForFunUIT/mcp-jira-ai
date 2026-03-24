import fs from "fs/promises";
import path from "path";
import { ANGULAR_PROFILE } from "../stack-profiles/index.js";
// ── Ignore patterns chung (framework-agnostic) ──
// Luôn ignore những thứ này BẤT KỂ framework nào
const BASE_IGNORE = [
    "node_modules", ".git", "coverage", ".nyc_output",
    "__pycache__", ".cache", "tmp", "temp",
];
export class CodebaseReader {
    profile;
    constructor(profile) {
        this.profile = profile ?? ANGULAR_PROFILE;
    }
    /** Thay đổi profile runtime (VD: sau auto-detect) */
    setProfile(profile) {
        this.profile = profile;
    }
    /** Lấy profile hiện tại */
    getProfile() {
        return this.profile;
    }
    // ── Tìm file theo tên class/component ─────────────────
    async findByName(name, projectRoot, includeContent) {
        // Dùng extensions từ profile thay vì hardcode [".ts", ".html"]
        const searchExtensions = this.profile.extensions;
        const allFiles = await this.walkDirectory(projectRoot, searchExtensions);
        const results = [];
        for (const filePath of allFiles) {
            const content = await this.readFileSafe(filePath);
            if (!content)
                continue;
            // Match theo 3 tiêu chí:
            // 1. Tên file chứa keyword (kebab-case hoặc original)
            const fileName = path.basename(filePath, path.extname(filePath));
            const nameToKebab = toKebabCase(name);
            const fileNameMatch = fileName.toLowerCase().includes(nameToKebab.toLowerCase()) ||
                fileName.toLowerCase().includes(name.toLowerCase());
            // 2. Nội dung file chứa tên class/function chính xác
            const contentMatch = content.includes(name);
            // 3. Class/function/export declaration match
            const declarationMatch = content.includes(`class ${name}`) ||
                content.includes(`export function ${name}`) ||
                content.includes(`export const ${name}`);
            if (fileNameMatch || contentMatch || declarationMatch) {
                const stat = await fs.stat(filePath);
                results.push({
                    relativePath: path.relative(projectRoot, filePath),
                    absolutePath: filePath,
                    content: includeContent ? content : "",
                    language: this.getLang(filePath),
                    sizeKb: Math.round(stat.size / 1024),
                });
            }
        }
        return results;
    }
    // ── Tìm keyword trong nội dung file ───────────────────
    async searchKeyword(keyword, projectRoot, extensions, maxResults, showContext) {
        const allFiles = await this.walkDirectory(projectRoot, extensions);
        const results = [];
        for (const filePath of allFiles) {
            if (results.length >= maxResults)
                break;
            const content = await this.readFileSafe(filePath);
            if (!content || !content.includes(keyword))
                continue;
            const lines = content.split("\n");
            const matches = [];
            lines.forEach((line, idx) => {
                if (!line.includes(keyword))
                    return;
                // Lấy 2 dòng trước và sau để hiểu ngữ cảnh
                const contextLines = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3));
                matches.push({
                    lineNumber: idx + 1,
                    line: line.trim(),
                    context: contextLines
                        .map((l, i) => {
                        const lineNum = Math.max(0, idx - 2) + i + 1;
                        const marker = lineNum === idx + 1 ? "→" : " ";
                        return `  ${marker} ${lineNum}: ${l}`;
                    })
                        .join("\n"),
                });
            });
            if (matches.length > 0) {
                results.push({
                    relativePath: path.relative(projectRoot, filePath),
                    absolutePath: filePath,
                    matches: matches.slice(0, 5), // Tối đa 5 match mỗi file
                });
            }
        }
        return results;
    }
    // ── Đọc toàn bộ module/folder ──────────────────────────
    async readModule(modulePath, options) {
        // Dùng extensions từ profile, filter theo options
        const extensions = this.profile.extensions.filter((ext) => {
            // Luôn include code files (non-template, non-style)
            const isTemplate = [".html", ".xml"].includes(ext);
            const isStyle = [".scss", ".css"].includes(ext);
            if (isTemplate && !options.includeHtml)
                return false;
            if (isStyle && !options.includeScss)
                return false;
            return true;
        });
        const allFiles = await this.walkDirectory(modulePath, extensions);
        const files = [];
        let totalSize = 0;
        for (const filePath of allFiles) {
            const stat = await fs.stat(filePath);
            const sizeKb = Math.round(stat.size / 1024);
            // Bỏ qua file quá lớn (thường là generated file)
            if (sizeKb > options.maxFileSizeKb)
                continue;
            const content = await this.readFileSafe(filePath);
            if (!content)
                continue;
            files.push({
                relativePath: path.relative(modulePath, filePath),
                absolutePath: filePath,
                content,
                language: this.getLang(filePath),
                sizeKb,
            });
            totalSize += sizeKb;
        }
        // Sort theo thứ tự ưu tiên từ profile extensions
        const extOrder = this.profile.extensions;
        files.sort((a, b) => {
            const extA = path.extname(a.absolutePath);
            const extB = path.extname(b.absolutePath);
            return extOrder.indexOf(extA) - extOrder.indexOf(extB);
        });
        return { files, totalSizeKb: totalSize };
    }
    // ── Lấy cấu trúc monorepo (2 levels deep) ─────────────
    async getMonorepoStructure(projectRoot, appsFolder, libsFolder) {
        const lines = [path.basename(projectRoot) + "/"];
        for (const folder of [appsFolder, libsFolder]) {
            const folderPath = path.join(projectRoot, folder);
            try {
                const apps = await fs.readdir(folderPath);
                lines.push(`  ${folder}/`);
                for (const app of apps.slice(0, 20)) { // Tối đa 20 apps
                    const appPath = path.join(folderPath, app);
                    const stat = await fs.stat(appPath);
                    if (!stat.isDirectory())
                        continue;
                    lines.push(`    ${app}/`);
                    // Hiển thị src structure dựa trên profile
                    const srcPath = path.join(appPath, this.profile.projectStructure.srcPattern);
                    try {
                        const srcContents = await fs.readdir(srcPath);
                        for (const item of srcContents.slice(0, 10)) {
                            lines.push(`      ${item}/`);
                        }
                    }
                    catch {
                        // src path không tồn tại → bỏ qua
                    }
                }
            }
            catch {
                // Folder không tồn tại → bỏ qua
            }
        }
        return lines.join("\n");
    }
    // ── Private helpers ────────────────────────────────────
    /**
     * Lấy language name từ file extension, dùng profile langMap
     */
    getLang(filePath) {
        return this.profile.langMap[path.extname(filePath)] ?? "text";
    }
    /**
     * Merge ignore patterns: base (luôn ignore) + profile-specific
     */
    getIgnorePatterns() {
        const profileIgnore = this.profile.ignorePatterns;
        const merged = new Set([...BASE_IGNORE, ...profileIgnore]);
        return Array.from(merged);
    }
    /**
     * Walk directory đệ quy, bỏ qua các folder không cần thiết
     */
    async walkDirectory(dir, extensions) {
        const results = [];
        const ignorePatterns = this.getIgnorePatterns();
        let entries;
        try {
            entries = await fs.readdir(dir);
        }
        catch {
            return []; // Folder không tồn tại hoặc không có quyền đọc
        }
        for (const entry of entries) {
            // Bỏ qua các pattern không cần thiết
            if (ignorePatterns.some((p) => entry === p || entry.startsWith("."))) {
                continue;
            }
            const fullPath = path.join(dir, entry);
            let stat;
            try {
                stat = await fs.stat(fullPath);
            }
            catch {
                continue;
            }
            if (stat.isDirectory()) {
                const subResults = await this.walkDirectory(fullPath, extensions);
                results.push(...subResults);
            }
            else if (extensions.includes(path.extname(entry))) {
                results.push(fullPath);
            }
        }
        return results;
    }
    /**
     * Đọc file an toàn — trả về null nếu có lỗi
     * (không throw để không crash cả tool)
     */
    async readFileSafe(filePath) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            // Bỏ qua file quá lớn (> 200KB) để tránh token limit
            if (content.length > 200_000)
                return null;
            return content;
        }
        catch {
            return null;
        }
    }
}
// ─── Utility ──────────────────────────────────
/**
 * Chuyển PascalCase/camelCase → kebab-case
 * VD: UserProfileComponent → user-profile-component
 * Dùng cho nhiều framework: Angular, React, NestJS...
 */
function toKebabCase(str) {
    return str
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "");
}
//# sourceMappingURL=reader.js.map