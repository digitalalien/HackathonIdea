// AI Integration Module
class AIIntegration {
    constructor() {
        this.apiEndpoint = ''; // Local AI service endpoint
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


        } catch (error) {
            console.error('AI call failed:', error);
            return {
                success: false,
                error: 'AI service is currently unavailable. Please check your configuration.',
                suggestion: 'You can set up a local AI service or configure an external API key.'
            };
        }
    }

   
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

// Helper function to get current XML content
function getCurrentXMLContent() {
    // Replace this with your actual implementation
    const xmlSource = document.getElementById('xmlSource');
    return xmlSource ? xmlSource.value : '';
}

// Helper function to show AI response
function showAIResponse(response) {
    const aiModal = document.getElementById('aiModal');
    const aiResponse = document.getElementById('aiResponse');
    
    if (aiModal && aiResponse) {
        aiResponse.innerHTML = `<pre>${response}</pre>`;
        aiModal.style.display = 'block';
    } else {
        alert('AI Response: ' + response);
    }
}

document.getElementById('callAI').addEventListener('click', async () => {
     // Call local AI service
    async function callLocalAI(prompt, xmlContext, config) { 
        try {
            let userQuestion = document.getElementById('aiPrompt').value.trim();
            console.log(userQuestion);
            const finalContext = userQuestion + "\n" + xmlContext;
            const payload = {
                prompt: 'xml_editor',
                context: finalContext,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
            };

            const response = await fetch('http://localhost:3001/api/ai', {
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

    const aiPromptInput = document.getElementById('aiPrompt');
    const userPrompt = aiPromptInput.value.trim();
    
    if (!userPrompt) {
        alert('Please enter a prompt for the AI');
        return;
    }
    
    // Get current XML content (you'll need to implement this based on your editor setup)
    const xmlContent = getCurrentXMLContent(); // Replace with your actual function

    const finalContext = userPrompt + "\n" + xmlContent;
    // Show loading state
    const callAIButton = document.getElementById('callAI');
    const originalText = callAIButton.textContent;
    callAIButton.textContent = 'Processing...';
    callAIButton.disabled = true;
    
    try {
        const response = await callLocalAI('xml_editor', finalContext, {
            includeContext: true,
            maxTokens: 1000
        });
         if (response.success) {
            // Show AI response in modal or update editor
            showAIResponse(response.response);
        } else {
            alert('AI request failed: ' + response.error);
        }
    } catch (error) {
        console.error('AI call error:', error);
        alert('Failed to call AI service: ' + error.message);
    } finally {
        // Restore button state
        callAIButton.textContent = originalText;
        callAIButton.disabled = false;
        
        // Clear the input
        aiPromptInput.value = '';
    }
});


// Export for use in other modules
window.AIIntegration = AIIntegration;
