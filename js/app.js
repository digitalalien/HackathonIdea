// Main Application Logic

class XMLEditor {
    constructor() {
        this.xmlRenderer = new XMLRenderer();
        this.aiIntegration = new AIIntegration();
        this.isXmlView = true; // Default to XML view mode
        this.currentXml = '';

        this.initializeEditor();
        this.setupEventListeners();

        // Initialize TOC Manager
        this.tocManager = new TOCManager(this);

        // Initialize Revision Manager
        this.revisionManager = new RevisionManager(this);

        this.loadSampleContent();
        
        // Set initial view state to XML mode
        this.setInitialViewState();
    }

    initializeEditor() {
        // Register custom Quill formats for XML elements before initializing
        const Block = Quill.import('blots/block');

        // Custom block format for revision comments
        class RevisionCommentBlot extends Block {
            static create(value) {
                let node = super.create();
                node.setAttribute('class', 'revision-comment');
                node.setAttribute('data-xml-element', 'revisionComment');
                if (value && typeof value === 'object') {
                    Object.keys(value).forEach(key => {
                        if (key !== 'class' && key !== 'data-xml-element') {
                            node.setAttribute(key, value[key]);
                        }
                    });
                }
                return node;
            }

            static formats(node) {
                const attributes = {};
                Array.from(node.attributes).forEach(attr => {
                    if (attr.name !== 'class' && attr.name !== 'data-xml-element') {
                        attributes[attr.name] = attr.value;
                    }
                });
                return attributes;
            }
        }
        RevisionCommentBlot.blotName = 'revision-comment';
        RevisionCommentBlot.tagName = 'div';
        RevisionCommentBlot.className = 'revision-comment';

        // Register the custom format
        Quill.register(RevisionCommentBlot);

        // Initialize Quill WYSIWYG editor
        this.quill = new Quill('#editor', {
            theme: 'snow',
            formats: [
                'header', 'bold', 'italic', 'underline', 'strike',
                'blockquote', 'list', 'bullet', 'indent',
                'link', 'image', 'code-block',
                'revision-comment' // Add custom format
            ],
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
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
            togglePreview: document.getElementById('togglePreview'),
            applyAIResponse: document.getElementById('applyAIResponse'),
            closeModal: document.getElementById('closeModal'),
            wysiwyg: document.getElementById('editor')
        };
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

        // Modal controls
        this.elements.closeModal.addEventListener('click', () => {
            this.closeModal();
        });

        this.elements.applyAIResponse.addEventListener('click', () => {
            console.log('ApplyAIResponse event listener clicked');
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

        // Convert to HTML for WYSIWYG editor
        const htmlContent = this.xmlRenderer.xmlToHtml(sampleXml);
        const delta = this.quill.clipboard.convert(htmlContent);
        this.quill.setContents(delta);

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
            // We're in WYSIWYG mode, so convert editor content to XML
            const htmlContent = this.quill.root.innerHTML;
            this.currentXml = this.xmlRenderer.htmlToXml(htmlContent);
            this.elements.xmlSource.value = this.currentXml;
            this.updatePreview();
        }
    }

    updateEditorFromXml() {
        this.currentXml = this.elements.xmlSource.value;
        
        if (!this.isXmlView) {
            // Only update the WYSIWYG editor if we're in WYSIWYG mode
            const htmlContent = this.xmlRenderer.xmlToHtml(this.currentXml);
            const delta = this.quill.clipboard.convert(htmlContent);
            this.quill.setContents(delta);
        }
        
        // Always update the preview regardless of current view mode
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
            this.quill.setContents([]);
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
            const delta = this.quill.clipboard.convert(htmlContent);
            this.quill.setContents(delta);

            this.updatePreview();
            this.setStatus('XML imported successfully', 'success');
        } catch (error) {
            this.setStatus(`Import error: ${error.message}`, 'error');
        }
    }
    // ...existing code...

    applyAIResponse() {
        console.log('Applying AI response...');
        console.log('Current AI Response:', this.currentAIResponse);
        console.log('Window xmlEditor currentAIResponse:', window.xmlEditor.currentAIResponse);

        // Pull from window.xmlEditor.currentAIResponse instead of this.currentAIResponse
        const aiResponse = window.xmlEditor.currentAIResponse || this.currentAIResponse;

        if (!aiResponse) {
            console.log('No AI response available');
            return;
        }

        try {
            // The AI response should already be the XML content we want to apply
            const xmlContent = aiResponse;
            console.log('XML Content to apply:', xmlContent);

            // Update the current XML content
            this.currentXml = xmlContent;
            this.elements.xmlSource.value = xmlContent;

            // Convert XML to HTML for WYSIWYG editor
            const htmlContent = this.xmlRenderer.xmlToHtml(xmlContent);
            console.log('Converted HTML content:', htmlContent);

            // Clear the editor first, then set new content
            this.quill.setText(''); // Clear existing content

            // Convert HTML to Delta and set content
            const delta = this.quill.clipboard.convert(htmlContent);
            console.log('Delta object:', delta);

            this.quill.setContents(delta, 'api'); // Use 'api' source to prevent triggering change events

            // Force a refresh of the editor
            this.quill.update();

            // Update the preview
            this.updatePreview();

            // Update current content for revision tracking without changing the baseline
            if (this.revisionManager) {
                this.revisionManager.updateCurrentContent(xmlContent);
            }

            // Stay in current view mode - don't force switch to WYSIWYG
            this.setStatus('AI response applied successfully - XML content updated', 'success');

            console.log("Closing Modal");
            this.closeModal();

        } catch (error) {
            console.error('Error applying AI response:', error);
            this.setStatus(`Error applying AI response: ${error.message}`, 'error');
        }
    }

    // ...existing code...

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
            const delta = this.quill.clipboard.convert(htmlContent);
            this.quill.setContents(delta);

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

    setInitialViewState() {
        // Set up initial XML view state
        this.elements.wysiwyg.style.display = 'none';
        this.elements.xmlSource.style.display = 'block';
        this.elements.toggleView.textContent = 'Switch to WYSIWYG View';
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
        const newHtml = currentContent + '<p>Test change for revision</p>';
        const delta = window.xmlEditor.quill.clipboard.convert(newHtml);
        window.xmlEditor.quill.setContents(delta);
        window.xmlEditor.updateXmlFromEditor();
        console.log('Made test change. Click "Save with AI Revision" to test the revision system.');
    };

    console.log('XML WYSIWYG Editor loaded successfully!');
    console.log('Try: showAICapabilities(), getPromptTemplates(), or testRevision() in the console');
    console.log('💾 New: Save with AI Revision button generates automatic revision comments!');
});
