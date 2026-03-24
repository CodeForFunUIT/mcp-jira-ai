import fs from "fs/promises";
import path from "path";
import { ANGULAR_PROFILE } from "../stack-profiles/index.js";
// ─────────────────────────────────────────────
export class SmartScorer {
    feedbackBoostMap;
    feedbackStoreLoaded = false;
    profile;
    constructor(profile) {
        this.feedbackBoostMap = new Map();
        this.profile = profile ?? ANGULAR_PROFILE;
    }
    /** Thay đổi profile runtime */
    setProfile(profile) {
        this.profile = profile;
    }
    // Load feedback history để tính signal #3
    async loadFeedbackHistory() {
        if (this.feedbackStoreLoaded)
            return;
        const candidates = [
            process.env.FEEDBACK_STORE_PATH,
            path.join(process.cwd(), "feedback-store.json"),
            path.join(process.cwd(), "..", "feedback-store.json"),
        ].filter(Boolean);
        for (const p of candidates) {
            try {
                const raw = await fs.readFile(p, "utf-8");
                const store = JSON.parse(raw);
                // Tính điểm boost/penalty cho mỗi file pattern
                for (const feedback of (store.feedbacks ?? [])) {
                    // Useful files → boost +15
                    for (const file of (feedback.usefulContextFiles ?? [])) {
                        const pattern = extractFilePattern(file);
                        this.feedbackBoostMap.set(pattern, (this.feedbackBoostMap.get(pattern) ?? 0) + 15);
                    }
                    // Noise files → penalty -10
                    for (const file of (feedback.noiseContextFiles ?? [])) {
                        const pattern = extractFilePattern(file);
                        this.feedbackBoostMap.set(pattern, (this.feedbackBoostMap.get(pattern) ?? 0) - 10);
                    }
                }
                this.feedbackStoreLoaded = true;
                break;
            }
            catch { /* store chưa tồn tại */ }
        }
    }
    // ── Main scoring function ──────────────────
    async scoreFiles(files, matchedKeywords, // relativePath → keywords matched
    taskText) {
        await this.loadFeedbackHistory();
        const taskLower = taskText.toLowerCase();
        const now = Date.now();
        const scored = [];
        for (const file of files) {
            const keywords = matchedKeywords.get(file.relativePath) ?? [];
            const breakdown = {
                keywordFrequency: 0,
                fileTypePriority: 0,
                feedbackBoost: 0,
                recency: 0,
                frameworkPattern: 0,
            };
            const signals = [];
            // ── Signal 1: Keyword frequency (max 30) ──
            const keywordScore = Math.min(keywords.length * 8, 30);
            breakdown.keywordFrequency = keywordScore;
            if (keywords.length > 0) {
                signals.push(`Matches ${keywords.length} keyword(s): ${keywords.slice(0, 3).join(", ")}`);
            }
            // ── Signal 2: File type priority (max 25) ──
            const fileTypeSuffix = getFileSuffix(file.relativePath, this.profile);
            const typeScore = this.profile.fileTypeScores[fileTypeSuffix] ?? 5;
            breakdown.fileTypePriority = typeScore;
            if (typeScore >= 18) {
                signals.push(`High-priority file type: ${fileTypeSuffix}`);
            }
            // ── Signal 3: Feedback history (max 25, min -20) ──
            const pattern = extractFilePattern(file.relativePath);
            const feedbackScore = Math.max(Math.min(this.feedbackBoostMap.get(pattern) ?? 0, 25), -20);
            breakdown.feedbackBoost = feedbackScore;
            if (feedbackScore > 0)
                signals.push(`Previously marked useful (${feedbackScore > 10 ? "often" : "once"})`);
            if (feedbackScore < 0)
                signals.push(`⚠️ Previously marked as noise`);
            // ── Signal 4: Recency (max 10) ──
            let recencyScore = 0;
            try {
                const stat = await fs.stat(file.absolutePath);
                const daysSinceModified = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
                recencyScore =
                    daysSinceModified < 1 ? 10 :
                        daysSinceModified < 7 ? 8 :
                            daysSinceModified < 30 ? 5 :
                                daysSinceModified < 90 ? 2 : 0;
                if (recencyScore >= 8) {
                    signals.push(`Recently modified (${Math.round(daysSinceModified)}d ago)`);
                }
            }
            catch { /* stat failed */ }
            breakdown.recency = recencyScore;
            // ── Signal 5: Framework pattern match (max 10) ──
            let patternScore = 0;
            for (const taskPattern of this.profile.taskPatterns) {
                const taskMatchesPattern = taskPattern.taskKeywords.some((kw) => taskLower.includes(kw));
                if (!taskMatchesPattern)
                    continue;
                const fileMatchesBoost = taskPattern.boostFilePatterns.some((bp) => file.relativePath.toLowerCase().includes(bp.toLowerCase()));
                if (fileMatchesBoost) {
                    patternScore = Math.max(patternScore, taskPattern.score);
                    signals.push(`Matches ${this.profile.displayName} pattern for task type`);
                    break;
                }
            }
            breakdown.frameworkPattern = patternScore;
            const totalScore = breakdown.keywordFrequency +
                breakdown.fileTypePriority +
                breakdown.feedbackBoost +
                breakdown.recency +
                breakdown.frameworkPattern;
            scored.push({
                ...file,
                totalScore,
                scoreBreakdown: breakdown,
                signals,
            });
        }
        // Sort by total score DESC
        return scored.sort((a, b) => b.totalScore - a.totalScore);
    }
}
// ── Helpers ────────────────────────────────────
/**
 * Lấy file suffix dựa trên profile's fileTypeScores
 * VD: "user-profile.component.ts" → ".component.ts"
 *     "UserController.java" → "Controller.java"
 */
function getFileSuffix(filePath, profile) {
    const name = path.basename(filePath);
    // Thử match với các key trong fileTypeScores (ưu tiên match dài nhất)
    const scoreKeys = Object.keys(profile.fileTypeScores)
        .sort((a, b) => b.length - a.length); // Sort dài nhất trước
    for (const key of scoreKeys) {
        if (name.endsWith(key)) {
            return key;
        }
    }
    // Fallback: thử double extension (VD: .component.ts)
    const doubleExt = name.match(/(\.[a-z-]+\.[a-z]+)$/)?.[1];
    if (doubleExt && profile.fileTypeScores[doubleExt] !== undefined) {
        return doubleExt;
    }
    // Fallback về single extension
    return path.extname(name);
}
/**
 * Trích xuất pattern từ đường dẫn để lookup feedback history
 * Dùng basename để match (vì cùng pattern có thể ở nhiều chỗ)
 */
function extractFilePattern(filePath) {
    return path.basename(filePath);
}
//# sourceMappingURL=scorer.js.map