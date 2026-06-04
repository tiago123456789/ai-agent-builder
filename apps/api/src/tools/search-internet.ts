import { DynamicStructuredTool } from "langchain/tools"
import z from "zod";

export default (actions: Array<{ [key: string]: any }>): DynamicStructuredTool => {
    return new DynamicStructuredTool({
        name: "search_internet",
        description: "Search the internet for a given topic using SerpAPI.",
        schema: z.object({
            topic: z.string().describe("The topic to search for on the internet"),
        }),

        func: async ({ topic }: { topic: string }) => {
            try {
                const apiKey = process.env.SERPAPI_API_KEY;
                if (!apiKey) throw new Error("SERPAPI_API_KEY environment variable not set");

                const response = await fetch(
                    `https://serpapi.com/search?q=${encodeURIComponent(topic)}&api_key=${apiKey}`
                );
                if (!response.ok) throw new Error(`SerpAPI error: ${response.status}`);

                const data: any = await response.json();
                const results = data.organic_results ?? [];

                actions.push({
                    type: "search_internet",
                    status: "success",
                    message: `Found ${results.length} results for "${topic}"`,
                    data: results,
                    howToShow: "table",
                });
            } catch (error: any) {
                actions.push({
                    type: "search_internet",
                    status: "error",
                    message: error.message,
                });
            }

            return "";
        },
    });
}