import { DynamicStructuredTool } from "langchain/tools"
import z from "zod";
import { skillsRepository } from "../repository/skills";

export default (actions: Array<{ [key: string]: any }>): DynamicStructuredTool => {
    return new DynamicStructuredTool({
        name: "get_details_skill",
        description: "Get extra or more details from Skill. Ps: execute only when user ask for more details",
        schema: z.object({
            id: z.string().describe("The skill id to get details"),
        }),
        func: async ({ id }: { id: string }) => {
            let skill;
            try {
                skill = await skillsRepository.getSkillByName(id)
                actions.push({
                    type: "get_details_skill",
                    status: "success",
                    message: skill?.content,
                });
            } catch (error: any) {
                console.log("error", error)
                actions.push({
                    type: "get_details_skill",
                    status: "error",
                    message: error.message,
                });
            }

            return "";
        },
    });
}