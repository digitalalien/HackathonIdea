// Main Application Logic
class XMLEditor {
    constructor() {
        this.xmlRenderer = new XMLRenderer();
        this.aiIntegration = new AIIntegration();
        this.isXmlView = false;
        this.currentXml = '';
        
        this.initializeEditor();
        this.setupEventListeners();
        
        // Initialize TOC Manager
        this.tocManager = new TOCManager(this);
        
        this.loadSampleContent();
    }

    initializeEditor() {
        // Initialize Quill WYSIWYG editor
        this.quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'],
                    ['clean']
                ]
            }
        });

        // Get DOM elements
        this.elements = {
            toggleView: document.getElementById('toggleView'),
            validateXml: document.getElementById('validateXml'),
            clearEditor: document.getElementById('clearEditor'),
            exportXml: document.getElementById('exportXml'),
            importXml: document.getElementById('importXml'),
            importBtn: document.getElementById('importBtn'),
            aiPrompt: document.getElementById('aiPrompt'),
            callAI: document.getElementById('callAI'),
            xmlSource: document.getElementById('xmlSource'),
            xmlPreview: document.getElementById('xmlPreview'),
            statusMessage: document.getElementById('statusMessage'),
            aiModal: document.getElementById('aiModal'),
            aiResponse: document.getElementById('aiResponse'),
            applyAIResponse: document.getElementById('applyAIResponse'),
            closeModal: document.getElementById('closeModal'),
            wysiwyg: document.getElementById('editor')
        };
    }

    setupEventListeners() {
        // Editor content changes
        this.quill.on('text-change', () => {
            this.updateXmlFromEditor();
        });

        // XML source changes
        this.elements.xmlSource.addEventListener('input', () => {
            this.updateEditorFromXml();
        });

        // Toggle between WYSIWYG and XML view
        this.elements.toggleView.addEventListener('click', () => {
            this.toggleView();
        });

        // Validate XML
        this.elements.validateXml.addEventListener('click', () => {
            this.validateXml();
        });

        // Clear editor
        this.elements.clearEditor.addEventListener('click', () => {
            this.clearEditor();
        });

        // Export XML
        this.elements.exportXml.addEventListener('click', () => {
            this.exportXml();
        });

        // Import XML
        this.elements.importBtn.addEventListener('click', () => {
            this.elements.importXml.click();
        });

        this.elements.importXml.addEventListener('change', (e) => {
            this.importXml(e.target.files[0]);
        });

        // AI Integration
        this.elements.callAI.addEventListener('click', () => {
            this.callAI();
        });

        this.elements.aiPrompt.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.callAI();
            }
        });

        // Modal controls
        this.elements.closeModal.addEventListener('click', () => {
            this.closeModal();
        });

        this.elements.applyAIResponse.addEventListener('click', () => {
            this.applyAIResponse();
        });

        // Close modal when clicking outside
        this.elements.aiModal.addEventListener('click', (e) => {
            if (e.target === this.elements.aiModal) {
                this.closeModal();
            }
        });

        // Close modal with X button
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
    }

    loadSampleContent() {
        const sampleXml = this.xmlRenderer.createSampleXML();
        this.currentXml = sampleXml;
        this.elements.xmlSource.value = sampleXml;
        
        // Convert to HTML for WYSIWYG editor
        const htmlContent = this.xmlRenderer.xmlToHtml(sampleXml);
        this.quill.root.innerHTML = htmlContent;
        
        // Update preview
        this.updatePreview();
        this.setStatus('Sample content loaded');
    }

    toggleView() {
        this.isXmlView = !this.isXmlView;
        
        if (this.isXmlView) {
            // Switch to XML view
            this.elements.wysiwyg.style.display = 'none';
            this.elements.xmlSource.style.display = 'block';
            this.elements.toggleView.textContent = 'Switch to WYSIWYG View';
            this.updateXmlFromEditor();
        } else {
            // Switch to WYSIWYG view
            this.elements.wysiwyg.style.display = 'block';
            this.elements.xmlSource.style.display = 'none';
            this.elements.toggleView.textContent = 'Switch to XML View';
            this.updateEditorFromXml();
        }
    }

    updateXmlFromEditor() {
        if (!this.isXmlView) {
            const htmlContent = this.quill.root.innerHTML;
            this.currentXml = this.xmlRenderer.htmlToXml(htmlContent);
            this.elements.xmlSource.value = this.currentXml;
            this.updatePreview();
        }
    }

    updateEditorFromXml() {
        if (this.isXmlView) {
            this.currentXml = this.elements.xmlSource.value;
            const htmlContent = this.xmlRenderer.xmlToHtml(this.currentXml);
            this.quill.root.innerHTML = htmlContent;
            this.updatePreview();
        }
    }

    updatePreview() {
        const xmlToPreview = this.isXmlView ? this.elements.xmlSource.value : this.currentXml;
        this.xmlRenderer.renderPreview(xmlToPreview, this.elements.xmlPreview);
    }

    validateXml() {
        const xmlToValidate = this.isXmlView ? this.elements.xmlSource.value : this.currentXml;
        const validation = this.xmlRenderer.validateXML(xmlToValidate);
        
        if (validation.valid) {
            this.setStatus(validation.message, 'success');
        } else {
            this.setStatus(`Validation Error: ${validation.error}`, 'error');
        }
    }

    clearEditor() {
        if (confirm('Are you sure you want to clear the editor?')) {
            this.quill.setContents([]);
            this.elements.xmlSource.value = '';
            this.currentXml = '';
            this.updatePreview();
            this.setStatus('Editor cleared');
        }
    }

    exportXml() {
        const xmlToExport = this.isXmlView ? this.elements.xmlSource.value : this.currentXml;
        const blob = new Blob([xmlToExport], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.setStatus('XML exported successfully', 'success');
    }

    async importXml(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            this.currentXml = text;
            this.elements.xmlSource.value = text;
            
            // Convert to HTML for WYSIWYG editor
            const htmlContent = this.xmlRenderer.xmlToHtml(text);
            this.quill.root.innerHTML = htmlContent;
            
            this.updatePreview();
            this.setStatus('XML imported successfully', 'success');
        } catch (error) {
            this.setStatus(`Import error: ${error.message}`, 'error');
        }
    }

    async callAI() {
        const prompt = this.elements.aiPrompt.value.trim();
        if (!prompt) {
            this.setStatus('Please enter a prompt for the AI', 'error');
            return;
        }

        // Show loading state
        const originalText = this.elements.callAI.textContent;
        this.elements.callAI.innerHTML = '<span class="loading"></span> Thinking...';
        this.elements.callAI.disabled = true;

        try {
            const xmlContext = this.isXmlView ? this.elements.xmlSource.value : this.currentXml;
            
            // Try local AI first, then fallback to mock service
            let result;
            try {
                result = await this.aiIntegration.callAI(prompt, xmlContext);
            } catch (error) {
                console.log('Using mock AI service for demonstration');
                result = await MockAIService.handleRequest(prompt, xmlContext);
            }

            if (result.success) {
                this.showAIResponse(result.response, prompt);
                this.setStatus(`AI response received (${result.model || 'unknown'})`, 'success');
            } else {
                this.setStatus(`AI Error: ${result.error}`, 'error');
                if (result.suggestion) {
                    this.setStatus(`${result.error} ${result.suggestion}`, 'error');
                }
            }
        } catch (error) {
            this.setStatus(`AI call failed: ${error.message}`, 'error');
        } finally {
            // Restore button state
            this.elements.callAI.textContent = originalText;
            this.elements.callAI.disabled = false;
            this.elements.aiPrompt.value = '';
        }
    }

    showAIResponse(response, originalPrompt) {
        this.elements.aiResponse.textContent = response;
        this.currentAIResponse = response;
        this.currentAIPrompt = originalPrompt;
        this.elements.aiModal.style.display = 'block';
    }

    applyAIResponse() {
        if (!this.currentAIResponse) return;

        // Try to extract XML from the AI response
        const xmlContent = this.aiIntegration.extractXMLFromResponse(this.currentAIResponse);
        
        if (xmlContent) {
            // Apply the extracted XML
            this.currentXml = xmlContent;
            this.elements.xmlSource.value = xmlContent;
            
            // Convert to HTML for WYSIWYG editor
            const htmlContent = this.xmlRenderer.xmlToHtml(xmlContent);
            this.quill.root.innerHTML = htmlContent;
            
            this.updatePreview();
            this.setStatus('AI suggestions applied successfully', 'success');
        } else {
            // If no XML found, treat as general advice
            this.setStatus('AI response applied as guidance', 'info');
        }
        
        this.closeModal();
    }

    closeModal() {
        this.elements.aiModal.style.display = 'none';
        this.currentAIResponse = null;
        this.currentAIPrompt = null;
    }

    loadXMLContent(xmlContent, title = '') {
        try {
            this.currentXml = xmlContent;
            this.elements.xmlSource.value = xmlContent;
            
            // Convert XML to HTML for WYSIWYG editor
            const htmlContent = this.xmlRenderer.xmlToHtml(xmlContent);
            this.quill.root.innerHTML = htmlContent;
            
            // Update preview
            this.updatePreview();
            
            // Set status with document title
            const statusMessage = title ? `Loaded: ${title}` : 'XML content loaded';
            this.setStatus(statusMessage, 'success');
            
            return true;
        } catch (error) {
            console.error('Error loading XML content:', error);
            this.setStatus(`Error loading XML: ${error.message}`, 'error');
            return false;
        }
    }

    setStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = type === 'success' ? 'validation-success' : 
                                               type === 'error' ? 'validation-error' : '';
        
        // Auto-clear status after 5 seconds
        setTimeout(() => {
            if (this.elements.statusMessage.textContent === message) {
                this.elements.statusMessage.textContent = 'Ready';
                this.elements.statusMessage.className = '';
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xmlEditor = new XMLEditor();
    
    // Add some helpful console methods for development
    window.showAICapabilities = () => {
        console.log('AI Capabilities:', window.xmlEditor.aiIntegration.getCapabilities());
    };
    
    window.getPromptTemplates = () => {
        console.log('Prompt Templates:', window.xmlEditor.aiIntegration.getPromptTemplates());
    };
    
    console.log('XML WYSIWYG Editor loaded successfully!');
    console.log('Try: showAICapabilities() or getPromptTemplates() in the console');
});
