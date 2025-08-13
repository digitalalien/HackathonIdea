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

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function markdownToHtml(markdown) {
    if (!markdown) return '';

    return markdown
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Code inline
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Helper function to show AI response
function showAIResponse(response, summary) {
    const aiModal = document.getElementById('aiModal');
    const aiResponse = document.getElementById('aiResponse');

    // Store the response on the global xmlEditor instance
    if (window.xmlEditor) {
        window.xmlEditor.currentAIResponse = response;
    }

    console.log("XML Content Response: " + response);
    if (aiModal && aiResponse) {

        aiResponse.innerHTML = `
            <div class="ai-xml-response">
                <h4 style="margin-bottom: 0.5em; color: #555;">XML Proposal:</h4>
                <pre style="background-color: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; border: 1px solid #ddd;"><code class="language-xml">${escapeXml(response)}</code></pre>
            </div>
            <div class="ai-summary" style="margin-bottom: 1.5em; line-height: 1.6; color: #333;">
                ${summary}
            </div>
        `;
        aiModal.style.display = 'block';
    } else {
        alert('AI Response: ' + summary + '\n\n' + response);
    }
}

async function executeAIApiCall(prompt, context) {
    const payload = {
        prompt: prompt,
        context: context,
        maxTokens: 1000,
        temperature: 0.7,
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

    return data;
}

async function getXmlContentEdits(context) {
    const response = await executeAIApiCall('xml_produce_edits', context, {
        includeContext: true,
        maxTokens: 1000
    });
    return response;
}

document.getElementById('callAI').addEventListener('click', async () => {
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
        const response = await executeAIApiCall('xml_editor', finalContext, {
            includeContext: true,
            maxTokens: 1000
        });
        console.log(response);
        if (response.success) {
            const responseData = response.response;
            const newEditContext = `${responseData}\n${xmlContent}`;
            const editResponse = await getXmlContentEdits(newEditContext);
            const summaryResult = await executeAIApiCall('xml_change_analysis', responseData);
            const summary = summaryResult.response;
            showAIResponse(editResponse.response, summary);
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
