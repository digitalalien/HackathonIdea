// XML Rendering and Processing Module
class XMLRenderer {
    constructor() {
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
    }

    // Convert HTML from WYSIWYG to XML
    htmlToXml(html) {
        try {
            // Simple HTML to XML conversion
            // This is a basic implementation - you can enhance based on your needs
            let xml = html
                .replace(/<p>/g, '<paragraph>')
                .replace(/<\/p>/g, '</paragraph>')
                .replace(/<strong>/g, '<bold>')
                .replace(/<\/strong>/g, '</bold>')
                .replace(/<em>/g, '<italic>')
                .replace(/<\/em>/g, '</italic>')
                .replace(/<ul>/g, '<list type="unordered">')
                .replace(/<\/ul>/g, '</list>')
                .replace(/<ol>/g, '<list type="ordered">')
                .replace(/<\/ol>/g, '</list>')
                .replace(/<li>/g, '<item>')
                .replace(/<\/li>/g, '</item>')
                .replace(/<br>/g, '<br/>')
                .replace(/<br\/>/g, '<br/>');

            // Wrap in root element if not already wrapped
            if (!xml.startsWith('<?xml')) {
                xml = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n${xml}\n</document>`;
            }

            return xml;
        } catch (error) {
            console.error('Error converting HTML to XML:', error);
            return html;
        }
    }

    // Convert XML to HTML for WYSIWYG display
    xmlToHtml(xml) {
        try {
            // Handle specialized XML elements from the sample files
            let html = xml
                .replace(/<?xml[^>]*>/g, '') // Remove XML declaration
                .replace(/<product[^>]*>/g, '<div class="product">')
                .replace(/<\/product>/g, '</div>')
                .replace(/<frontMatter[^>]*>/g, '<header>')
                .replace(/<\/frontMatter>/g, '</header>')
                .replace(/<topic[^>]*>/g, '<article class="topic">')
                .replace(/<\/topic>/g, '</article>')
                .replace(/<section[^>]*>/g, '<section>')
                .replace(/<\/section>/g, '</section>')
                .replace(/<title[^>]*>/g, '<h1>')
                .replace(/<\/title>/g, '</h1>')
                .replace(/<para[^>]*>/g, '<p>')
                .replace(/<\/para>/g, '</p>')
                .replace(/<topicRef[^>]*ref="([^"]*)"[^>]*>/g, '<p class="reference">📄 References: $1</p>')
                .replace(/<sectionRef[^>]*ref="([^"]*)"[^>]*>/g, '<p class="reference">📋 Section: $1</p>')
                .replace(/<Revisions[^>]*>/g, '<div class="revisions-section">')
                .replace(/<\/Revisions>/g, '</div>')
                .replace(/<Revision[^>]*>/g, '<div class="revision">')
                .replace(/<\/Revision>/g, '</div>')
                .replace(/<RevisionNumber[^>]*>/g, '<span class="revision-number">Rev: ')
                .replace(/<\/RevisionNumber>/g, '</span>')
                .replace(/<RevisionDate[^>]*>/g, '<span class="revision-date">Date: ')
                .replace(/<\/RevisionDate>/g, '</span>')
                .replace(/<RevisionComment[^>]*>/g, '<span class="revision-comment">Comment: ')
                .replace(/<\/RevisionComment>/g, '</span>')
                // Keep existing conversions for compatibility
                .replace(/<document>/g, '')
                .replace(/<\/document>/g, '')
                .replace(/<paragraph>/g, '<p>')
                .replace(/<\/paragraph>/g, '</p>')
                .replace(/<bold>/g, '<strong>')
                .replace(/<\/bold>/g, '</strong>')
                .replace(/<italic>/g, '<em>')
                .replace(/<\/italic>/g, '</em>')
                .replace(/<list type="unordered">/g, '<ul>')
                .replace(/<list type="ordered">/g, '<ol>')
                .replace(/<\/list>/g, '</ul>')
                .replace(/<item>/g, '<li>')
                .replace(/<\/item>/g, '</li>')
                .replace(/<br\/>/g, '<br>');

            return html.trim();
        } catch (error) {
            console.error('Error converting XML to HTML:', error);
            return xml;
        }
    }

    // Validate XML
    validateXML(xmlString) {
        try {
            const doc = this.parser.parseFromString(xmlString, 'application/xml');
            const parserError = doc.querySelector('parsererror');
            
            if (parserError) {
                return {
                    valid: false,
                    error: parserError.textContent
                };
            }
            
            return {
                valid: true,
                message: 'XML is well-formed'
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Format XML with syntax highlighting
    formatXML(xmlString) {
        try {
            const doc = this.parser.parseFromString(xmlString, 'application/xml');
            const formatted = this.serializer.serializeToString(doc);
            return this.highlightXML(this.prettifyXML(formatted));
        } catch (error) {
            return xmlString;
        }
    }

    // Add syntax highlighting to XML
    highlightXML(xml) {
        return xml
            .replace(/(&lt;)([^&]*?)(&gt;)/g, '<span class="xml-element">$1$2$3</span>')
            .replace(/(\w+)=("[^"]*")/g, '<span class="xml-attribute">$1</span>=<span class="xml-attribute">$2</span>')
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>');
    }

    // Pretty print XML
    prettifyXML(xml) {
        const formatted = xml.replace(/></g, '>\n<');
        const lines = formatted.split('\n');
        let indent = 0;
        const indentStr = '  ';
        
        return lines.map(line => {
            if (line.match(/<\/\w/)) {
                indent--;
            }
            
            const indentedLine = indentStr.repeat(Math.max(0, indent)) + line;
            
            if (line.match(/<\w[^>]*[^\/]>$/)) {
                indent++;
            }
            
            return indentedLine;
        }).join('\n');
    }

    // Render XML in preview panel
    renderPreview(xmlString, previewElement) {
        const validation = this.validateXML(xmlString);
        
        if (validation.valid) {
            const formatted = this.formatXML(xmlString);
            previewElement.innerHTML = `<pre>${formatted}</pre>`;
        } else {
            previewElement.innerHTML = `
                <div class="validation-error">
                    <strong>XML Validation Error:</strong><br>
                    ${validation.error}
                </div>
                <pre>${this.escapeHtml(xmlString)}</pre>
            `;
        }
    }

    // Escape HTML characters
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create sample XML
    createSampleXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<document>
    <title>Sample XML Document</title>
    <paragraph>This is a sample paragraph with <bold>bold text</bold> and <italic>italic text</italic>.</paragraph>
    <list type="unordered">
        <item>First item</item>
        <item>Second item</item>
        <item>Third item</item>
    </list>
    <paragraph>You can edit this content using the WYSIWYG editor above.</paragraph>
</document>`;
    }
}

// Export for use in other modules
window.XMLRenderer = XMLRenderer;
