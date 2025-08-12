// AI Integration Module
class AIIntegration {
    constructor() {
        this.apiEndpoint = 'http://localhost:3001/api/ai'; // Local AI service endpoint
        this.fallbackEndpoint = 'https://api.openai.com/v1/chat/completions'; // Fallback to OpenAI
        this.apiKey = ''; // Will be set by user or environment
    }

    // Set API configuration
    setApiConfig(endpoint, apiKey) {
        this.apiEndpoint = endpoint;
        this.apiKey = apiKey;
    }

    // Call AI agent with context
    async callAI(prompt, xmlContext = '', options = {}) {
        const defaultOptions = {
            maxTokens: 1000,
            temperature: 0.7,
            includeContext: true
        };

        const config = { ...defaultOptions, ...options };

        try {
            // First try local AI service
            const response = await this.callLocalAI(prompt, xmlContext, config);
            if (response.success) {
                return response;
            }

            // Fallback to external API if local fails
            console.log('Local AI service unavailable, trying fallback...');
            return await this.callExternalAI(prompt, xmlContext, config);

        } catch (error) {
            console.error('AI call failed:', error);
            return {
                success: false,
                error: 'AI service is currently unavailable. Please check your configuration.',
                suggestion: 'You can set up a local AI service or configure an external API key.'
            };
        }
    }

    // Call local AI service
    async callLocalAI(prompt, xmlContext, config) {
        try {
            const payload = {
                prompt: prompt,
                context: config.includeContext ? xmlContext : '',
                maxTokens: config.maxTokens,
                temperature: config.temperature,
                task: 'xml_enhancement'
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                response: data.response || data.text || data.content,
                usage: data.usage,
                model: data.model || 'local'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Call external AI service (OpenAI compatible)
    async callExternalAI(prompt, xmlContext, config) {
        if (!this.apiKey) {
            return {
                success: false,
                error: 'No API key configured for external AI service.',
                suggestion: 'Please set your API key in the configuration.'
            };
        }

        try {
            const systemMessage = `You are an AI assistant helping with XML document editing and enhancement. 
            You can help with:
            - Improving XML structure and formatting
            - Adding missing elements or attributes
            - Converting between different XML schemas
            - Validating and fixing XML syntax
            - Generating XML content based on descriptions
            
            Always respond with valid XML when asked to modify XML content.`;

            const userMessage = config.includeContext 
                ? `Current XML context:\n${xmlContext}\n\nUser request: ${prompt}`
                : prompt;

            const payload = {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature
            };

            const response = await fetch(this.fallbackEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                response: data.choices[0].message.content,
                usage: data.usage,
                model: data.model
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Predefined AI prompts for common tasks
    getPromptTemplates() {
        return {
            enhance: "Improve the structure and formatting of this XML document while maintaining its content.",
            validate: "Check this XML for any issues and suggest improvements.",
            convert: "Convert this content to a well-structured XML format.",
            addMetadata: "Add appropriate metadata elements to this XML document.",
            optimize: "Optimize this XML for better readability and performance.",
            schema: "Suggest a schema or structure for this XML content.",
            transform: "Transform this XML according to the following requirements: ",
            generate: "Generate XML content based on this description: "
        };
    }

    // Extract XML from AI response
    extractXMLFromResponse(response) {
        // Look for XML content in the response
        const xmlMatch = response.match(/```xml\n([\s\S]*?)\n```/) || 
                        response.match(/<\?xml[\s\S]*?<\/[^>]+>/) ||
                        response.match(/<[^>]+>[\s\S]*?<\/[^>]+>/);
        
        if (xmlMatch) {
            return xmlMatch[1] || xmlMatch[0];
        }
        
        return null;
    }

    // Check if response contains XML
    hasXMLContent(response) {
        return this.extractXMLFromResponse(response) !== null;
    }

    // Get AI capabilities description
    getCapabilities() {
        return {
            xmlEnhancement: "Improve XML structure and formatting",
            contentGeneration: "Generate XML content from descriptions",
            validation: "Validate and fix XML syntax issues",
            transformation: "Transform XML between different formats",
            optimization: "Optimize XML for performance and readability",
            schemaDesign: "Design XML schemas and structures",
            dataConversion: "Convert data to/from XML format",
            customRequests: "Handle custom XML-related requests"
        };
    }
}

// Mock local AI service for demonstration
class MockAIService {
    static async handleRequest(prompt, xmlContext) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simple mock responses based on keywords
        if (prompt.toLowerCase().includes('enhance') || prompt.toLowerCase().includes('improve')) {
            return {
                success: true,
                response: `Here's an enhanced version of your XML:\n\n\`\`\`xml\n${xmlContext.replace(/<paragraph>/g, '<p>').replace(/<\/paragraph>/g, '</p>')}\n\`\`\`\n\nI've improved the structure by using more standard HTML-like elements while maintaining XML compliance.`,
                model: 'mock-ai'
            };
        }

        if (prompt.toLowerCase().includes('validate')) {
            return {
                success: true,
                response: "Your XML structure looks good! It's well-formed and follows proper nesting rules. Consider adding a DOCTYPE declaration for better validation.",
                model: 'mock-ai'
            };
        }

        if (prompt.toLowerCase().includes('sample') || prompt.toLowerCase().includes('example')) {
            return {
                success: true,
                response: `Here's a sample XML structure:\n\n\`\`\`xml\n<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <metadata>\n    <title>Sample Document</title>\n    <author>AI Assistant</author>\n    <date>${new Date().toISOString().split('T')[0]}</date>\n  </metadata>\n  <content>\n    <section id="intro">\n      <heading>Introduction</heading>\n      <paragraph>This is a sample paragraph.</paragraph>\n    </section>\n  </content>\n</document>\n\`\`\``,
                model: 'mock-ai'
            };
        }

        // Default response
        return {
            success: true,
            response: `I understand you want me to help with: "${prompt}"\n\nBased on your XML context, I can suggest improvements to structure, add metadata, or help with validation. Please be more specific about what you'd like me to do with your XML document.`,
            model: 'mock-ai'
        };
    }
}

// Export for use in other modules
window.AIIntegration = AIIntegration;
window.MockAIService = MockAIService;
