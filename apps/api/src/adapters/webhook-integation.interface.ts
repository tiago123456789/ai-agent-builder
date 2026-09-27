type AIAgentCallFunction = () => Promise<any>;

interface IWebhookIntegrationAdapter {
    processRequest(
        input: string, 
        sessionId: string, 
        webhookConfig: any,
        body: any,
        aiAgentCallFunction: AIAgentCallFunction
    ): Promise<any>;
}