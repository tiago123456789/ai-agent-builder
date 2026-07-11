import { config } from "dotenv"
config()

import { SupabaseQueueDriver, Consumer } from "consumer-pgmq"
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { aiAgentService } from "./services/ai-agent.service";


process.env.SUPABASE_URL = "https://hawoizrqqoyfdxewkyii.supabase.co"
process.env.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhd29penJxcW95ZmR4ZXdreWlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM4MjM1NCwiZXhwIjoyMDk1OTU4MzU0fQ.nhKSwQzJOTC8_UPcIjfN0AZQgeEKxyGVvowkbLHkyLc"

const supabase = createClient(
    // @ts-ignore
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        db: {
            schema: 'pgmq_public'
        }
    }
);

const supabaseQueueDriver = new SupabaseQueueDriver(
    supabase as unknown as SupabaseClient
)

async function start() {
    let messages = []

    // `
    //         Steps to execute:
    //         - First step => Extract the info about the company and products https://www.firecrawl.dev/ .
    //         - Second step => Get the data  from first step and send POST HTTP request to the url https://brave-pegasus-87.webhook.cool.

    //         RULES:
    //         - No ask for confirmation only execute the instructions
    //     ` 

    // - Execute query to list 10 registers from table users
    //         - Convert the result to JSON format
    //         - Create a Deno script to process the get the json and send POST request to webhook https://brave-pegasus-87.webhook.cool

    for (let i = 0; i < 100; i++) {
        messages.push({
            timestamp: Date.now(),
            message: `Index: ${i}`
        })
    }
    await supabaseQueueDriver.sendBatch(
        "schedulers_to_process_dev", messages
    )
    console.log("Total messages sent: ", messages.length)


    // const consumer = new Consumer(
    //     {
    //         queueName: 'schedulers_to_process_dev',
    //         visibilityTime: 120,
    //         consumeType: "read",
    //         poolSize: 1,
    //         timeMsWaitBeforeNextPolling: 1 * 1000,
    //         enabledPolling: true,
    //         queueNameDlq: "schedulers_to_process_dev_dlq",
    //         totalRetriesBeforeSendToDlq: 2
    //     },
    //     async function (message: { [key: string]: any }, signal): Promise<void> {
    //         // try {
    //         console.time("consumer")
    //         console.log(message)
    //         const response = await aiAgentService.execute({
    //             agentSlug: 'agente-test-mcp',
    //             input: message.message,
    //             history: [],
    //         })
    //         console.log(response)
    //         console.timeEnd("consumer")

    //         // } catch (error: any) {
    //         //     if (error.name === "AbortError") {
    //         //         console.log("Operation aborted");
    //         //     } else {
    //         //         console.error("Error:", error);
    //         //     }
    //         // }
    //     },
    //     supabaseQueueDriver
    // );

    // // consumer.on('finish', (message: { [key: string]: any }) => {
    // //     console.log('Consumed message =>', message);
    // // });

    // consumer.on("abort-error", (err) => {
    //     console.log("Abort error =>", err)
    // })

    // consumer.on('error', (err: Error) => {
    //     if (err.message.includes("TypeError: fetch failed")) {
    //         console.log(err)
    //         process.exit(1);
    //     }
    //     console.error('Error consuming message:', err.message);
    // });

    // consumer.start();

}

start()
