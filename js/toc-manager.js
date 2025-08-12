// Table of Contents Module for XML Document Management
class TOCManager {
    constructor(xmlEditor) {
        this.xmlEditor = xmlEditor;
        this.xmlDocuments = new Map();
        this.currentDocument = null;
        this.zipFile = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.elements = {
            loadSamples: document.getElementById('loadSamples'),
            refreshToc: document.getElementById('refreshToc'),
            tocContent: document.getElementById('tocContent'),
            currentDocument: document.getElementById('currentDocument')
        };
    }

    setupEventListeners() {
        this.elements.loadSamples.addEventListener('click', () => {
            this.loadSampleXMLs();
        });

        this.elements.refreshToc.addEventListener('click', () => {
            this.refreshTOC();
        });
    }

    async loadSampleXMLs() {
        try {
            this.setStatus('Loading XML samples...');
            
            // First, try to load from the extracted folder
            const xmlFiles = await this.loadFromExtractedFolder();
            
            if (xmlFiles.length === 0) {
                // If no extracted files, try to load from ZIP
                await this.loadFromZipFile();
            }
            
            this.buildTOC();
            this.setStatus('XML samples loaded successfully');
            
        } catch (error) {
            console.error('Error loading XML samples:', error);
            this.setStatus('Error loading XML samples: ' + error.message);
        }
    }

    async loadFromExtractedFolder() {
        try {
            const xmlFiles = [
                '3f4cb412-7589-4e8c-9fd8-d047edcac704.xml',
                '75dc85d0-5719-4518-96c3-7f42effc1a5d.xml',
                'd727acbd-1538-40cd-a336-9a70e22c4772.xml',
                'index_1d4a063e-6b1f-48bf-971e-a474537e7569.xml'
            ];

            const loadPromises = xmlFiles.map(async (filename) => {
                try {
                    const response = await fetch(`xml-samples/${filename}`);
                    if (response.ok) {
                        const content = await response.text();
                        const docInfo = this.parseXMLDocument(content, filename);
                        this.xmlDocuments.set(filename, docInfo);
                        return filename;
                    }
                } catch (error) {
                    console.warn(`Could not load ${filename}:`, error);
                }
                return null;
            });

            const results = await Promise.all(loadPromises);
            return results.filter(result => result !== null);
            
        } catch (error) {
            console.warn('Could not load from extracted folder:', error);
            return [];
        }
    }

    async loadFromZipFile() {
        // This would require a ZIP handling library for the browser
        // For now, we'll show a message to extract the ZIP
        throw new Error('Please extract the ZIP file first using the provided PowerShell command');
    }

    parseXMLDocument(xmlContent, filename) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlContent, 'application/xml');
            
            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML parsing error: ' + parserError.textContent);
            }

            const root = doc.documentElement;
            const docInfo = {
                filename: filename,
                content: xmlContent,
                type: root.tagName,
                attributes: {},
                title: '',
                references: []
            };

            // Extract attributes
            for (let attr of root.attributes) {
                docInfo.attributes[attr.name] = attr.value;
            }

            // Determine document type and extract relevant information
            switch (root.tagName) {
                case 'product':
                    docInfo.type = 'index';
                    docInfo.title = this.extractTextContent(doc.querySelector('title')) || 'Product Index';
                    docInfo.manualCode = docInfo.attributes.manualCode || '';
                    // Extract topic references
                    const topicRefs = doc.querySelectorAll('topicRef');
                    docInfo.references = Array.from(topicRefs).map(ref => ref.getAttribute('ref')).filter(Boolean);
                    break;

                case 'topic':
                    docInfo.type = 'topic';
                    docInfo.title = this.extractTextContent(doc.querySelector('title')) || 'Untitled Topic';
                    docInfo.chapterType = docInfo.attributes.type || 'chapter';
                    // Extract section references
                    const sectionRefs = doc.querySelectorAll('sectionRef');
                    docInfo.references = Array.from(sectionRefs).map(ref => ref.getAttribute('ref')).filter(Boolean);
                    break;

                case 'section':
                    docInfo.type = 'section';
                    const firstPara = doc.querySelector('para');
                    docInfo.title = this.extractTextContent(firstPara) || 'Untitled Section';
                    docInfo.sectionType = docInfo.attributes.type || 'definition';
                    break;

                default:
                    docInfo.type = 'unknown';
                    docInfo.title = `${root.tagName} Document`;
            }

            return docInfo;

        } catch (error) {
            console.error(`Error parsing ${filename}:`, error);
            return {
                filename: filename,
                content: xmlContent,
                type: 'error',
                title: `Error: ${filename}`,
                error: error.message,
                references: []
            };
        }
    }

    extractTextContent(element) {
        if (!element) return '';
        return element.textContent.trim();
    }

    buildTOC() {
        const tocContent = this.elements.tocContent;
        tocContent.innerHTML = '';

        if (this.xmlDocuments.size === 0) {
            tocContent.innerHTML = '<p class="toc-empty">No XML documents loaded</p>';
            return;
        }

        // Sort documents: index first, then topics, then sections
        const sortedDocs = Array.from(this.xmlDocuments.values()).sort((a, b) => {
            const typeOrder = { index: 0, topic: 1, section: 2, error: 3, unknown: 4 };
            const aOrder = typeOrder[a.type] || 5;
            const bOrder = typeOrder[b.type] || 5;
            
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            
            return a.title.localeCompare(b.title);
        });

        sortedDocs.forEach(doc => {
            const tocItem = this.createTOCItem(doc);
            tocContent.appendChild(tocItem);
        });
    }

    createTOCItem(doc) {
        const item = document.createElement('div');
        item.className = 'toc-item';
        item.dataset.filename = doc.filename;

        const typeSpan = document.createElement('span');
        typeSpan.className = `toc-item-type ${doc.type}`;
        typeSpan.textContent = doc.type;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'toc-item-title';
        titleSpan.textContent = doc.title;

        item.appendChild(typeSpan);
        item.appendChild(titleSpan);

        // Add additional information based on document type
        if (doc.type === 'index' && doc.manualCode) {
            const codeSpan = document.createElement('div');
            codeSpan.className = 'toc-item-refs';
            codeSpan.textContent = `Manual: ${doc.manualCode}`;
            item.appendChild(codeSpan);
        }

        if (doc.references && doc.references.length > 0) {
            const refsSpan = document.createElement('div');
            refsSpan.className = 'toc-item-refs';
            refsSpan.textContent = `References: ${doc.references.length} file(s)`;
            item.appendChild(refsSpan);
        }

        if (doc.error) {
            const errorSpan = document.createElement('div');
            errorSpan.className = 'toc-item-refs';
            errorSpan.style.color = 'var(--danger-color)';
            errorSpan.textContent = `Error: ${doc.error}`;
            item.appendChild(errorSpan);
        }

        // Add click handler
        item.addEventListener('click', () => {
            this.loadDocument(doc.filename);
        });

        return item;
    }

    loadDocument(filename) {
        const doc = this.xmlDocuments.get(filename);
        if (!doc) {
            this.setStatus(`Document ${filename} not found`);
            return;
        }

        try {
            // Update active state in TOC
            document.querySelectorAll('.toc-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeItem = document.querySelector(`[data-filename="${filename}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }

            // Load the document into the editor
            this.xmlEditor.loadXMLContent(doc.content, doc.title);
            this.currentDocument = doc;
            
            // Update document info
            this.elements.currentDocument.textContent = `${doc.title} (${doc.filename})`;
            
            this.setStatus(`Loaded: ${doc.title}`);

        } catch (error) {
            console.error('Error loading document:', error);
            this.setStatus(`Error loading document: ${error.message}`);
        }
    }

    refreshTOC() {
        this.xmlDocuments.clear();
        this.currentDocument = null;
        this.elements.currentDocument.textContent = 'No document loaded';
        this.buildTOC();
        this.setStatus('Table of contents refreshed');
    }

    setStatus(message) {
        if (this.xmlEditor && this.xmlEditor.setStatus) {
            this.xmlEditor.setStatus(message);
        } else {
            console.log('TOC Status:', message);
        }
    }

    // Get document information
    getDocumentInfo(filename) {
        return this.xmlDocuments.get(filename);
    }

    // Get all documents of a specific type
    getDocumentsByType(type) {
        return Array.from(this.xmlDocuments.values()).filter(doc => doc.type === type);
    }

    // Get referenced documents
    getReferencedDocuments(filename) {
        const doc = this.xmlDocuments.get(filename);
        if (!doc || !doc.references) return [];
        
        return doc.references.map(ref => this.xmlDocuments.get(ref)).filter(Boolean);
    }

    // Find documents that reference the given filename
    getReferencingDocuments(filename) {
        return Array.from(this.xmlDocuments.values()).filter(doc => 
            doc.references && doc.references.includes(filename)
        );
    }
}

// Export for use in main application
window.TOCManager = TOCManager;
