import { DynamicStructuredTool } from "langchain/tools"
import { agentsRepository } from "../repository/agents"
import searchInternet from "./search-internet"
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import Encrypter from "../lib/encrypter";
import getDetailsSkill from "./get-details-skill";

const nativeTools: { [key: string]: Function } = {
    "searchInternet": searchInternet,
    "getDetailsSkill": getDetailsSkill
}


export async function getToolsAvailable(
    id: string, actions: Array<{ [key: string]: any }>
): Promise<Array<DynamicStructuredTool>> {
    const tools = await agentsRepository.getToolsByAgentId(id as string)
    let toolsAvailable: Array<DynamicStructuredTool> = []

    for (let index = 0; index < tools.length; index += 1) {
        const tool = tools[index]
        if (tool.is_native) {
            toolsAvailable.push(
                nativeTools[tool.package.replace("./", "")](actions)
            )
        } else {
            const toolInstance = await import(`${tool.package}`)
            if (Array.isArray(toolInstance.default(actions))) {
                toolsAvailable = toolsAvailable.concat(
                    toolInstance.default(actions)
                )
            } else {
                toolsAvailable.push(
                    toolInstance.default(actions)
                )
            }

        }
    }


    const mcps: Array<{ [key: string]: any }> = await agentsRepository.getMcpToolsByAgentId(id)
    for (let index = 0; index < mcps.length; index += 1) {
        const item: { [key: string]: any } = mcps[index]

        if (item.type === "stdio") {
            const envObject: Record<string, string> = {};
            if (item.envs) {
                item.envs = new Encrypter().decrypt(item.envs)
                item.envs.split("\n").forEach((line: string) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    const eqIndex = trimmed.indexOf("=");
                    if (eqIndex > 0) {
                        const key = trimmed.slice(0, eqIndex).trim();
                        const value = trimmed.slice(eqIndex + 1).trim();
                        if (key) envObject[key] = value;
                    }
                });
            }

            const client = new MultiServerMCPClient({
                stdioServer: {
                    transport: "stdio",
                    command: item.command,
                    args: item.args ? item.args.split(" ") : [],
                    env: envObject,
                },
            });

            try {
                const mcpTools = await client.getTools();
                toolsAvailable = toolsAvailable.concat(mcpTools)
            } catch(error) {
                console.log(error)
            }
        } else {
            item.headers = JSON.parse(new Encrypter().decrypt(item.headers))
            const client = new MultiServerMCPClient({
                secureHttpServer: {
                    transport: "http",
                    // @ts-ignore
                    url: item.url,
                    // @ts-ignore
                    headers: item.headers || {}
                },
            });

            const mcpTools = await client.getTools();
            toolsAvailable = toolsAvailable.concat(mcpTools)
        }
    }


    toolsAvailable.push(nativeTools.getDetailsSkill(actions))
    return toolsAvailable
}
