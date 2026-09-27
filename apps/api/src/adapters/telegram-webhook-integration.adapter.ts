import { resolveConfigValue, WebhookTriggerResult } from "../services/webhook.service";
import { AgentResponse } from "../types";

const TELEGRAM_API = "https://api.telegram.org/bot";

class TelegramWebhookIntegrationAdapter implements IWebhookIntegrationAdapter {
    async sendTelegramMessage(
        token: string,
        chatId: string,
        message: string,
    ): Promise<any> {
        const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message }),
        });

        const data = await res.json();
        if (!data.ok) {
            throw new Error(data.description ?? "Unknown Telegram API error");
        }
        return data.result;
    }

    async processRequest(
        input: string,
        sessionId: string,
        webhookConfig: any,
        body: any,
        aiAgentCallFunction: AIAgentCallFunction
    ): Promise<WebhookTriggerResult> {
        const telegramChatId =
            resolveConfigValue(body, webhookConfig.telegramChatId) ??
            resolveConfigValue(body, webhookConfig.sessionId);
        const telegramBotToken = resolveConfigValue(body, webhookConfig.telegramBotToken);
        let response: AgentResponse;
        response = await aiAgentCallFunction();

        let telegramSent = false;
        let telegramError: string | undefined;
        if (telegramBotToken && telegramChatId) {
            try {
                await this.sendTelegramMessage(telegramBotToken, telegramChatId, response.message);
                telegramSent = true;
            } catch (error: any) {
                telegramError = error.message ?? "Failed to send Telegram message.";
            }
        } else {
            telegramError = "Missing telegramBotToken or telegramChatId in webhook config.";
        }

        return {
            webhook: webhookConfig,
            sessionId,
            text: input,
            response,
            telegramSent,
            telegramError,
        };
    }
}

export default TelegramWebhookIntegrationAdapter