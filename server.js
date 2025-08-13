// Simple Local AI Service Server
// This is a basic server that simulates an AI service for development purposes
// You can replace this with calls to your actual AI service (OpenAI, Anthropic, local LLM, etc.)
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const awsBedrockClient = require('./aws/bedrock'); // Import the Bedrock AI client
const prompts = require('./prompts'); // Import the prompts module

const bedrockAIClient = new awsBedrockClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Simple wildcard CORS for local development
app.use(cors());

// Body parsing middleware - MUST come before route handlers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// AI Service Endpoint
app.post('/api/ai', async (req, res) => {
    try {
        // Check if body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                error: 'Request body is missing',
                message: 'Please send a JSON body with prompt field'
            });
        }

        const { prompt, context = '', maxTokens = 1000, temperature = 0.7 } = req.body;

        // Check if prompt exists
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required',
                message: 'Please provide a prompt field in the request body'
            });
        }

        // Select system prompt based on task
        let systemPrompt = '';

        console.log(prompt);

        switch (prompt) {
            case 'xml_expert':
                systemPrompt = prompts.getXMLExpertPrompt(context);
                break;
            case 'xml_analysis':
                systemPrompt = prompts.getXMLAnalysisPrompt(context);
                break;
            case 'xml_change_analysis':
                systemPrompt = prompts.getXMLChangeAnalysisPrompt(context);
                break;
            case 'xml_validation':
                systemPrompt = prompts.getXMLValidationPrompt(context);
                break;
            case 'xml_documentation':
                systemPrompt = prompts.getXMLDocumentationPrompt(context);
                break;
            case 'xml_editor':
                systemPrompt = prompts.getXMLEditorPrompt(context);
                break;
            case 'xml_produce_edits':
                systemPrompt = prompts.getXMLProduceEditsPrompt(context);
                break;
            case 'xml_revision_comment':
                systemPrompt = prompts.getXMLRevisionCommentPrompt(context);
                break;  
            default:
                systemPrompt = prompts.getXMLExpertPrompt(context); // Default to general XML expert
                break;
        }


        console.log(`AI Request received:`);
        console.log(`Context: ${context}`);
        console.log(`User Prompt: ${prompt}`);
        console.log(`System Prompt: ${systemPrompt.substring(0, 200)}...`);
        console.log(`Context length: ${context ? context.length : 0} chars`);

        const bedrockResponse = await bedrockAIClient.invokeModel(systemPrompt, context, {
            maxTokens,
            temperature
        });

        console.log(`Bedrock AI Response:`, bedrockResponse);

        res.json({
            success: true,
            response: bedrockResponse.response,
            model: bedrockResponse.model,
            usage: bedrockResponse.usage
        });

    } catch (error) {
        console.error('AI Service Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local AI Service running on http://localhost:${PORT}`);
    console.log(`📡 AI endpoint: http://localhost:${PORT}/api/ai`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('🎯 This server provides mock AI responses for the XML editor.');
    console.log('🔧 Replace the mock responses with actual AI service calls as needed.');
});

module.exports = app;