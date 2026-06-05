import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(token: string, chatId: string, message: string, parseMode?: string) {
  const body: Record<string, string> = {
    chat_id: chatId,
    text: message,
  };
  if (parseMode) body.parse_mode = parseMode;

  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description ?? "Unknown Telegram API error");
  return data.result;
}

export default (actions: Array<{ [key: string]: any }>) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("You need to provide the env TELEGRAM_BOT_TOKEN");
  }

  const tools: DynamicStructuredTool[] = [];

  tools.push(new DynamicStructuredTool({
    name: "send_telegram_message",
    description: "Send a text message to a Telegram chat, group, or channel. Supports optional formatting with HTML or MarkdownV2 parse modes.",
    schema: z.object({
      chatId: z.string().describe("The Telegram chat ID (numeric ID, @username, or group/channel ID)"),
      message: z.string().max(4096).describe("The message text to send (max 4096 characters)"),
      parseMode: z.enum(["HTML", "MarkdownV2", "Markdown"]).optional().describe("Parse mode for formatting: HTML, MarkdownV2, or Markdown"),
    }),
    func: async ({ chatId, message, parseMode }) => {
      try {
        const result = await sendTelegramMessage(token, chatId, message, parseMode);
        actions.push({
          type: "send_telegram_message",
          status: "success",
          message: `Message sent to chat ${chatId} (message_id: ${result.message_id})`,
          data: result,
        });
        return `Message sent successfully to chat ${chatId}. Message ID: ${result.message_id}`;
      } catch (error: any) {
        actions.push({
          type: "send_telegram_message",
          status: "error",
          message: `Failed to send message to ${chatId}: ${error.message}`,
        });
        return `Error sending message: ${error.message}`;
      }
    },
  }));

  return tools;
};
