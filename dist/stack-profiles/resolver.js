import fs from "fs/promises";
import path from "path";
import { GENERIC_PROFILE, getProfile, } from "./profiles.js";
const DETECTION_RULES = [
    {
        stackName: "angular",
        markerFiles: ["angular.json", ".angular.json"],
    },
    {
        stackName: "flutter",
        markerFiles: ["pubspec.yaml", "pubspec.yml"],
    },
    {
        stackName: "nestjs",
        markerFiles: ["nest-cli.json"],
        packageJsonDeps: ["@nestjs/core"],
    },
    {
        stackName: "spring",
        markerFiles: ["pom.xml", "build.gradle", "build.gradle.kts"],
    },
    {
        stackName: "react",
        markerFiles: ["next.config.js", "next.config.ts", "next.config.mjs"],
        packageJsonDeps: ["react", "next"],
    },
];
/**
 * Resolve StackProfile từ user input hoặc auto-detect.
 *
 * - Nếu stackName là một tên cụ thể (angular, spring...) → trả về profile tương ứng
 * - Nếu stackName là "auto" hoặc undefined → auto-detect từ projectRoot
 * - Nếu không detect được → trả về GENERIC_PROFILE
 *
 * @param stackName - "auto" | "angular" | "spring" | "nestjs" | "flutter" | "react" | "generic"
 * @param projectRoot - Đường dẫn tuyệt đối đến project root (dùng cho auto-detect)
 */
export async function resolveStackProfile(stackName, projectRoot) {
    // Case 1: User chỉ định rõ stack
    if (stackName && stackName !== "auto") {
        return getProfile(stackName);
    }
    // Case 2: Auto-detect từ project root
    if (projectRoot) {
        return await detectStack(projectRoot);
    }
    // Case 3: Không có thông tin → generic
    return GENERIC_PROFILE;
}
/**
 * Auto-detect framework từ các marker files trong project root.
 */
async function detectStack(projectRoot) {
    for (const rule of DETECTION_RULES) {
        // Kiểm tra marker files
        for (const marker of rule.markerFiles) {
            const markerPath = path.join(projectRoot, marker);
            if (await fileExists(markerPath)) {
                return getProfile(rule.stackName);
            }
        }
        // Kiểm tra package.json dependencies
        if (rule.packageJsonDeps && rule.packageJsonDeps.length > 0) {
            const packageJsonPath = path.join(projectRoot, "package.json");
            if (await fileExists(packageJsonPath)) {
                try {
                    const raw = await fs.readFile(packageJsonPath, "utf-8");
                    const pkg = JSON.parse(raw);
                    const allDeps = {
                        ...(pkg.dependencies ?? {}),
                        ...(pkg.devDependencies ?? {}),
                    };
                    const hasMatchingDep = rule.packageJsonDeps.some((dep) => dep in allDeps);
                    if (hasMatchingDep) {
                        return getProfile(rule.stackName);
                    }
                }
                catch {
                    // package.json parse failed → bỏ qua
                }
            }
        }
    }
    // Không match rule nào → generic
    return GENERIC_PROFILE;
}
/**
 * Kiểm tra file tồn tại (không throw)
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=resolver.js.map