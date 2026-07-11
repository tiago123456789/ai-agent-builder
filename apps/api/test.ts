import { config } from "dotenv"

config()
import { SemanticCache } from "@upstash/semantic-cache";
import { Index } from "@upstash/vector";
import { OpenAIEmbeddings } from "@langchain/openai";

const index = new Index({
    url: process.env.UPSTASH_CACHE_URL,
    token: process.env.UPSTASH_CACHE_TOKEN
});

// 2. Instantiate the Semantic Cache with a designated namespace
const userCache = new SemanticCache({
    index: index,
    minProximity: 0.85,       // Similarity threshold (0 to 1)
});

async function handleCache() {
    // const vector = embeddings.embedQuery("What is the capital of France?")
    // Save a value to the namespace
    // await userCache.set("agent_20:" + "What is the capital of France?", "Paris");

    // // Give the vector index a moment to process the update
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // Retrieve using a semantically similar query within the same namespace
    const result = await userCache.get("agent_20:" + "Tell me the France's capital");

    // await index.reset({
    //     all: true
    // })

    // console.log(result); // Outputs: "Paris"
}


function start() {
    console.log("Started")
    handleCache()
}

start()