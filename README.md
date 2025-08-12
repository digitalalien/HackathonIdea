# XML WYSIWYG Editor with AI Integration

A powerful web application that combines a WYSIWYG editor with XML rendering capabilities and AI assistance for content enhancement and manipulation.

## Features

🔧 **WYSIWYG Editor** - Rich text editing with Quill.js
📝 **XML Source View** - Toggle between visual and source editing
🔍 **Live Preview** - Real-time XML rendering with syntax highlighting
✅ **XML Validation** - Built-in validation with error reporting
💾 **Import/Export** - Load and save XML documents
🤖 **AI Integration** - Ask AI to enhance, validate, or transform your XML
💾 **AI Revision Comments** - Automatic revision comment generation with change analysis
📋 **Table of Contents** - Load and manage multiple XML documents from ZIP files
🎨 **Responsive Design** - Works on desktop and mobile devices

## Getting Started

### Quick Start (Static Files)

1. **Install a simple HTTP server** (if you don't have one):
   ```powershell
   npm install -g http-server
   ```

2. **Serve the files**:
   ```powershell
   cd c:\Projects\HackathonIdea
   npx http-server . -p 8080 -c-1
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8080`

### With AI Service (Recommended)

1. **Install dependencies**:
   ```powershell
   cd c:\Projects\HackathonIdea
   npm install
   ```

2. **Start the AI service**:
   ```powershell
   npm start
   ```
   This starts the mock AI service on `http://localhost:3001`

3. **In a new terminal, serve the web app**:
   ```powershell
   npm run serve
   ```
   This serves the web app on `http://localhost:8080`

4. **Open in browser**:
   Navigate to `http://localhost:8080`

## Usage Guide

### Basic Editing

1. **WYSIWYG Mode** - Use the rich text editor to create content
2. **XML Mode** - Click "Switch to XML View" to edit raw XML
3. **Live Preview** - See your XML rendered in real-time on the right panel

### AI Features

1. **Enter a prompt** in the AI input field (purple section)
2. **Click "Ask AI"** or press Enter
3. **Review the AI response** in the modal that appears
4. **Apply changes** if you like the suggestions

#### Sample AI Prompts

- "Enhance the structure of this XML document"
- "Add metadata to this document"
- "Validate this XML and suggest improvements"
- "Convert this to a more semantic structure"
- "Create a sample XML for a book catalog"
- "Add proper namespaces to this document"

### File Operations

- **Export**: Click "Export XML" to download your document
- **Import**: Click "Import XML" to load an existing XML file
- **Clear**: Click "Clear" to start fresh (with confirmation)
- **Validate**: Click "Validate XML" to check for errors

### AI Revision Comments (NEW!)

The application now includes automatic AI revision comment generation:

1. **Make changes** to your XML document in the editor
2. **Click "💾 Save with AI Revision"** to start the revision process
3. **Review AI analysis** of your changes in the modal
4. **Edit the revision comment** if needed (AI generates it automatically)
5. **Save with revision** to add the revision metadata to your XML

The AI analyzes what changed and generates professional revision comments like:
- "Updated caution note under engine startup procedure to reflect new OEM guidance."
- "Added safety warning for high-voltage components in maintenance section."
- "Corrected torque specifications for wheel lug nuts based on manufacturer update."

Revision comments appear in your XML as:
```xml
<Revision>
  <RevisionNumber>3.2</RevisionNumber>
  <RevisionDate>2025-08-12</RevisionDate>
  <RevisionComment>Updated caution note under engine startup procedure to reflect new OEM guidance.</RevisionComment>
</Revision>
```

## AI Integration Details

### Local AI Service

The application includes a mock AI service that provides intelligent responses for common XML tasks:

- **Enhancement**: Improves structure and formatting
- **Validation**: Checks syntax and suggests improvements
- **Generation**: Creates XML from descriptions
- **Conversion**: Transforms XML formats
- **Metadata**: Adds comprehensive metadata

### External AI Integration

To use real AI services (OpenAI, Anthropic, etc.), modify the `AIIntegration` class in `js/ai-integration.js`:

```javascript
// Set your API configuration
window.xmlEditor.aiIntegration.setApiConfig(
    'https://api.openai.com/v1/chat/completions',
    'your-api-key-here'
);
```

## File Structure

```
c:\Projects\HackathonIdea\
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Stylesheet
├── js/
│   ├── app.js             # Main application logic
│   ├── xml-renderer.js    # XML processing and rendering
│   └── ai-integration.js  # AI service integration
├── server.js              # Local AI service (Node.js)
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Technical Details

### Dependencies

**Frontend:**
- Quill.js - WYSIWYG editor
- Vanilla JavaScript - No framework dependencies
- CSS Grid/Flexbox - Responsive layout

**Backend (Optional):**
- Express.js - Web server
- CORS - Cross-origin resource sharing

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (responsive design)

### XML Processing

The application can handle:
- Well-formed XML documents
- XML validation and error reporting
- HTML ↔ XML conversion
- Syntax highlighting
- Pretty printing

## Development

### Adding New AI Features

1. **Extend the AIIntegration class** in `js/ai-integration.js`
2. **Add new prompt templates** in the `getPromptTemplates()` method
3. **Update the UI** to include new controls
4. **Test with the mock service** before using external APIs

### Customizing XML Mapping

Modify the `XMLRenderer` class in `js/xml-renderer.js` to:
- Change HTML ↔ XML element mappings
- Add new XML elements or attributes
- Customize syntax highlighting
- Implement custom validation rules

### Mock AI Service

The local server in `server.js` provides:
- Realistic response delays
- Context-aware responses
- Different response types based on keywords
- Extensible response generation

## Troubleshooting

### Common Issues

1. **AI service not responding**
   - Check if server is running on port 3001
   - Verify CORS is enabled
   - Check browser console for errors

2. **XML validation errors**
   - Ensure proper XML structure
   - Check for unclosed tags
   - Verify XML declaration

3. **Import/Export not working**
   - Check file permissions
   - Ensure browser supports File API
   - Verify MIME types

### Console Debugging

Open browser console and try:
```javascript
// Show AI capabilities
showAICapabilities()

// Get prompt templates
getPromptTemplates()

// Access the editor instance
window.xmlEditor
```

## Future Enhancements

- [ ] Schema validation (XSD support)
- [ ] Real-time collaborative editing
- [ ] Plugin system for custom elements
- [ ] Advanced AI model selection
- [ ] XML transformation (XSLT)
- [ ] Database integration
- [ ] Version control
- [ ] Custom themes

## License

MIT License - feel free to use and modify for your needs!

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the troubleshooting section
3. Modify the code to fit your specific needs

---

**Happy XML editing! 🚀**
