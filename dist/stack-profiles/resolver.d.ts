import { StackProfile } from "./profiles.js";
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
export declare function resolveStackProfile(stackName?: string, projectRoot?: string): Promise<StackProfile>;
//# sourceMappingURL=resolver.d.ts.map