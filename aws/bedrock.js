require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockAIClient {
    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.MODEL_REGION_NAME || process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        this.xmlModel = process.env.XML_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
        this.model = process.env.MODELID || 'us.meta.llama3-3-70b-instruct-v1:0';
    }

    async invokeModel(prompt, options = {}) {
        const {
            maxTokens = 1000,
            temperature = 0.7,
        } = options;

        try {
            // Prepare the request body for Llama model
            const requestBody = {
                prompt: prompt,
                max_gen_len: maxTokens,
                temperature: temperature,
                top_p: 0.9
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
            const aiResponse = responseBody.generation;

            return {
                success: true,
                response: aiResponse,
                model: this.model,
                usage: {
                    prompt_tokens: responseBody.prompt_token_count || 0,
                    completion_tokens: responseBody.generation_token_count || 0,
                    total_tokens: (responseBody.prompt_token_count || 0) + (responseBody.generation_token_count || 0)
                }
            };

        } catch (error) {
            console.error('Bedrock API Error:', error);
            throw new Error(`Bedrock API call failed: ${error.message}`);
        }
    }

    async invokeModelWithXmlStructuredOutput(prompt, options = {}) {
        console.log(`Invoking model with XML structured output: ${this.model}`);

        try {
            const command = new ConverseCommand({
                modelId: this.xmlModel,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                inferenceConfig: {
                    maxTokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                    topP: 0.9
                },
                toolConfig: {
                    tools: [
                        {
                            toolSpec: {
                                name: "xml_formatter",
                                description: "Format the response as valid XML",
                                inputSchema: {
                                    json: {
                                        type: "object",
                                        properties: {
                                            xml_content: {
                                                type: "string",
                                                description: "Valid XML document containing the response"
                                            }
                                        },
                                        required: ["xml_content"]
                                    }
                                }
                            }
                        }
                    ],
                    toolChoice: {
                        tool: {
                            name: "xml_formatter"
                        }
                    }
                }
            });

            const response = await this.client.send(command);

            // Extract the structured output from the tool use
            if (response.output.message.content[0].toolUse) {
                const toolOutput = response.output.message.content[0].toolUse.input;
                return {
                    success: true,
                    response: toolOutput.xml_content,
                    model: this.model,
                    usage: response.usage,
                    structured: true
                };
            }

            // Fallback if tool wasn't used (shouldn't happen with toolChoice)
            throw new Error('Model did not use structured output tool as expected');

        } catch (error) {
            console.error('Bedrock Converse API Error:', error);
            throw new Error(`Bedrock Converse API call failed: ${error.message}`);
        }
    }

    isConfigured() {
        return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    }

    getModelInfo() {
        return {
            model: this.model,
            region: process.env.MODEL_REGION_NAME || process.env.AWS_REGION || 'us-east-1',
            configured: this.isConfigured()
        };
    }
}

module.exports = BedrockAIClient;