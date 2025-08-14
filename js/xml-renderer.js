// XML Rendering and Processing Module
class XMLRenderer {
    constructor() {
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
    }

    // Convert HTML from WYSIWYG to XML
    htmlToXml(html) {
        try {
            // Convert HTML elements back to XML elements, prioritizing stored original XML data
            let xml = html;
            
            // First, restore original XML elements from data-original attributes
            xml = xml.replace(/<([^>]+)\s+data-original="([^"]*)"[^>]*>/g, (match, tagContent, originalEncoded) => {
                try {
                    const original = decodeURIComponent(originalEncoded);
                    return original;
                } catch (e) {
                    // If decoding fails, fall back to manual conversion
                    return match;
                }
            });
            
            // Handle elements that don't have data-original attributes
            xml = xml
                // Convert divs and headers back to XML elements
                .replace(/<div class="product">/g, '<product>')
                .replace(/<div class="topic">/g, '<topic>')
                .replace(/<div class="section">/g, '<section>')
                .replace(/<header>/g, '<frontMatter>')
                .replace(/<\/header>/g, '</frontMatter>')
                .replace(/<div class="revision-metadata">/g, '<revisionMetadata>')
                .replace(/<div class="revisions-section">/g, '<Revisions>')
                .replace(/<div class="revision">/g, '<Revision>')
                
                // Convert headers and paragraphs back
                .replace(/<h1([^>]*)>/g, '<title$1>')
                .replace(/<\/h1>/g, '</title>')
                .replace(/<p([^>]*)>/g, (match, attrs) => {
                    // Clean out class attributes that are HTML-specific
                    const cleanAttrs = attrs.replace(/\s*class="[^"]*"/g, '').replace(/\s*data-original="[^"]*"/g, '');
                    if (match.includes('class="reference"')) {
                        // This was a reference element, try to reconstruct
                        const content = match; // Will be handled separately
                        return match; // Keep as is for now, will be processed below
                    }
                    return `<para${cleanAttrs}>`;
                })
                .replace(/<\/p>/g, function(match, offset, string) {
                    // Check if this was a reference paragraph
                    const beforeMatch = string.substring(Math.max(0, offset - 200), offset);
                    if (beforeMatch.includes('class="reference"')) {
                        return '</p>'; // Keep as paragraph for references
                    }
                    return '</para>';
                })
                
                // Handle reference elements specially
                .replace(/<p class="reference"[^>]*>📄 Topic Reference: ([^<]*)<\/p>/g, '<topicRef ref="$1"/>')
                .replace(/<p class="reference"[^>]*>📋 Section Reference: ([^<]*)<\/p>/g, '<sectionRef ref="$1"/>')
                .replace(/<p class="reference"[^>]*>📄 References: ([^<]*)<\/p>/g, '<topicRef ref="$1"/>')
                .replace(/<p class="reference"[^>]*>📋 Section: ([^<]*)<\/p>/g, '<sectionRef ref="$1"/>')
                
                // Handle revision elements
                .replace(/<span class="revision-date"[^>]*>Date: ([^<]*)<\/span>/g, '<revisionDate>$1</revisionDate>')
                .replace(/<span class="revision-comment"[^>]*>Comment: ([^<]*)<\/span>/g, '<revisionComment>$1</revisionComment>')
                .replace(/<span class="revision-number"[^>]*>Rev: ([^<]*)<\/span>/g, '<RevisionNumber>$1</RevisionNumber>')
                
                // Handle generic divs
                .replace(/<\/div>/g, function(match, offset, string) {
                    // Look backwards to find the opening element to determine its type
                    const beforeMatch = string.substring(0, offset);
                    const lastProductIndex = beforeMatch.lastIndexOf('<product>');
                    const lastTopicIndex = beforeMatch.lastIndexOf('<topic>');
                    const lastSectionIndex = beforeMatch.lastIndexOf('<section>');
                    const lastRevisionMetadataIndex = beforeMatch.lastIndexOf('<revisionMetadata>');
                    const lastRevisionsIndex = beforeMatch.lastIndexOf('<Revisions>');
                    const lastRevisionIndex = beforeMatch.lastIndexOf('<Revision>');
                    
                    // Find corresponding close tags
                    const lastProductCloseIndex = beforeMatch.lastIndexOf('</product>');
                    const lastTopicCloseIndex = beforeMatch.lastIndexOf('</topic>');
                    const lastSectionCloseIndex = beforeMatch.lastIndexOf('</section>');
                    const lastRevisionMetadataCloseIndex = beforeMatch.lastIndexOf('</revisionMetadata>');
                    const lastRevisionsCloseIndex = beforeMatch.lastIndexOf('</Revisions>');
                    const lastRevisionCloseIndex = beforeMatch.lastIndexOf('</Revision>');
                    
                    // Determine which element needs closing
                    const indices = [
                        { index: lastProductIndex, close: lastProductCloseIndex, tag: '</product>' },
                        { index: lastTopicIndex, close: lastTopicCloseIndex, tag: '</topic>' },
                        { index: lastSectionIndex, close: lastSectionCloseIndex, tag: '</section>' },
                        { index: lastRevisionMetadataIndex, close: lastRevisionMetadataCloseIndex, tag: '</revisionMetadata>' },
                        { index: lastRevisionsIndex, close: lastRevisionsCloseIndex, tag: '</Revisions>' },
                        { index: lastRevisionIndex, close: lastRevisionCloseIndex, tag: '</Revision>' }
                    ];
                    
                    // Find the most recent unclosed element
                    let mostRecent = { index: -1, tag: '</div>' };
                    for (const item of indices) {
                        if (item.index > item.close && item.index > mostRecent.index) {
                            mostRecent = item;
                        }
                    }
                    
                    return mostRecent.tag;
                })
                
                // Convert basic formatting
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
                .replace(/<br\/>/g, '<br/>')
                
                // Clean up remaining HTML attributes that shouldn't be in XML
                .replace(/\s+data-original="[^"]*"/g, '')
                .replace(/\s+class="[^"]*"/g, '');

            return xml;
        } catch (error) {
            console.error('Error converting HTML to XML:', error);
            return html;
        }
    }

    // Convert XML to HTML for WYSIWYG display
    xmlToHtml(xml, includeDataStorage = false) {
        try {
            // Store the original XML declaration
            const xmlDeclaration = xml.match(/<\?xml[^>]*\?>/);
            const originalXml = xml; // Store the complete original for potential restoration
            
            // Remove XML declaration for processing
            let html = xml.replace(/<\?xml[^>]*\?>/g, '');
            
            // Store the original XML in a hidden element for perfect round-trip (only when needed)
            const xmlData = encodeURIComponent(originalXml);
            
            // Handle complex XML elements while preserving their original structure
            html = html
                // Store original XML elements with attributes as data attributes - handle self-closing and regular tags
                .replace(/<(product[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="product" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="product" data-original="${encoded}">`;
                })
                .replace(/<(topic[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="topic" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="topic" data-original="${encoded}">`;
                })
                .replace(/<(section[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="section" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="section" data-original="${encoded}">`;
                })
                .replace(/<(frontMatter[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<header data-original="${encoded}" data-self-closing="true"></header>`;
                    }
                    return `<header data-original="${encoded}">`;
                })
                .replace(/<(revisionMetadata[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="revision-metadata" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="revision-metadata" data-original="${encoded}">`;
                })
                .replace(/<(Revisions[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="revisions-section" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="revisions-section" data-original="${encoded}">`;
                })
                .replace(/<(Revision[^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match);
                    if (closing.includes('/')) {
                        return `<div class="revision" data-original="${encoded}" data-self-closing="true"></div>`;
                    }
                    return `<div class="revision" data-original="${encoded}">`;
                })
                
                // Convert closing tags
                .replace(/<\/product>/g, '</div>')
                .replace(/<\/topic>/g, '</div>')
                .replace(/<\/section>/g, '</div>')
                .replace(/<\/frontMatter>/g, '</header>')
                .replace(/<\/revisionMetadata>/g, '</div>')
                .replace(/<\/Revisions>/g, '</div>')
                .replace(/<\/Revision>/g, '</div>')
                
                // Handle title elements - preserve id attributes
                .replace(/<title([^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match.replace(/(\s*\/?>)$/, '>'));
                    if (closing.includes('/')) {
                        return `<h1${attrs} data-original="${encoded}" data-self-closing="true"></h1>`;
                    }
                    return `<h1${attrs} data-original="${encoded}">`;
                })
                .replace(/<\/title>/g, '</h1>')
                
                // Handle para elements - preserve id attributes  
                .replace(/<para([^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match.replace(/(\s*\/?>)$/, '>'));
                    if (closing.includes('/')) {
                        return `<p${attrs} data-original="${encoded}" data-self-closing="true"></p>`;
                    }
                    return `<p${attrs} data-original="${encoded}">`;
                })
                .replace(/<\/para>/g, '</p>')
                
                // Handle revision date and comment elements
                .replace(/<revisionDate([^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match.replace(/(\s*\/?>)$/, '>'));
                    if (closing.includes('/')) {
                        return `<span class="revision-date" data-original="${encoded}" data-self-closing="true">Date: </span>`;
                    }
                    return `<span class="revision-date" data-original="${encoded}">Date: `;
                })
                .replace(/<\/revisionDate>/g, '</span>')
                .replace(/<revisionComment([^>]*?)(\s*\/?>)/g, (match, attrs, closing) => {
                    const encoded = encodeURIComponent(match.replace(/(\s*\/?>)$/, '>'));
                    if (closing.includes('/')) {
                        return `<span class="revision-comment" data-original="${encoded}" data-self-closing="true">Comment: </span>`;
                    }
                    return `<span class="revision-comment" data-original="${encoded}">Comment: `;
                })
                .replace(/<\/revisionComment>/g, '</span>')
                
                // Handle reference elements (self-closing)
                .replace(/<topicRef([^>]*?)\/>/g, (match, attrs) => {
                    const refMatch = attrs.match(/ref="([^"]*)"/);
                    const ref = refMatch ? refMatch[1] : '';
                    const encoded = encodeURIComponent(match);
                    return `<p class="reference" data-original="${encoded}">📄 Topic Reference: ${ref}</p>`;
                })
                .replace(/<sectionRef([^>]*?)\/>/g, (match, attrs) => {
                    const refMatch = attrs.match(/ref="([^"]*)"/);
                    const ref = refMatch ? refMatch[1] : '';
                    const encoded = encodeURIComponent(match);
                    return `<p class="reference" data-original="${encoded}">📋 Section Reference: ${ref}</p>`;
                })
                
                // Handle revision elements
                .replace(/<RevisionNumber[^>]*>/g, '<span class="revision-number">Rev: ')
                .replace(/<\/RevisionNumber>/g, '</span>')
                .replace(/<RevisionDate[^>]*>/g, '<span class="revision-date">Date: ')
                .replace(/<\/RevisionDate>/g, '</span>')
                .replace(/<RevisionComment[^>]*>/g, '<span class="revision-comment">Comment: ')
                .replace(/<\/RevisionComment>/g, '</span>')
                
                // Handle basic formatting elements
                .replace(/<bold>/g, '<strong>')
                .replace(/<\/bold>/g, '</strong>')
                .replace(/<italic>/g, '<em>')
                .replace(/<\/italic>/g, '</em>')
                
                // Handle lists
                .replace(/<list type="unordered">/g, '<ul>')
                .replace(/<list type="ordered">/g, '<ol>')
                .replace(/<\/list>/g, function(match, offset, string) {
                    const beforeMatch = string.substring(0, offset);
                    const lastUlIndex = beforeMatch.lastIndexOf('<ul>');
                    const lastOlIndex = beforeMatch.lastIndexOf('<ol>');
                    const lastUlCloseIndex = beforeMatch.lastIndexOf('</ul>');
                    const lastOlCloseIndex = beforeMatch.lastIndexOf('</ol>');
                    
                    if (lastUlIndex > lastOlIndex && lastUlIndex > lastUlCloseIndex) {
                        return '</ul>';
                    } else if (lastOlIndex > lastUlIndex && lastOlIndex > lastOlCloseIndex) {
                        return '</ol>';
                    } else {
                        return '</ul>';
                    }
                })
                .replace(/<item>/g, '<li>')
                .replace(/<\/item>/g, '</li>')
                .replace(/<br\/>/g, '<br>');

            // Only add hidden input for data storage when explicitly requested (not for Quill editor)
            if (includeDataStorage) {
                html = `<input type="hidden" id="original-xml-data" value="${xmlData}" />${html}`;
            }

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
            
            // Check for parsing errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                return this.escapeHtml(xmlString);
            }
            
            const formatted = this.serializer.serializeToString(doc);
            const prettified = this.prettifyXML(formatted);
            const highlighted = this.highlightXML(prettified);
            
            return highlighted;
        } catch (error) {
            console.error('Error formatting XML:', error);
            // Fall back to simple escaped HTML if formatting fails
            return this.escapeHtml(xmlString);
        }
    }

    // Add syntax highlighting to XML
    highlightXML(xml) {
         return xml
             .replace(/(&lt;)([^&]*?)(&gt;)/g, '<span class="xml-element">$1$2$3</span>')
        //     .replace(/(\w+)=("[^"]*")/g, '<span class="xml-attribute">$1</span>=<span class="xml-attribute">$2</span>')
             .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>');
       // return xml;
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
        xmlString = xmlString.replace(/<\?xml[^?]*\?>/g,'')
        
        if (validation.valid) {
            // Use the original formatXML approach but with better error handling
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
<section>
    <title>Sample XML Document</title>
    <paragraph>This is a sample paragraph with <bold>bold text</bold> and <italic>italic text</italic>.</paragraph>
    <list type="unordered">
        <item>First item</item>
        <item>Second item</item>
        <item>Third item</item>
    </list>
    <paragraph>You can edit this content using the WYSIWYG editor above.</paragraph>
</section>`;
    }
}

// Export for use in other modules
window.XMLRenderer = XMLRenderer;
