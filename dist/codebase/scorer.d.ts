import { StackProfile } from "../stack-profiles/index.js";
export interface ScoredFile {
    relativePath: string;
    absolutePath: string;
    content: string;
    language: string;
    sizeKb: number;
    totalScore: number;
    scoreBreakdown: {
        keywordFrequency: number;
        fileTypePriority: number;
        feedbackBoost: number;
        recency: number;
        frameworkPattern: number;
    };
    signals: string[];
}
export declare class SmartScorer {
    private feedbackBoostMap;
    private feedbackStoreLoaded;
    private profile;
    constructor(profile?: StackProfile);
    /** Thay đổi profile runtime */
    setProfile(profile: StackProfile): void;
    loadFeedbackHistory(): Promise<void>;
    scoreFiles(files: Array<{
        relativePath: string;
        absolutePath: string;
        content: string;
        language: string;
        sizeKb: number;
    }>, matchedKeywords: Map<string, string[]>, // relativePath → keywords matched
    taskText: string): Promise<ScoredFile[]>;
}
//# sourceMappingURL=scorer.d.ts.map