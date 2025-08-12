/**
 * Returns a basic summary-level structured output format
 */
function getBasicAnalysisFormat() {
    return {
        instruction: "Provide your response in the following JSON structure:",
        schema: {
            summary: "Brief overview of the XML document (1-2 sentences)",
            elementCount: "Total number of elements",
            namespaces: ["array", "of", "namespace", "prefixes"],
            wellFormed: "boolean indicating if XML is well-formed",
            issues: [
                {
                    type: "error|warning|info",
                    message: "Description of the issue"
                }
            ],
            recommendations: ["array", "of", "brief", "recommendations"]
        }
    };
}

/**
 * Returns a detailed analysis structured output format
 */
function getDetailedAnalysisFormat() {
    return {
        instruction: "Provide your response in the following JSON structure:",
        schema: {
            documentInfo: {
                encoding: "Document encoding",
                version: "XML version",
                rootElement: "Name of root element",
                totalElements: "Total element count",
                maxDepth: "Maximum nesting depth"
            },
            structure: {
                hierarchy: [
                    {
                        element: "element name",
                        path: "xpath to element",
                        attributes: ["list", "of", "attributes"],
                        children: "number of child elements",
                        textContent: "boolean if contains text"
                    }
                ],
                namespaces: [
                    {
                        prefix: "namespace prefix",
                        uri: "namespace URI",
                        usage: "description of usage"
                    }
                ]
            },
            validation: {
                wellFormed: "boolean",
                schemaValidated: "boolean or null if no schema",
                errors: [
                    {
                        type: "syntax|schema|namespace",
                        line: "line number",
                        column: "column number",
                        message: "error description",
                        severity: "error|warning"
                    }
                ]
            },
            analysis: {
                complexity: "low|medium|high",
                maintainability: "assessment of maintainability",
                performance: "performance considerations",
                security: "security assessment"
            },
            recommendations: [
                {
                    category: "structure|performance|security|maintainability",
                    priority: "high|medium|low",
                    description: "detailed recommendation",
                    implementation: "how to implement the recommendation"
                }
            ]
        }
    };
}

/**
 * Returns an expert-level deep analysis structured output format
 */
function getExpertAnalysisFormat() {
    return {
        instruction: "Provide your response in the following comprehensive JSON structure:",
        schema: {
            executiveSummary: {
                overview: "High-level document assessment",
                riskLevel: "low|medium|high|critical",
                keyFindings: ["most", "important", "findings"],
                actionRequired: "boolean if immediate action needed"
            },
            technicalDetails: {
                documentMetrics: {
                    size: "file size information",
                    complexity: "cyclomatic complexity if applicable",
                    elementDiversity: "variety of element types",
                    attributeDensity: "average attributes per element",
                    textContentRatio: "ratio of text to markup"
                },
                architecturalAnalysis: {
                    designPatterns: ["identified", "design", "patterns"],
                    dataModel: "description of data model",
                    relationships: [
                        {
                            type: "parent-child|reference|constraint",
                            source: "source element/attribute",
                            target: "target element/attribute",
                            description: "relationship description"
                        }
                    ]
                },
                schemaAnalysis: {
                    type: "XSD|DTD|RelaxNG|none",
                    location: "schema location if applicable",
                    compliance: "compliance assessment",
                    extensibility: "extensibility analysis",
                    constraints: ["list", "of", "constraints"]
                }
            },
            qualityAssessment: {
                codeQuality: {
                    consistency: "naming and structure consistency",
                    readability: "human readability assessment",
                    documentation: "inline documentation quality"
                },
                performance: {
                    parsingComplexity: "estimated parsing complexity",
                    memoryUsage: "estimated memory requirements",
                    optimizationOpportunities: ["specific", "optimizations"]
                },
                security: {
                    vulnerabilities: [
                        {
                            type: "XXE|injection|disclosure",
                            severity: "critical|high|medium|low",
                            description: "vulnerability description",
                            mitigation: "mitigation strategy"
                        }
                    ],
                    bestPractices: ["security", "best", "practices"]
                }
            },
            businessImpact: {
                functionalAreas: ["affected", "business", "areas"],
                integrationPoints: ["system", "integration", "points"],
                dataGovernance: "data governance considerations",
                complianceRequirements: ["regulatory", "requirements"]
            },
            actionPlan: [
                {
                    priority: 1,
                    category: "critical|improvement|enhancement",
                    task: "specific task description",
                    effort: "estimated effort (hours/days)",
                    dependencies: ["task", "dependencies"],
                    riskMitigation: "risk mitigation strategy"
                }
            ]
        }
    };
}

/**
 * Returns a structured format for XML change comparison
 */
function getChangeAnalysisFormat() {
    return {
        instruction: "Provide your XML change analysis in the following JSON structure:",
        schema: {
            changesSummary: {
                totalChanges: "number of changes detected",
                breakingChanges: "number of breaking changes",
                riskLevel: "low|medium|high|critical",
                migrationRequired: "boolean"
            },
            structuralChanges: [
                {
                    type: "added|removed|modified|moved",
                    elementPath: "xpath to changed element",
                    changeDescription: "description of the change",
                    impact: "breaking|non-breaking|cosmetic",
                    before: "previous state or null",
                    after: "new state or null"
                }
            ],
            attributeChanges: [
                {
                    elementPath: "xpath to parent element",
                    attributeName: "name of changed attribute",
                    changeType: "added|removed|modified|renamed",
                    oldValue: "previous value or null",
                    newValue: "new value or null",
                    impact: "breaking|non-breaking|cosmetic"
                }
            ],
            contentChanges: [
                {
                    elementPath: "xpath to element with content change",
                    changeType: "text|cdata|mixed",
                    oldContent: "previous content",
                    newContent: "new content",
                    significance: "major|minor|formatting"
                }
            ],
            schemaChanges: {
                schemaModified: "boolean",
                compatibilityLevel: "backward|forward|none",
                versioningRequired: "boolean",
                migrationPath: "description of migration approach"
            },
            impactAssessment: {
                affectedSystems: ["list", "of", "affected", "systems"],
                testingRequired: ["areas", "requiring", "testing"],
                rollbackComplexity: "low|medium|high",
                deploymentRisk: "assessment of deployment risk"
            },
            recommendations: {
                immediate: ["immediate", "action", "items"],
                shortTerm: ["short", "term", "recommendations"],
                longTerm: ["long", "term", "strategic", "changes"]
            }
        }
    };
}

/**
 * Returns a structured format for XML validation results
 */
function getValidationResultFormat() {
    return {
        instruction: "Provide your XML validation results in the following JSON structure:",
        schema: {
            validationStatus: {
                overall: "valid|invalid|warning",
                wellFormed: "boolean",
                schemaValid: "boolean or null",
                namespaceValid: "boolean"
            },
            errors: [
                {
                    severity: "error|warning|info",
                    category: "syntax|schema|namespace|semantic",
                    line: "line number",
                    column: "column number",
                    code: "error code if applicable",
                    message: "human readable error message",
                    suggestion: "suggested fix",
                    references: ["relevant", "specification", "sections"]
                }
            ],
            compliance: {
                xmlVersion: "1.0|1.1",
                encoding: "document encoding validation",
                dtdCompliance: "DTD compliance status",
                schemaCompliance: "XSD compliance status",
                namespaceCompliance: "namespace compliance status"
            },
            qualityMetrics: {
                score: "overall quality score (0-100)",
                maintainabilityIndex: "maintainability score",
                complexityRating: "complexity assessment",
                bestPracticesScore: "adherence to best practices"
            },
            remediation: [
                {
                    priority: "critical|high|medium|low",
                    issue: "issue description",
                    solution: "step-by-step solution",
                    effort: "estimated effort to fix",
                    impact: "impact of not fixing"
                }
            ]
        }
    };
}

/**
 * Helper function to get the appropriate format based on analysis depth
 */
function getAnalysisFormat(depth) {
    const formats = {
        'basic': getBasicAnalysisFormat,
        'detailed': getDetailedAnalysisFormat,
        'expert': getExpertAnalysisFormat,
        'change': getChangeAnalysisFormat,
        'validation': getValidationResultFormat
    };
    
    return formats[depth] ? formats[depth]() : getBasicAnalysisFormat();
}

module.exports = {
    getBasicAnalysisFormat,
    getDetailedAnalysisFormat,
    getExpertAnalysisFormat,
    getChangeAnalysisFormat,
    getValidationResultFormat,
    getAnalysisFormat
};
