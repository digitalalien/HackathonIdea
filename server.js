// Simple Local AI Service Server
// This is a basic server that simulates an AI service for development purposes
// You can replace this with calls to your actual AI service (OpenAI, Anthropic, local LLM, etc.)

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AI Service Endpoint
app.post('/api/ai', async (req, res) => {
    try {
        const { prompt, context, maxTokens = 1000, temperature = 0.7, task } = req.body;
        
        console.log(`AI Request received:`);
        console.log(`Task: ${task}`);
        console.log(`Prompt: ${prompt}`);
        console.log(`Context length: ${context ? context.length : 0} chars`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Mock AI responses based on prompt keywords
        let response = generateMockResponse(prompt, context);
        
        res.json({
            success: true,
            response: response,
            model: 'local-mock-ai',
            usage: {
                prompt_tokens: prompt.length / 4,
                completion_tokens: response.length / 4,
                total_tokens: (prompt.length + response.length) / 4
            }
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

// Generate mock AI responses
function generateMockResponse(prompt, context) {
    const lowerPrompt = prompt.toLowerCase();
    
    // XML Enhancement
    if (lowerPrompt.includes('enhance') || lowerPrompt.includes('improve')) {
        return generateEnhancementResponse(context);
    }
    
    // XML Validation
    if (lowerPrompt.includes('validate') || lowerPrompt.includes('check')) {
        return generateValidationResponse(context);
    }
    
    // XML Generation
    if (lowerPrompt.includes('create') || lowerPrompt.includes('generate')) {
        return generateCreationResponse(prompt);
    }
    
    // XML Conversion
    if (lowerPrompt.includes('convert') || lowerPrompt.includes('transform')) {
        return generateConversionResponse(context);
    }
    
    // Add metadata
    if (lowerPrompt.includes('metadata') || lowerPrompt.includes('attributes')) {
        return generateMetadataResponse(context);
    }
    
    // Structure suggestions
    if (lowerPrompt.includes('structure') || lowerPrompt.includes('organize')) {
        return generateStructureResponse(context);
    }
    
    // Default response
    return generateDefaultResponse(prompt, context);
}

function generateEnhancementResponse(context) {
    const hasContext = context && context.length > 0;
    
    if (hasContext) {
        return `I've analyzed your XML document and here are some enhancements:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<document xmlns:meta="http://metadata.org/2024">
    <meta:header>
        <meta:title>Enhanced Document</meta:title>
        <meta:created>${new Date().toISOString()}</meta:created>
        <meta:version>1.1</meta:version>
    </meta:header>
    <content>
        <section id="main">
            <heading level="1">Enhanced Content Structure</heading>
            <paragraph style="enhanced">Your content has been restructured with better semantics and metadata.</paragraph>
            <list type="enhanced-unordered">
                <item priority="high">Added namespace declarations</item>
                <item priority="medium">Improved element hierarchy</item>
                <item priority="medium">Added semantic attributes</item>
            </list>
        </section>
    </content>
</document>
\`\`\`

Key improvements:
- Added XML namespace for metadata
- Enhanced semantic structure
- Added attributes for better data organization
- Included version control metadata`;
    } else {
        return `To enhance your XML, I recommend:

1. **Add proper XML declaration** with encoding
2. **Use semantic element names** that describe content
3. **Include metadata** in a header section
4. **Add attributes** for additional context
5. **Use consistent naming conventions**

Please provide your XML content so I can give specific enhancement suggestions.`;
    }
}

function generateValidationResponse(context) {
    if (context && context.includes('<?xml')) {
        return `✅ **XML Validation Results:**

Your XML document appears to be well-formed! Here's my analysis:

**Structure:** Good - proper XML declaration and root element
**Syntax:** Valid - no parsing errors detected
**Best Practices:** Consider these improvements:
- Add a DOCTYPE declaration for better validation
- Use consistent indentation (2 or 4 spaces)
- Add comments for complex sections
- Consider using XML Schema (XSD) for advanced validation

**Recommendations:**
- Your document follows XML 1.0 standards
- Element nesting is proper
- No unclosed tags detected`;
    } else {
        return `⚠️ **Validation Notes:**

I need to see your XML content to perform a thorough validation. However, here are general XML validation tips:

**Common Issues to Check:**
- Proper XML declaration: \`<?xml version="1.0" encoding="UTF-8"?>\`
- Single root element
- Properly closed tags
- Correct nesting order
- Escaped special characters (&, <, >, ", ')

Please share your XML for detailed validation.`;
    }
}

function generateCreationResponse(prompt) {
    const topic = extractTopic(prompt);
    
    return `Here's a sample XML structure for "${topic}":

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<${topic.replace(/\s+/g, '_').toLowerCase()}>
    <metadata>
        <title>${topic}</title>
        <created_date>${new Date().toISOString().split('T')[0]}</created_date>
        <author>AI Generated</author>
    </metadata>
    <content>
        <section id="introduction">
            <heading>Introduction</heading>
            <paragraph>This is a sample ${topic} document structure.</paragraph>
        </section>
        <section id="main_content">
            <heading>Main Content</heading>
            <data_items>
                <item id="1" type="primary">Sample item 1</item>
                <item id="2" type="secondary">Sample item 2</item>
            </data_items>
        </section>
    </content>
</${topic.replace(/\s+/g, '_').toLowerCase()}>
\`\`\`

This structure includes:
- Proper XML declaration
- Metadata section for document information
- Organized content sections
- Semantic element names
- Unique identifiers where appropriate`;
}

function generateConversionResponse(context) {
    return `I can help convert your XML to different formats or structures. Here's an optimized version:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<document_v2>
    <header>
        <schema_version>2.0</schema_version>
        <converted_date>${new Date().toISOString()}</converted_date>
    </header>
    <body>
        <content_blocks>
            <block type="text" id="block_1">
                <content>Converted content with improved structure</content>
                <attributes>
                    <style>enhanced</style>
                    <priority>normal</priority>
                </attributes>
            </block>
        </content_blocks>
    </body>
</document_v2>
\`\`\`

**Conversion highlights:**
- Modernized element structure
- Added versioning information
- Improved data organization
- Enhanced metadata support`;
}

function generateMetadataResponse(context) {
    return `Here's your XML enhanced with comprehensive metadata:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<document 
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:meta="http://example.com/metadata"
    meta:version="1.0">
    
    <meta:metadata>
        <dc:title>Enhanced Document with Metadata</dc:title>
        <dc:creator>Content Author</dc:creator>
        <dc:date>${new Date().toISOString()}</dc:date>
        <dc:description>Document enhanced with Dublin Core metadata</dc:description>
        <meta:document_id>${generateId()}</meta:document_id>
        <meta:classification>standard</meta:classification>
        <meta:keywords>xml, metadata, enhanced</meta:keywords>
    </meta:metadata>
    
    <content meta:section="main">
        <!-- Your existing content here with metadata attributes -->
        <paragraph meta:importance="high" dc:created="${new Date().toISOString()}">
            Enhanced paragraph with metadata attributes
        </paragraph>
    </content>
</document>
\`\`\`

**Metadata additions:**
- Dublin Core namespace for standard metadata
- Custom metadata namespace
- Document classification and keywords
- Timestamped elements
- Unique document identifier`;
}

function generateStructureResponse(context) {
    return `Here's a well-structured XML organization:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<structured_document>
    <!-- Document Header -->
    <document_info>
        <title>Well-Structured XML Document</title>
        <version>1.0</version>
        <last_modified>${new Date().toISOString()}</last_modified>
    </document_info>
    
    <!-- Main Content Sections -->
    <sections>
        <section id="intro" level="1">
            <title>Introduction</title>
            <content>
                <paragraph>Properly structured introduction content.</paragraph>
            </content>
        </section>
        
        <section id="main" level="1">
            <title>Main Content</title>
            <subsections>
                <section id="main_sub1" level="2">
                    <title>Subsection 1</title>
                    <content>
                        <list type="ordered">
                            <item>First structured item</item>
                            <item>Second structured item</item>
                        </list>
                    </content>
                </section>
            </subsections>
        </section>
    </sections>
    
    <!-- Document Footer -->
    <document_footer>
        <references/>
        <appendices/>
    </document_footer>
</structured_document>
\`\`\`

**Structure benefits:**
- Clear hierarchical organization
- Consistent naming patterns
- Logical content grouping
- Proper nesting levels
- Semantic element names`;
}

function generateDefaultResponse(prompt, context) {
    return `I understand you want help with: "${prompt}"

Based on XML best practices, I can assist with:

🔧 **XML Enhancement:** Improve structure, formatting, and semantics
📝 **Content Generation:** Create XML from descriptions
✅ **Validation:** Check syntax and structure
🔄 **Transformation:** Convert between formats
📊 **Metadata:** Add proper document metadata
🏗️ **Structure:** Organize content logically

**Sample XML structure:**
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<your_document>
    <header>
        <title>Your Document Title</title>
        <created>${new Date().toISOString().split('T')[0]}</created>
    </header>
    <content>
        <section>
            <heading>Your Content Here</heading>
            <paragraph>Structured content...</paragraph>
        </section>
    </content>
</your_document>
\`\`\`

Please provide more specific details about what you'd like me to help you with!`;
}

function extractTopic(prompt) {
    // Simple topic extraction from prompt
    const words = prompt.toLowerCase().split(' ');
    const topicWords = words.filter(word => 
        word.length > 3 && 
        !['create', 'generate', 'make', 'build', 'for'].includes(word)
    );
    return topicWords.join(' ') || 'document';
}

function generateId() {
    return 'doc_' + Math.random().toString(36).substr(2, 9);
}

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
