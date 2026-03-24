import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare const SECURITY_DOMAINS: Record<string, {
    keywords: string[];
    level: "critical" | "high" | "medium";
    description: string;
}>;
export declare function registerSecurityTools(server: McpServer): void;
//# sourceMappingURL=tools.d.ts.map