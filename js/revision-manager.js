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
            cancelRevision: document.getElementById('cancelRevision'),
            revisionCommentsList: document.getElementById('revisionCommentsList'),
            refreshRevisions: document.getElementById('refreshRevisions'),
            exportRevisions: document.getElementById('exportRevisions')
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

        // Revision panel event listeners
        this.elements.refreshRevisions.addEventListener('click', () => {
            console.log('Manual refresh triggered by user');
            this.refreshRevisionsList();
        });

        this.elements.exportRevisions.addEventListener('click', () => {
            this.exportRevisionsList();
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
        // Get the most current XML content
        if (this.xmlEditor.isXmlView) {
            return this.xmlEditor.elements.xmlSource.value || '';
        } else {
            return this.xmlEditor.currentXml || '';
        }
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
           //I need to set the context to the original and current XML content
           const context = `Original XML:\n${this.originalContent}\n\nCurrent XML:\n${this.currentContent}`;

            const response = await fetch('http://localhost:3001/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: 'xml_change_analysis',
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = response.response

            if (data.success) {
                return {
                    success: true,
                    analysis: data.response.trim()
                };
            } else {
                return { success: false, error: data.error };
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
           //I need to set the context to the original and current XML content
           const context = `Original XML:\n${this.originalContent}\n\nCurrent XML:\n${this.currentContent}`;

            const response = await fetch('http://localhost:3001/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: 'xml_change_analysis',
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                let comment = data.response.trim();

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
        // Look for revision elements in the formatted XML
        const revisionElements = previewElement.querySelectorAll('revision, revisioncomment, RevisionComment');
        
        revisionElements.forEach((element, index) => {
            // Add CSS class for styling
            element.classList.add('revision-element');
            
            // Make revision elements clickable
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove previous highlights
                previewElement.querySelectorAll('.revision-highlight').forEach(el => {
                    el.classList.remove('revision-highlight');
                });
                
                // Highlight this revision
                element.classList.add('revision-highlight');
            });
            
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
        // Extract revision info from the XML element
        const revisionNumber = element.getAttribute('id') || element.querySelector('*[id]')?.getAttribute('id') || 'Unknown';
        const revisionDate = element.getAttribute('date') || element.querySelector('*[date]')?.getAttribute('date') || 'Unknown';
        const revisionComment = element.textContent?.trim() || 'No comment';
        
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

    // Parse and display revision comments from XML
    refreshRevisionsList() {
        try {
            console.log('=== Revision Refresh Debug ===');
            console.log('isXmlView:', this.xmlEditor.isXmlView);
            console.log('xmlSource.value length:', this.xmlEditor.elements.xmlSource.value?.length || 0);
            console.log('currentXml length:', this.xmlEditor.currentXml?.length || 0);
            
            const xmlContent = this.getCurrentXML();
            console.log('Got XML content length:', xmlContent?.length || 0);
            console.log('XML content preview:', xmlContent?.substring(0, 200) + '...');
            
            if (!xmlContent || xmlContent.trim().length === 0) {
                console.log('No XML content available for revision parsing');
                this.displayRevisionsList([]);
                return;
            }
            
            const revisions = this.parseRevisionsFromXML(xmlContent);
            console.log('Found revisions:', revisions.length, revisions);
            this.displayRevisionsList(revisions);
        } catch (error) {
            console.error('Error refreshing revisions list:', error);
            this.xmlEditor.setStatus('Error parsing revisions from XML', 'error');
        }
    }

    parseRevisionsFromXML(xmlContent) {
        const revisions = [];
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlContent, 'application/xml');
            
            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                console.warn('XML parsing error:', parserError.textContent);
                return [];
            }

            // Look for structured revision elements (Revision, RevisionNumber, etc.)
            const revisionElements = doc.querySelectorAll('Revision, revision');
            revisionElements.forEach((revElement, index) => {
                const number = this.getElementText(revElement, 'RevisionNumber, revisionnumber') || `Rev-${index + 1}`;
                const date = this.getElementText(revElement, 'RevisionDate, revisiondate') || 'Unknown';
                const comment = this.getElementText(revElement, 'RevisionComment, revisioncomment') || 'No comment';
                
                revisions.push({
                    type: 'structured',
                    number,
                    date,
                    comment,
                    element: revElement
                });
            });

            // Look for revision comment elements (revisionComment, etc.)
            const commentElements = doc.querySelectorAll('revisionComment, revisioncomment, RevisionComment');
            commentElements.forEach((commentElement, index) => {
                const id = commentElement.getAttribute('id') || `comment-${index + 1}`;
                const comment = commentElement.textContent?.trim() || 'No comment';
                
                // Try to extract date/number from id or attributes
                const number = commentElement.getAttribute('revision') || 
                              commentElement.getAttribute('number') || 
                              id;
                
                revisions.push({
                    type: 'comment',
                    number,
                    date: 'From document',
                    comment,
                    element: commentElement,
                    id
                });
            });

            // Sort revisions by number (attempt to parse version numbers)
            revisions.sort((a, b) => {
                const parseVersion = (version) => {
                    const parts = version.toString().match(/(\d+)\.?(\d*)/);
                    if (parts) {
                        return parseFloat(parts[1] + '.' + (parts[2] || '0'));
                    }
                    return 0;
                };
                
                return parseVersion(b.number) - parseVersion(a.number);
            });

        } catch (error) {
            console.error('Error parsing XML for revisions:', error);
        }
        
        return revisions;
    }

    getElementText(parent, selectors) {
        const element = parent.querySelector(selectors);
        return element ? element.textContent?.trim() : null;
    }

    displayRevisionsList(revisions) {
        const listContainer = this.elements.revisionCommentsList;
        
        if (revisions.length === 0) {
            listContainer.innerHTML = '<p class="no-revisions">No revision comments found in current document</p>';
            // Reset the panel title when no revisions
            this.updatePanelTitle(0);
            return;
        }

        // Update the panel title with count
        this.updatePanelTitle(revisions.length);

        // Generate revision items HTML
        const revisionsHTML = revisions.map((revision, index) => {
            const typeIcon = revision.type === 'structured' ? '📋' : '💬';
            const dateDisplay = this.formatRevisionDate(revision.date);
            
            return `
                <div class="revision-item" data-index="${index}" data-type="${revision.type}">
                    <div class="revision-header">
                        <span class="revision-number">${typeIcon} ${revision.number}</span>
                        <span class="revision-date">${dateDisplay}</span>
                    </div>
                    <p class="revision-comment">${this.truncateComment(revision.comment, 150)}</p>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = revisionsHTML;

        // Add click handlers for revision items
        listContainer.querySelectorAll('.revision-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectRevisionItem(item, revisions[index]);
            });
        });

        this.xmlEditor.setStatus(`Found ${revisions.length} revision comment${revisions.length > 1 ? 's' : ''}`, 'success');
    }

    updatePanelTitle(count) {
        const panelTitle = document.querySelector('.revision-panel h3');
        if (panelTitle) {
            if (count > 0) {
                panelTitle.innerHTML = `Revision Comments <span class="revision-count">${count}</span>`;
            } else {
                panelTitle.innerHTML = 'Revision Comments';
            }
        }
    }

    formatRevisionDate(dateStr) {
        if (dateStr === 'Unknown' || dateStr === 'From document') {
            return dateStr;
        }
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            return date.toLocaleDateString();
        } catch (error) {
            return dateStr;
        }
    }

    truncateComment(comment, maxLength) {
        if (comment.length <= maxLength) {
            return comment;
        }
        return comment.substring(0, maxLength).trim() + '...';
    }

    selectRevisionItem(itemElement, revision) {
        // Remove previous selection
        this.elements.revisionCommentsList.querySelectorAll('.revision-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select current item
        itemElement.classList.add('selected');
        
        // Highlight the revision in the preview if possible
        this.highlightRevisionInPreview(revision);
        
        // Show full comment in status or modal
        this.showRevisionDetails(revision);
    }

    highlightRevisionInPreview(revision) {
        // Remove previous highlights
        const preview = document.getElementById('xmlPreview');
        if (preview) {
            preview.querySelectorAll('.revision-highlight').forEach(el => {
                el.classList.remove('revision-highlight');
            });
            
            // Try to find and highlight this revision in the preview
            const revisionElements = preview.querySelectorAll('revision, revisioncomment, RevisionComment');
            
            revisionElements.forEach(element => {
                const text = element.textContent?.trim();
                const id = element.getAttribute('id');
                
                // Try to match by revision number, id, or comment content
                const hasRevisionId = id && (id.includes(revision.number) || id.includes(`rev-${revision.number.toString().padStart(3, '0')}`));
                const hasRevisionComment = revision.comment && text && text.includes(revision.comment.substring(0, 30));
                
                if (hasRevisionId || hasRevisionComment) {
                    element.classList.add('revision-highlight');
                    
                    // Scroll into view
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

    showRevisionDetails(revision) {
        // Create a detailed tooltip or status message
        const details = `📝 Revision ${revision.number} (${revision.date}): ${revision.comment}`;
        this.xmlEditor.setStatus(details, 'info');
        
        // Optional: Show in a small modal or expanded view
        console.log('Revision Details:', revision);
    }

    exportRevisionsList() {
        try {
            const xmlContent = this.getCurrentXML();
            const revisions = this.parseRevisionsFromXML(xmlContent);
            
            if (revisions.length === 0) {
                this.xmlEditor.setStatus('No revisions to export', 'warning');
                return;
            }

            // Create export content
            const exportContent = this.createRevisionExport(revisions);
            
            // Download as text file
            const blob = new Blob([exportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `revision-comments-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.xmlEditor.setStatus('Revision comments exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting revisions:', error);
            this.xmlEditor.setStatus('Error exporting revision comments', 'error');
        }
    }

    createRevisionExport(revisions) {
        const header = `REVISION COMMENTS EXPORT
Generated: ${new Date().toLocaleString()}
Document: ${document.getElementById('currentDocument')?.textContent || 'Unknown'}
Total Revisions: ${revisions.length}

${'='.repeat(50)}

`;

        const revisionsText = revisions.map((revision, index) => {
            return `${index + 1}. REVISION ${revision.number}
   Date: ${revision.date}
   Type: ${revision.type === 'structured' ? 'Structured Revision' : 'Revision Comment'}
   Comment: ${revision.comment}
   
`;
        }).join('');

        return header + revisionsText;
    }

    // Call this when XML content changes to auto-refresh the list
    onXMLContentChanged() {
        // Auto-refresh the revisions list when content changes
        if (this.elements.revisionCommentsList && this.getCurrentXML()) {
            this.refreshRevisionsList();
        }
    }
}

// Export for use in main application
window.RevisionManager = RevisionManager;
