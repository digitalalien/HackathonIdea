require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockAIClient {
    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        
        this.model = process.env.AI_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0';
    }

    async invokeModel(prompt, context = '', options = {}) {
        const {
            maxTokens = 1000,
            temperature = 0.7,
            systemPrompt = "You are a helpful AI assistant specializing in XML processing and editing."
        } = options;

        try {
            // Construct the full prompt with context
            const fullPrompt = context 
                ? `Context:\n${context}\n\nUser Request: ${prompt}\n\nPlease provide a helpful response for this XML-related request.`
                : `User Request: ${prompt}\n\nPlease provide a helpful response for this XML-related request.`;

            // Prepare the request body for Claude model
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                temperature: temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ]
            };

            const command = new InvokeModelCommand({
                modelId: this.model,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });

            console.log(`Calling Bedrock model: ${this.model}`);
            const response = await this.client.send(command);
            
            // Parse the response
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const aiResponse = responseBody.content[0].text;

            return {
                success: true,
                response: aiResponse,
                model: this.model,
                usage: {
                    prompt_tokens: responseBody.usage?.input_tokens || 0,
                    completion_tokens: responseBody.usage?.output_tokens || 0,
                    total_tokens: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
                }
            };

        } catch (error) {
            console.error('Bedrock API Error:', error);
            throw new Error(`Bedrock API call failed: ${error.message}`);
        }
    }

    isConfigured() {
        return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    }

    getModelInfo() {
        return {
            model: this.model,
            region: process.env.AWS_REGION || 'us-east-1',
            configured: this.isConfigured()
        };
    }
}

module.exports = BedrockAIClient;