// Main Application Logic
class XMLEditor {
    constructor() {
        this.xmlRenderer = new XMLRenderer();
        this.aiIntegration = new AIIntegration();
        this.isXmlView = true; // Default to XML view
        this.currentXml = '';

        this.initializeEditor();
        this.setupEventListeners();

        // Initialize TOC Manager
        this.tocManager = new TOCManager(this);

        // Initialize Revision Manager
        this.revisionManager = new RevisionManager(this);

        this.loadSampleContent();
    }

    initializeEditor() {
        // Initialize Monaco Editor with XML syntax highlighting
        this.monacoEditor = null;
        
        // We'll initialize Monaco after the page loads
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            this.monacoEditor = monaco.editor.create(document.getElementById('editor'), {
                value: '',
                language: 'xml',
                theme: 'vs',
                automaticLayout: true,
                wordWrap: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderWhitespace: 'boundary',
                showFoldingControls: 'always'
            });

            // Set up change listener for Monaco
            this.monacoEditor.onDidChangeModelContent(() => {
                this.updateXmlFromEditor();
            });
        });

        // Get DOM elements
        this.elements = {
            toggleView: document.getElementById('toggleView'),
            validateXml: document.getElementById('validateXml'),
            clearEditor: document.getElementById('clearEditor'),
            loadRealSample: document.getElementById('loadRealSample'),
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
            togglePreview: document.getElementById('togglePreview'),
            applyAIResponse: document.getElementById('applyAIResponse'),
            closeModal: document.getElementById('closeModal'),
            wysiwyg: document.getElementById('editor')
        };

        // Set initial UI state to XML view if needed
        if (this.isXmlView && this.elements) {
            this.elements.wysiwyg.style.display = 'none';
            this.elements.xmlSource.style.display = 'block';
            this.elements.toggleView.textContent = 'Switch to Visual View';
        }
    }

    setupEventListeners() {
        // Close modal when clicking outside
        this.elements.aiModal.addEventListener('click', (e) => {
            if (e.target === this.elements.aiModal) {
                this.closeModal();
            }
        });

        // Close modal with X button (span.close)
        const closeSpans = document.querySelectorAll('.modal .close');
        closeSpans.forEach(span => {
            span.addEventListener('click', () => {
                this.closeModal();
            });
        });
        
        // XML source changes
        this.elements.xmlSource.addEventListener('input', () => {
            this.updateEditorFromXml();
        });

        // Toggle between Visual and XML view
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

        // Load real sample
        this.elements.loadRealSample.addEventListener('click', () => {
            this.loadRealSample();
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

        // Toggle preview panel
        this.elements.togglePreview.addEventListener('click', () => {
            this.togglePreviewPanel();
        });
    }

    loadSampleContent() {
        const sampleXml = this.xmlRenderer.createSampleXML();
        this.currentXml = sampleXml;
        this.elements.xmlSource.value = sampleXml;

        // Set original content for revision tracking
        if (this.revisionManager) {
            this.revisionManager.setOriginalContent(sampleXml);
        }

        // Load content into Monaco editor if available
        if (this.monacoEditor) {
            this.monacoEditor.setValue(sampleXml);
        }
        
        // Update preview
        this.updatePreview();
        this.setStatus('Sample content loaded');
    }

    // Load a real XML sample from the samples folder
    async loadRealSample() {
        try {
            const response = await fetch('xml-samples/75dc85d0-5719-4518-96c3-7f42effc1a5d.xml');
            const xmlContent = await response.text();
            
            this.currentXml = xmlContent;
            this.elements.xmlSource.value = xmlContent;

            // Set original content for revision tracking
            if (this.revisionManager) {
                this.revisionManager.setOriginalContent(xmlContent);
            }

            // Load content into Monaco editor if available
            if (this.monacoEditor) {
                this.monacoEditor.setValue(xmlContent);
            }
            
            // Update preview
            this.updatePreview();
            this.setStatus('Real XML sample loaded', 'success');
        } catch (error) {
            console.error('Error loading sample:', error);
            this.setStatus('Failed to load XML sample', 'error');
        }
    }

    toggleView() {
        this.isXmlView = !this.isXmlView;

        if (this.isXmlView) {
            // Switch to XML view (text area)
            this.elements.wysiwyg.style.display = 'none';
            this.elements.xmlSource.style.display = 'block';
            this.elements.toggleView.textContent = 'Switch to Visual View';
            this.updateXmlFromEditor();
        } else {
            // Switch to Visual view (Monaco editor)
            this.elements.wysiwyg.style.display = 'block';
            this.elements.xmlSource.style.display = 'none';
            this.elements.toggleView.textContent = 'Switch to XML View';
            this.updateEditorFromXml();
        }
    }

    updateXmlFromEditor() {
        if (!this.isXmlView && this.monacoEditor) {
            // In visual view, get content from Monaco editor
            this.currentXml = this.monacoEditor.getValue();
            this.elements.xmlSource.value = this.currentXml;
            this.updatePreview();
        }
    }

    updateEditorFromXml() {
        if (this.isXmlView) {
            // Update current XML from the text area
            this.currentXml = this.elements.xmlSource.value;
        }
        
        // Update Monaco editor with current XML content
        if (this.monacoEditor) {
            this.monacoEditor.setValue(this.currentXml);
        }
        this.updatePreview();
    }

    updatePreview() {
        const xmlToPreview = this.isXmlView ? this.elements.xmlSource.value : this.currentXml;
        this.xmlRenderer.renderPreview(xmlToPreview, this.elements.xmlPreview);

        // Highlight revision comments if revision manager is available
        if (this.revisionManager) {
            this.revisionManager.highlightRevisions(this.elements.xmlPreview);
        }
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
            if (this.monacoEditor) {
                this.monacoEditor.setValue('');
            }
            this.elements.xmlSource.value = '';
            this.currentXml = '';
            this.updatePreview();
            this.setStatus('Editor cleared');
        }
    }

    togglePreviewPanel() {
        const editorContainer = document.querySelector('.editor-container');
        const previewPanel = document.querySelector('.preview-panel');
        const toggleIcon = document.querySelector('.toggle-icon');

        if (previewPanel.classList.contains('collapsed')) {
            // Expand preview
            previewPanel.classList.remove('collapsed');
            editorContainer.classList.remove('preview-collapsed');
            toggleIcon.textContent = '◀';
            this.setStatus('XML Preview expanded', 'success');
        } else {
            // Collapse preview
            previewPanel.classList.add('collapsed');
            editorContainer.classList.add('preview-collapsed');
            toggleIcon.textContent = '▶';
            this.setStatus('XML Preview collapsed - more space for editing', 'info');
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
            if (!xmlContent) {
                this.setStatus('No XML content to load', 'error');
                return false;
            }

            this.currentXml = xmlContent;
            this.elements.xmlSource.value = xmlContent;

            // Convert XML to HTML for WYSIWYG editor
            const htmlContent = this.xmlRenderer.xmlToHtml(xmlContent);
            this.quill.root.innerHTML = htmlContent;
            
            // Update preview
            this.updatePreview();

            // Set original content for revision tracking - after content is loaded
            if (this.revisionManager) {
                this.revisionManager.setOriginalContent(xmlContent);

                // Try multiple approaches to ensure revision refresh works
                this.refreshRevisionsWithRetry();
            }

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

    refreshRevisionsWithRetry() {
        let attempts = 0;
        const maxAttempts = 5;

        const tryRefresh = () => {
            attempts++;
            console.log(`Revision refresh attempt ${attempts}/${maxAttempts}`);

            // Check if content is actually available
            const currentContent = this.revisionManager.getCurrentXML();
            if (currentContent && currentContent.trim().length > 0) {
                console.log('Content available, refreshing revisions');
                this.revisionManager.refreshRevisionsList();
            } else if (attempts < maxAttempts) {
                console.log('Content not ready, retrying in 100ms');
                setTimeout(tryRefresh, 100);
            } else {
                console.log('Max attempts reached, giving up');
            }
        };

        // Start immediately, then retry if needed
        tryRefresh();
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

    window.testRevision = () => {
        console.log('Testing revision functionality...');
        // Make a small change to test
        const currentContent = window.xmlEditor.quill.root.innerHTML;
        window.xmlEditor.quill.root.innerHTML = currentContent + '<p>Test change for revision</p>';
        window.xmlEditor.updateXmlFromEditor();
        console.log('Made test change. Click "Save with AI Revision" to test the revision system.');
    };

    console.log('XML WYSIWYG Editor loaded successfully!');
    console.log('Try: showAICapabilities(), getPromptTemplates(), or testRevision() in the console');
    console.log('💾 New: Save with AI Revision button generates automatic revision comments!');
});
