export interface StackProfile {
    /** ID duy nhất — dùng để truyền qua tool param */
    name: string;
    /** Tên hiển thị cho user */
    displayName: string;
    /** Extensions cần scan (VD: [".ts", ".html", ".scss"]) */
    extensions: string[];
    /** Folders cần bỏ qua khi walk directory */
    ignorePatterns: string[];
    /** Điểm ưu tiên theo file type suffix (VD: ".service.ts": 22) */
    fileTypeScores: Record<string, number>;
    /** Task keywords → file patterns cần boost */
    taskPatterns: Array<{
        taskKeywords: string[];
        boostFilePatterns: string[];
        score: number;
    }>;
    /** Extension → language name cho code block formatting */
    langMap: Record<string, string>;
    promptContext: {
        /** VD: "Angular frontend project" | "Spring Boot backend" */
        role: string;
        /** VD: "Angular frontend security" | "Spring Security" */
        securityFocus: string;
        /** VD: "Angular style guide" | "Spring Boot conventions" */
        styleGuide: string;
    };
    projectStructure: {
        /** VD: "src/app" | "src/main/java" | "lib" */
        srcPattern: string;
        /** VD: "apps" | "modules" */
        appsFolderDefault: string;
        /** VD: "libs" | "common" */
        libsFolderDefault: string;
    };
}
export type StackName = "angular" | "spring" | "nestjs" | "flutter" | "react" | "generic" | "auto";
export declare const ANGULAR_PROFILE: StackProfile;
export declare const SPRING_PROFILE: StackProfile;
export declare const NESTJS_PROFILE: StackProfile;
export declare const FLUTTER_PROFILE: StackProfile;
export declare const REACT_PROFILE: StackProfile;
export declare const GENERIC_PROFILE: StackProfile;
export declare const STACK_PROFILES: Record<string, StackProfile>;
/**
 * Lấy profile theo tên. Fallback về generic nếu không tìm thấy.
 */
export declare function getProfile(name: string): StackProfile;
//# sourceMappingURL=profiles.d.ts.map