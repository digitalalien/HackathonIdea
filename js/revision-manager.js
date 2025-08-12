// Revision Comment Manager for AI-powered revision tracking
class RevisionManager {
    constructor(xmlEditor) {
        this.xmlEditor = xmlEditor;
        this.originalContent = '';
        this.currentContent = '';
        this.revisionHistory = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupTooltips();
    }

    initializeElements() {
        this.elements = {
            saveWithRevision: document.getElementById('saveWithRevision'),
            revisionModal: document.getElementById('revisionModal'),
            revisionNumber: document.getElementById('revisionNumber'),
            revisionDate: document.getElementById('revisionDate'),
            changeAnalysis: document.getElementById('changeAnalysis'),
            revisionComment: document.getElementById('revisionComment'),
            regenerateComment: document.getElementById('regenerateComment'),
            saveRevision: document.getElementById('saveRevision'),
            cancelRevision: document.getElementById('cancelRevision')
        };

        // Set default date to today
        this.elements.revisionDate.value = new Date().toISOString().split('T')[0];
    }

    setupEventListeners() {
        this.elements.saveWithRevision.addEventListener('click', () => {
            this.initiateRevisionSave();
        });

        this.elements.regenerateComment.addEventListener('click', () => {
            this.generateRevisionComment();
        });

        this.elements.saveRevision.addEventListener('click', () => {
            this.finalizeRevision();
        });

        this.elements.cancelRevision.addEventListener('click', () => {
            this.closeRevisionModal();
        });

        // Close modal when clicking outside
        this.elements.revisionModal.addEventListener('click', (e) => {
            if (e.target === this.elements.revisionModal) {
                this.closeRevisionModal();
            }
        });

        // Track content changes to maintain original vs current comparison
        this.xmlEditor.quill.on('text-change', () => {
            this.currentContent = this.getCurrentXML();
        });
    }

    setupTooltips() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'revision-tooltip';
        document.body.appendChild(this.tooltip);
    }

    setOriginalContent(content) {
        this.originalContent = content;
        this.currentContent = content;
    }

    getCurrentXML() {
        return this.xmlEditor.isXmlView ? 
            this.xmlEditor.elements.xmlSource.value : 
            this.xmlEditor.currentXml;
    }

    async initiateRevisionSave() {
        try {
            // Get current content
            this.currentContent = this.getCurrentXML();
            
            if (!this.originalContent) {
                this.xmlEditor.setStatus('No original content to compare changes against', 'warning');
                return;
            }

            // Show modal
            this.elements.revisionModal.style.display = 'block';
            
            // Auto-increment revision number
            this.autoIncrementRevision();
            
            // Analyze changes
            await this.analyzeChanges();
            
            // Generate initial revision comment
            await this.generateRevisionComment();

        } catch (error) {
            console.error('Error initiating revision save:', error);
            this.xmlEditor.setStatus(`Error preparing revision: ${error.message}`, 'error');
        }
    }

    autoIncrementRevision() {
        // Simple auto-increment logic - you can make this more sophisticated
        const currentRevision = this.elements.revisionNumber.value;
        if (currentRevision) {
            const parts = currentRevision.split('.');
            if (parts.length >= 2) {
                const minor = parseInt(parts[1]) + 1;
                this.elements.revisionNumber.value = `${parts[0]}.${minor}`;
            }
        }
    }

    async analyzeChanges() {
        try {
            this.elements.changeAnalysis.textContent = 'AI is analyzing changes...';
            
            // Use AI to perform intelligent change analysis
            const aiAnalysis = await this.performAIChangeAnalysis();
            
            if (aiAnalysis.success) {
                this.elements.changeAnalysis.textContent = aiAnalysis.analysis;
            } else {
                // Fallback to basic diff analysis
                const changes = this.detectChanges(this.originalContent, this.currentContent);
                this.displayBasicChanges(changes);
            }
            
        } catch (error) {
            console.error('Error in change analysis:', error);
            this.elements.changeAnalysis.textContent = `Error analyzing changes: ${error.message}`;
        }
    }

    async performAIChangeAnalysis() {
        try {
            const analysisPrompt = `You are an expert technical documentation analyst. Compare these two XML documents and provide a detailed analysis of what changed. Focus on meaningful changes that would be important for revision tracking in a technical manual.

ORIGINAL XML:
${this.originalContent}

CURRENT XML:
${this.currentContent}

Please analyze and provide:
1. What specific content was added, modified, or removed
2. The significance of each change
3. Impact on users/operators
4. Any safety or procedural implications

Format your response as a clear, structured analysis that explains the changes in professional technical documentation language. Be specific about what changed rather than generic.

If no significant changes are detected, state that clearly.`;

            const result = await this.xmlEditor.aiIntegration.callAI(analysisPrompt, '', {
                maxTokens: 500,
                temperature: 0.3,
                includeContext: false
            });

            if (result.success) {
                return {
                    success: true,
                    analysis: result.response.trim()
                };
            } else {
                return { success: false, error: result.error };
            }

        } catch (error) {
            console.error('AI analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    displayBasicChanges(changes) {
        let analysisText = `Basic Change Detection:\n\n`;
        
        if (changes.additions.length > 0) {
            analysisText += `➕ Additions (${changes.additions.length}):\n`;
            changes.additions.forEach(add => {
                analysisText += `  • ${add}\n`;
            });
            analysisText += `\n`;
        }
        
        if (changes.modifications.length > 0) {
            analysisText += `✏️ Modifications (${changes.modifications.length}):\n`;
            changes.modifications.forEach(mod => {
                analysisText += `  • ${mod}\n`;
            });
            analysisText += `\n`;
        }
        
        if (changes.deletions.length > 0) {
            analysisText += `➖ Deletions (${changes.deletions.length}):\n`;
            changes.deletions.forEach(del => {
                analysisText += `  • ${del}\n`;
            });
        }

        if (changes.additions.length === 0 && changes.modifications.length === 0 && changes.deletions.length === 0) {
            analysisText += `No significant changes detected.`;
        }
        
        this.elements.changeAnalysis.textContent = analysisText;
    }

    detectChanges(original, current) {
        // Simple change detection - you can make this more sophisticated
        const changes = {
            additions: [],
            modifications: [],
            deletions: []
        };

        try {
            // Parse both XML documents
            const parser = new DOMParser();
            const originalDoc = parser.parseFromString(original, 'application/xml');
            const currentDoc = parser.parseFromString(current, 'application/xml');

            // Compare elements
            const originalElements = this.extractElements(originalDoc);
            const currentElements = this.extractElements(currentDoc);

            // Find additions
            currentElements.forEach(elem => {
                if (!originalElements.some(orig => this.elementsEqual(orig, elem))) {
                    changes.additions.push(`Added: ${elem.tag} ${elem.content ? '- ' + elem.content.substring(0, 50) + '...' : ''}`);
                }
            });

            // Find deletions
            originalElements.forEach(elem => {
                if (!currentElements.some(curr => this.elementsEqual(curr, elem))) {
                    changes.deletions.push(`Removed: ${elem.tag} ${elem.content ? '- ' + elem.content.substring(0, 50) + '...' : ''}`);
                }
            });

            // Find modifications (simplified)
            currentElements.forEach(elem => {
                const originalElem = originalElements.find(orig => orig.tag === elem.tag && orig.id === elem.id);
                if (originalElem && originalElem.content !== elem.content) {
                    changes.modifications.push(`Modified: ${elem.tag} content changed`);
                }
            });

        } catch (error) {
            console.warn('Error in change detection:', error);
            changes.modifications.push('Content has been modified');
        }

        return changes;
    }

    extractElements(doc) {
        const elements = [];
        const walker = doc.createTreeWalker(
            doc.documentElement,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            elements.push({
                tag: node.tagName,
                id: node.getAttribute('id') || '',
                content: node.textContent ? node.textContent.trim() : '',
                attributes: Array.from(node.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
            });
        }

        return elements;
    }

    elementsEqual(elem1, elem2) {
        return elem1.tag === elem2.tag && 
               elem1.id === elem2.id && 
               elem1.content === elem2.content;
    }

    async generateRevisionComment() {
        try {
            this.elements.revisionComment.value = 'AI is generating revision comment...';
            this.elements.regenerateComment.disabled = true;

            const analysisText = this.elements.changeAnalysis.textContent;
            
            const prompt = `Based on the following detailed change analysis, generate a concise, professional revision comment for a technical manual. The comment should be 1-2 sentences that clearly explain what changed and why it matters to users.

Change Analysis:
${analysisText}

Requirements for the revision comment:
- Be specific about what changed (not generic)
- Use professional technical documentation language
- Keep it concise (under 150 characters if possible)
- Focus on the most significant change if multiple changes exist
- Use action words (Updated, Added, Corrected, Modified, etc.)

Examples of good revision comments:
- "Updated caution note under engine startup procedure to reflect new OEM guidance."
- "Added safety warning for high-voltage components in maintenance section."
- "Corrected torque specifications for wheel lug nuts based on manufacturer update."
- "Reorganized troubleshooting steps for improved clarity and logical flow."
- "Modified procedural steps to align with current regulatory requirements."

Generate ONLY the revision comment text (no quotes, no additional formatting):`;

            const result = await this.xmlEditor.aiIntegration.callAI(prompt, '', {
                maxTokens: 100,
                temperature: 0.2,
                includeContext: false
            });

            if (result.success) {
                let comment = result.response.trim();
                
                // Clean up the response
                comment = comment.replace(/^["']|["']$/g, ''); // Remove quotes
                comment = comment.replace(/^Revision comment:\s*/i, ''); // Remove prefixes
                comment = comment.replace(/^Comment:\s*/i, ''); // Remove prefixes
                comment = comment.split('\n')[0]; // Take first line only
                
                // Ensure it's not too long
                if (comment.length > 200) {
                    comment = comment.substring(0, 197) + '...';
                }
                
                // Ensure it ends with a period
                if (comment && !comment.endsWith('.') && !comment.endsWith('!') && !comment.endsWith('?')) {
                    comment += '.';
                }
                
                this.elements.revisionComment.value = comment || 'Updated content with improvements and corrections.';
                this.xmlEditor.setStatus('AI revision comment generated', 'success');
            } else {
                // Fallback: use change analysis to generate a basic comment
                const fallbackComment = this.generateFallbackComment(analysisText);
                this.elements.revisionComment.value = fallbackComment;
                this.xmlEditor.setStatus('Using fallback revision comment generation', 'warning');
            }

        } catch (error) {
            console.error('Error generating revision comment:', error);
            const fallbackComment = this.generateFallbackComment(this.elements.changeAnalysis.textContent);
            this.elements.revisionComment.value = fallbackComment;
            this.xmlEditor.setStatus('Error generating revision comment, using fallback', 'warning');
        } finally {
            this.elements.regenerateComment.disabled = false;
        }
    }

    generateFallbackComment(analysisText) {
        // Analyze the text to determine what kind of change was made
        const lowerAnalysis = analysisText.toLowerCase();
        
        if (lowerAnalysis.includes('added') && lowerAnalysis.includes('safety')) {
            return 'Added safety warnings and procedural guidance.';
        } else if (lowerAnalysis.includes('added')) {
            return 'Added new content to enhance documentation completeness.';
        } else if (lowerAnalysis.includes('modified') || lowerAnalysis.includes('updated')) {
            return 'Updated content to reflect current operational requirements.';
        } else if (lowerAnalysis.includes('removed') || lowerAnalysis.includes('deleted')) {
            return 'Removed obsolete content no longer applicable.';
        } else if (lowerAnalysis.includes('corrected') || lowerAnalysis.includes('fixed')) {
            return 'Corrected technical information for accuracy.';
        } else if (lowerAnalysis.includes('reorganized') || lowerAnalysis.includes('restructured')) {
            return 'Reorganized content for improved clarity and usability.';
        } else {
            return 'Updated content with improvements and corrections.';
        }
    }

    async finalizeRevision() {
        try {
            const revisionNumber = this.elements.revisionNumber.value.trim();
            const revisionDate = this.elements.revisionDate.value;
            const revisionComment = this.elements.revisionComment.value.trim();

            if (!revisionNumber || !revisionDate || !revisionComment) {
                this.xmlEditor.setStatus('Please fill in all revision fields', 'error');
                return;
            }

            // Create revision XML
            const revisionXML = this.createRevisionXML(revisionNumber, revisionDate, revisionComment);
            
            // Insert revision into current XML
            const updatedXML = this.insertRevisionIntoXML(this.currentContent, revisionXML);
            
            // Update the editor with the new XML
            this.xmlEditor.loadXMLContent(updatedXML, 'Document with Revision');
            
            // Store revision in history
            this.revisionHistory.push({
                number: revisionNumber,
                date: revisionDate,
                comment: revisionComment,
                timestamp: new Date().toISOString()
            });

            // Update original content for next comparison
            this.setOriginalContent(updatedXML);
            
            this.closeRevisionModal();
            this.xmlEditor.setStatus(`Revision ${revisionNumber} added successfully`, 'success');

        } catch (error) {
            console.error('Error finalizing revision:', error);
            this.xmlEditor.setStatus(`Error saving revision: ${error.message}`, 'error');
        }
    }

    createRevisionXML(number, date, comment) {
        return `  <Revision>
    <RevisionNumber>${number}</RevisionNumber>
    <RevisionDate>${date}</RevisionDate>
    <RevisionComment>${this.escapeXML(comment)}</RevisionComment>
  </Revision>`;
    }

    insertRevisionIntoXML(xmlContent, revisionXML) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlContent, 'application/xml');
            
            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML parsing error');
            }

            const root = doc.documentElement;
            
            // Look for existing Revisions section
            let revisionsElement = doc.querySelector('Revisions');
            
            if (!revisionsElement) {
                // Create new Revisions section
                revisionsElement = doc.createElement('Revisions');
                
                // Insert after root opening tag but before main content
                if (root.firstElementChild) {
                    root.insertBefore(revisionsElement, root.firstElementChild);
                } else {
                    root.appendChild(revisionsElement);
                }
            }

            // Create revision element
            const revisionElement = doc.createElement('Revision');
            
            // Parse and add revision content
            const revisionDoc = parser.parseFromString(`<root>${revisionXML}</root>`, 'application/xml');
            const revisionNode = revisionDoc.querySelector('Revision');
            
            if (revisionNode) {
                // Import the revision node
                const importedRevision = doc.importNode(revisionNode, true);
                revisionsElement.appendChild(importedRevision);
            }

            // Serialize back to string
            const serializer = new XMLSerializer();
            let result = serializer.serializeToString(doc);
            
            // Format nicely
            result = this.formatXML(result);
            
            return result;

        } catch (error) {
            console.warn('Error inserting revision XML, using fallback method:', error);
            
            // Fallback: simple string insertion
            const xmlDeclarationMatch = xmlContent.match(/<\?xml[^>]*\?>\s*/);
            const declarationEnd = xmlDeclarationMatch ? xmlDeclarationMatch[0].length : 0;
            
            const rootMatch = xmlContent.substring(declarationEnd).match(/<[^>]+>/);
            if (rootMatch) {
                const insertPosition = declarationEnd + rootMatch.index + rootMatch[0].length;
                
                const revisionsSection = xmlContent.includes('<Revisions>') ? 
                    '' : '\n  <Revisions>\n  </Revisions>';
                
                const before = xmlContent.substring(0, insertPosition);
                const after = xmlContent.substring(insertPosition);
                
                if (revisionsSection) {
                    return before + revisionsSection.replace('</Revisions>', revisionXML + '\n  </Revisions>') + after;
                } else {
                    return xmlContent.replace('</Revisions>', revisionXML + '\n  </Revisions>');
                }
            }
            
            return xmlContent + '\n<!-- Revision: ' + this.elements.revisionComment.value + ' -->';
        }
    }

    formatXML(xml) {
        // Simple XML formatting
        return xml.replace(/></g, '>\n<').replace(/^\s*\n/gm, '');
    }

    escapeXML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    closeRevisionModal() {
        this.elements.revisionModal.style.display = 'none';
        
        // Reset form
        this.elements.revisionComment.value = '';
        this.elements.changeAnalysis.textContent = '';
    }

    // Method to highlight revision elements in the preview
    highlightRevisions(previewElement) {
        const revisionElements = previewElement.querySelectorAll('revision, Revision');
        
        revisionElements.forEach(element => {
            element.classList.add('revision-element');
            
            // Add hover tooltip
            element.addEventListener('mouseenter', (e) => {
                this.showRevisionTooltip(e, element);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideRevisionTooltip();
            });
        });
    }

    showRevisionTooltip(event, element) {
        const revisionNumber = element.querySelector('RevisionNumber, revisionnumber')?.textContent || 'Unknown';
        const revisionDate = element.querySelector('RevisionDate, revisiondate')?.textContent || 'Unknown';
        const revisionComment = element.querySelector('RevisionComment, revisioncomment')?.textContent || 'No comment';
        
        this.tooltip.innerHTML = `
            <strong>Revision ${revisionNumber}</strong><br>
            <em>${revisionDate}</em><br>
            ${revisionComment}
        `;
        
        this.tooltip.style.left = event.pageX + 10 + 'px';
        this.tooltip.style.top = event.pageY - 10 + 'px';
        this.tooltip.classList.add('visible');
    }

    hideRevisionTooltip() {
        this.tooltip.classList.remove('visible');
    }

    // Get revision history
    getRevisionHistory() {
        return this.revisionHistory;
    }
}

// Export for use in main application
window.RevisionManager = RevisionManager;
