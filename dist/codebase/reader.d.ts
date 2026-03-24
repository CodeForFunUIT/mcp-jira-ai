import { StackProfile } from "../stack-profiles/index.js";
interface FileResult {
    relativePath: string;
    absolutePath: string;
    content: string;
    language: string;
    sizeKb: number;
}
interface SearchMatch {
    lineNumber: number;
    line: string;
    context: string;
}
interface SearchResult {
    relativePath: string;
    absolutePath: string;
    matches: SearchMatch[];
}
interface ModuleReadResult {
    files: (FileResult & {
        relativePath: string;
    })[];
    totalSizeKb: number;
}
export declare class CodebaseReader {
    private profile;
    constructor(profile?: StackProfile);
    /** Thay đổi profile runtime (VD: sau auto-detect) */
    setProfile(profile: StackProfile): void;
    /** Lấy profile hiện tại */
    getProfile(): StackProfile;
    findByName(name: string, projectRoot: string, includeContent: boolean): Promise<(FileResult & {
        relativePath: string;
    })[]>;
    searchKeyword(keyword: string, projectRoot: string, extensions: string[], maxResults: number, showContext: boolean): Promise<SearchResult[]>;
    readModule(modulePath: string, options: {
        includeHtml: boolean;
        includeScss: boolean;
        maxFileSizeKb: number;
    }): Promise<ModuleReadResult>;
    getMonorepoStructure(projectRoot: string, appsFolder: string, libsFolder: string): Promise<string>;
    /**
     * Lấy language name từ file extension, dùng profile langMap
     */
    private getLang;
    /**
     * Merge ignore patterns: base (luôn ignore) + profile-specific
     */
    private getIgnorePatterns;
    /**
     * Walk directory đệ quy, bỏ qua các folder không cần thiết
     */
    private walkDirectory;
    /**
     * Đọc file an toàn — trả về null nếu có lỗi
     * (không throw để không crash cả tool)
     */
    private readFileSafe;
}
export {};
//# sourceMappingURL=reader.d.ts.map