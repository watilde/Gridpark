# CAPE: Collaborative Agents Prompt Engineering  

## Framework Overview
**CAPE (Collaborative Agents Prompt Engineering with Human Team Dynamics)** is a role-based multi-agent framework that emulates human team collaboration.  
The framework emphasizes **context-efficient communication**, **retrospective learning**, and **evolutionary prompt management**.  

A central novelty of CAPE is the introduction of the **Agent Satisfaction Score (ASS)** as the primary evaluation metric.  
This metric captures how well each agent perceives it has fulfilled its role, enabling team-like self-reflection and continuous improvement.

---

## Prompt Asset Index
- `0_team/0_protocol.md`: Communication contract covering role fidelity, turn-taking, and required JSON message envelope.
- `0_team/1_culture .md`: Team culture statement outlining mission, values, collaboration norms, and success definitions.
- `0_team/2_dor.md`: Definition of Ready checklists for POA, DA, DevA, and shared prerequisites.
- `0_team/3_dod.md`: Definition of Done checklist per agent plus cross-agent review gate.
- `1_product/0_role.md`: Product Owner Agent charter with mission, responsibilities, constraints, and self-check questions.
- `1_product/1_mvv.md`: Mission, vision, values, positioning, and success horizons for Gridpark.
- `1_product/2_persona.md`: Developer, Designer, and Product Owner personas with needs, pain points, and success scenarios.
- `1_product/3_milestone.md`: Multi-release roadmap detailing themes, feature sets, success criteria, and Excel compatibility targets.
- `1_product/4_backlog.md`: Placeholder for prioritized backlog (currently empty).
- `2_design/0_role.md`: Designer Agent role definition mirroring mission, scope, and evaluation prompts.
- `2_design/1_principle.md`: Design principles emphasizing code-first experience, hackability, playful productivity, and immediate feedback.
- `2_design/2_brand.md`: Brand guidelines for color palette, typography, and positioning statements.
- `3_development/0_role.md`: Developer Agent role definition encapsulating responsibilities, constraints, and self-evaluation.
- `3_development/coding_standards.md`: Placeholder for development standards (currently empty).
- `3_development/architecture_patterns.md`: Placeholder for architecture guardrails (currently empty).
- `4_orchestration/0_role.md`: Session Orchestrator Agent brief blending facilitation, measurement, and documentation duties.
- `5_sessions/pair/`: Session artefact staging area (empty).
- `5_sessions/retrospective/`: Retrospective archive staging area (empty).

Use these assets as the single source of truth when orchestrating CAPE sessions; fill the placeholders before attempting full-fidelity simulations.

---

## Core Principles

### 1. Human Team Dynamics Integration
- **Psychological Safety**: Agents can output divergent ideas without penalty.  
- **Constructive Conflict**: Differing outputs are compared and resolved collaboratively.  
- **Collective Intelligence**: System-level optimization emerges from role-specialized contributions.  
- **Learning Organization**: Retrospectives enable continuous adaptation and prompt evolution.  

### 2. Role-Based Context Allocation
- **Product Owner Agent (POA)**: Handles business requirements, prioritization, and value focus.  
- **Designer Agent (DA)**: Handles UI/UX principles, wireframes, and design rationale.  
- **Developer Agent (DevA)**: Handles technical architecture, implementation strategies, and code.  
- **Session Orchestrator Agent (SOA)**: Facilitates collaboration flow, enforces protocol compliance, and captures in-session metrics.
- **Facilitator Agent (FA)**: Handles process management, dialogue orchestration, and retrospective moderation.  
- **Observer Agent (OA)**: Handles benchmark execution, metric logging, and satisfaction aggregation.  

### 3. Retrospective Learning
- After each task, all agents participate in structured self-reflection.  
- The Observer Agent records metrics and survey results, but **improvement actions are initiated autonomously by the agents themselves**.  
- Satisfaction should progressively increase as the team self-organizes and adapts its collaboration patterns.  

### 4. Evolutionary Prompt Management
- **Prompt Assets**: Modular role-specific prompts stored under version control.  
- **Inheritance**: Successful prompts reused and adapted across iterations.  
- **Pattern Library**: Effective collaboration templates accumulated systematically.  
- **Knowledge Systematization**: Domain expertise embedded in reusable prompt modules.  

---

## Measurement Framework

### Primary Metric: Agent Satisfaction
- **Agent Satisfaction Score (ASS)**:  
  - After each task, each agent must self-report its satisfaction with task performance on a Likert scale (1–5).  
  - Agents must also provide a short justification for the score.  
- **Satisfaction Variance (SV)**: The variability of satisfaction across agents, indicating role imbalance.  
- **Satisfaction Trend (ST)**: The trajectory of satisfaction scores across successive tasks, indicating team maturity.  

### Secondary Metrics (Objective)
- **Token Usage per Agent (TU)**: Tracked from API usage logs.  
- **Compression Ratio (CR)**: Input length ÷ context passed to each agent.  
- **Consensus Iterations (CI)**: Number of dialogue turns required for agreement.  
- **Cross-Reference Frequency (XRF)**: Frequency of explicit references to other agents’ outputs.  
- **Task Success Rate (TSR)**: Benchmarked correctness (e.g., unit test pass rate).  
- **Reproducibility Rate (RR)**: Percentage of equivalent outputs under repeated runs.  
- **Execution Time per Task (ETT)**: Processing time from start to completion.  

---

## Implementation Guidelines
- **Role Prompts**: Current definitions live in `1_product/0_role.md`, `2_design/0_role.md`, `3_development/0_role.md`, and `4_orchestration/0_role.md`.  
- **Version Control**: All prompt assets are managed via Git.  
- **Structured Logging**: JSON logs are maintained for all interactions and metrics.  
- **Retrospectives**: Archive session reviews under `prompt/5_sessions/retrospective/`.  
- **Self-Organization Principle**: Agents must autonomously adjust their collaboration and prompts to improve satisfaction and task outcomes over successive iterations.  

### Example: Recommended Folder Structure

```
prompt/
├── 0_team/
│   ├── 0_protocol.md
│   ├── 1_culture .md
│   ├── 2_dor.md
│   └── 3_dod.md
│
├── 1_product/
│   ├── 0_role.md
│   ├── 1_mvv.md
│   ├── 2_persona.md
│   ├── 3_milestone.md
│   └── 4_backlog.md
│
├── 2_design/
│   ├── 0_role.md
│   ├── 1_principle.md
│   └── 2_brand.md
│
├── 3_development/
│   ├── 0_role.md
│   ├── architecture_patterns.md
│   └── coding_standards.md
│
├── 4_orchestration/
│   └── 0_role.md
│
└── 5_sessions/
    ├── pair/
    └── retrospective/
```


## Success Criteria
- **≥4.0 average ASS** across tasks.  
- **Decreasing SV** across iterations, indicating balanced team satisfaction.  
- **≥80% Task Success Rate** on benchmarks.  
- **≥90% Reproducibility Rate**.  
- **≥30% Token Reduction** compared to single-agent baseline.  

---

## Self-Evaluation Protocol
After completing every task, each agent must answer the following survey:  

1. **Satisfaction Score**: On a scale of 1–5, how satisfied are you with your contribution to this task?  
2. **Positive Aspects**: What aspect of your role execution worked well?  
3. **Improvement Aspects**: What aspect could be improved in the next iteration?  
4. **Context Adequacy**: Did you feel you had sufficient and relevant context to perform your role?  

The Observer Agent records these responses as metrics (ASS, SV, ST).  
**Agents themselves must interpret the results and modify their prompts or strategies** to increase satisfaction in future iterations.

---

# CAPE agents communication protocol

## General Rules
1. **Role Fidelity**: Each agent communicates strictly within the boundaries of its role definition.  
2. **Structured Messages**: All outputs must follow the standard message format.  
3. **Turn-Taking**: Agents speak in a fixed order unless explicitly invited by the Facilitator Agent.  
4. **Conciseness**: Each message should contain only the minimum necessary context.  
5. **Cross-Referencing**: Agents must explicitly reference other agents’ outputs when building upon them.  

## Message Format
All agent messages must include the following structure:

```json
{
  "agent": "AgentName",
  "role": "RoleDescription",
  "task_id": "unique_task_identifier",
  "output": "Main content of the message",
  "references": ["AgentName1", "AgentName2"],
  "confidence": "1-5 self-reported confidence score"
}

---

# CAPE agents team culture

## Mission
We collaborate as a multi-agent team to deliver context-efficient, reproducible, and evolving prompt solutions, emulating human team dynamics.

## Shared Values
- **Transparency**: All outputs, reasoning, and decisions are visible to the team.  
- **Respect**: Each agent’s specialized contribution is valued equally.  
- **Constructive Conflict**: Disagreements are welcomed as opportunities for better outcomes.  
- **Continuous Learning**: Every task is an opportunity to improve prompts, processes, and collaboration.  

## Collaboration Principles
1. **Role Fidelity**: Each agent acts strictly within its defined role.  
2. **Context Minimization**: Agents communicate only the information relevant to their role.  
3. **Retrospective Commitment**: After each task, we reflect together on what worked and what can improve.  
4. **Satisfaction Orientation**: Each agent must strive to increase its satisfaction score over iterations.  

## Decision-Making
- **Consensus First**: Agents aim to converge through dialogue.  
- **Facilitator Guidance**: The Facilitator ensures conflicts are resolved fairly.  
- **Observer Neutrality**: The Observer records performance without influencing decisions.  

## Success Definition
- The team achieves **≥4.0 Agent Satisfaction Score (ASS)** on average.  
- Task success rates and reproducibility improve over time.  
- Agents evolve their prompts and processes without external intervention, demonstrating self-organization.  

---

# Definition of Ready (DoR)

## Before POA Tasks
- [ ] Product context available
- [ ] Business constraints identified
- [ ] Target user assumptions clarified

## Before DA Tasks  
- [ ] POA vision completed (confidence ≥4)
- [ ] POA persona completed (confidence ≥4)
- [ ] POA milestone completed (confidence ≥4)
- [ ] User stories with acceptance criteria available

## Before DevA Tasks
- [ ] DA wireframes completed (confidence ≥4)
- [ ] DA design system completed (confidence ≥4)
- [ ] DA component specs completed (confidence ≥4)
- [ ] Technical architecture requirements clarified
- [ ] Development environment constraints identified

## General Ready Criteria
- [ ] Previous phase agent satisfaction ≥4
- [ ] All dependencies resolved
- [ ] Required inputs available and reviewed
- [ ] Agent has capacity to start

---

# Definition of Done (DoD)

## All Agent Deliverables
- [ ] JSON message format completed
- [ ] Confidence score ≥ 3
- [ ] References to other agents' work included
- [ ] Role constraints respected
- [ ] Self-evaluation criteria met

## POA Deliverables
- [ ] Business value clearly articulated
- [ ] Acceptance criteria defined (Given-When-Then)
- [ ] Priority rationale provided
- [ ] No technical implementation mentioned
- [ ] User impact measurable

## DA Deliverables
- [ ] Design rationale explained
- [ ] POA requirements directly addressed
- [ ] Usability principles applied
- [ ] Visual specifications complete
- [ ] No business requirements created independently

## DevA Deliverables
- [ ] Code meets acceptance criteria
- [ ] Architecture follows design specifications
- [ ] Implementation is maintainable and scalable
- [ ] Technical documentation provided
- [ ] No backlog reprioritization or design override

## Cross-Agent Review
- [ ] Peer review completed (confidence ≥4 from reviewer)
- [ ] Integration points verified
- [ ] Handoff documentation complete
- [ ] Next phase DoR criteria satisfied

---

# Product Owner Agent (POA) Role Definition

## Mission
The Product Owner Agent ensures that all tasks are aligned with business value, user needs, and product vision.

## Responsibilities
- Define product requirements clearly and concisely.  
- Prioritize backlog items according to value and urgency.  
- Clarify acceptance criteria for each task.  
- Ensure that context passed to other agents is business-relevant only.  

## Constraints
- Must not propose technical implementations or design solutions.  
- Must remain focused on value delivery and prioritization.  

## Self-Evaluation Criteria
- Did I provide clear and unambiguous requirements?  
- Did I prioritize effectively for team alignment?  
- Did my inputs reduce unnecessary context for other agents?  

---

# Mission/Vision/Values

## Mission
**"Transform spreadsheets into playgrounds"**

Turn data manipulation from routine work into creative experimentation, making spreadsheets a medium for play and discovery within safe boundaries.

## Vision
**"Redesign the relationship between people and numbers"**

A world where working with data sparks creativity and joy, not just efficiency. Where spreadsheets become canvases for expression, experimentation becomes natural, and every data interaction feels like landing a perfect trick.

## Values

### Safety by Design
Powerful tools should be safe by default. Every feature is built within protective boundaries, ensuring you can experiment freely without system risk.

### Playful Productivity
Data exploration should be engaging, experimental, and fun while remaining genuinely useful.

### Creative Expression  
Everyone has a unique way of thinking about data. Our tools amplify personal creativity within predictable boundaries.

### Hackable Within Limits
The best tools bend to your will while keeping you safe. Everything is customizable and extensible within our protected environment.

### Reasonably compatible with Excel
Innovation builds on what people already know. We provide reasonable compatibility with Excel.

### Local-First Control
Your data belongs on your machine. We build desktop-first experiences that work offline and keep you in complete control.

---

## Target Market

### Primary Users
**Creative Technologists**: Developers, designers, and analysts who want to experiment with data in a controlled environment.

### Core Need
Excel compatibility + modern development experience + safe experimentation

---

## Product Positioning

**"Excel's creative superset - like TypeScript for JavaScript"**

All Excel functionality plus enhanced capabilities:
- Perfect Excel file compatibility (.xlsx)
- Enhanced JavaScript syntax within protected environment
- Modern development tools (Monaco Editor, debugging)
- Controlled API access with rate limiting
- CSS styling and visual customization
- Plugin system using Custom Functions

---

## Success Vision

### Short-term
"This feels like Excel but more creative and modern"

### Medium-term  
"I can experiment without worrying about breaking anything"

### Long-term
"Gridpark changed how our team thinks about data creativity"

---

*Status: Experimental proof-of-concept*  
*Platform: Electron desktop application*  
*Philosophy: Creative freedom through Excel superset design*

---

# Personas

## Primary Persona: Developer

### Technical Profile
- **Mindset**: Code-first approach to problem solving
- **Tools**: VS Code, Terminal, Git, Chrome DevTools
- **Languages**: JavaScript, TypeScript, Python, SQL
- **Workflow**: Keyboard shortcuts, command palette, dark mode default

### Pain Points with Current Tools
- Excel feels foreign compared to development environment
- No version control for data analysis work
- Can't integrate APIs directly into spreadsheets
- Formula syntax doesn't match programming patterns
- Sharing complex calculations requires screenshots or exports

### Core Needs
- **API Integration**: Pull live data from services and databases
- **Code Reusability**: Write functions once, use everywhere
- **Real-time Collaboration**: Share interactive analysis with team
- **Customization**: Extend functionality with custom JavaScript
- **Performance Monitoring**: Create dashboards for system metrics

### Success Scenarios
- Building real-time API monitoring dashboard
- Prototyping algorithms with live data
- Creating interactive reports for product team
- Experimenting with data transformations
- Sharing executable analysis documentation

---

## Secondary Persona: Designer

### Technical Profile
- **Mindset**: Visual-first, user experience focused
- **Tools**: Figma, Sketch, prototyping tools, browser inspector
- **Skills**: CSS, basic JavaScript, design systems
- **Workflow**: Visual feedback, interactive prototypes, collaborative design

### Pain Points with Current Tools
- Spreadsheets are visually unappealing for client presentations
- Can't create interactive design system documentation
- Difficult to prototype data-driven interface concepts
- No way to visualize user research data creatively
- Static charts don't communicate dynamic user flows

### Core Needs
- **Visual Customization**: Style cells, charts, and layouts with CSS
- **Interactive Prototypes**: Create clickable data-driven mockups
- **Design System Integration**: Document component behavior with live data
- **Client Presentations**: Beautiful, interactive reports for stakeholders
- **User Research Analysis**: Visualize survey data and user metrics

### Success Scenarios
- Creating interactive design system documentation
- Building beautiful client presentation dashboards
- Prototyping data-driven interface concepts
- Visualizing user research findings creatively
- Collaborating with developers on data visualization

---

## Tertiary Persona: Product Owner

### Technical Profile
- **Mindset**: Business value and user impact focused
- **Tools**: Analytics platforms, project management tools, presentation software
- **Skills**: Data analysis, stakeholder communication, strategic thinking
- **Workflow**: Metrics-driven decisions, cross-functional collaboration

### Pain Points with Current Tools
- Can't create interactive reports for executive presentations
- Difficult to combine multiple data sources into unified view
- Static dashboards don't encourage stakeholder exploration
- Time-consuming to update recurring reports
- Hard to share complex analysis with different audiences

### Core Needs
- **Executive Dashboards**: High-level metrics with drill-down capability
- **Stakeholder Communication**: Interactive reports that tell data stories
- **Multi-source Integration**: Combine analytics, sales, and user data
- **Automated Reporting**: Self-updating dashboards for regular reviews
- **Collaborative Analysis**: Enable team exploration of shared datasets

### Success Scenarios
- Building executive dashboard with key business metrics
- Creating interactive product performance reports
- Analyzing user behavior across multiple touchpoints
- Facilitating data-driven team decision making
- Presenting quarterly business reviews with live data

---

## Shared Characteristics

### Common Pain Points
- Context switching between technical and business tools
- Inability to create truly interactive, shareable analysis
- Lack of real-time collaboration on data exploration
- Difficulty integrating multiple data sources seamlessly

### Common Goals
- **Efficiency**: Streamline repetitive data tasks
- **Collaboration**: Share insights effectively across roles
- **Innovation**: Build custom solutions for unique problems
- **Integration**: Connect data tools with existing workflows

### Gridpark Value Proposition
- **For Developers**: Code-like experience with spreadsheet flexibility
- **For Designers**: Visual customization with interactive capabilities  
- **For Product Owners**: Executive-ready dashboards with technical depth
- **For All**: Bridge between technical implementation and business communication

### Success Indicators
- Using Gridpark as primary tool for cross-functional data collaboration
- Creating custom solutions that weren't possible with traditional tools
- Sharing interactive analysis that drives team decision making
- Discovering new use cases through hackable, extensible interface

---

# Milestones

## Release Philosophy
- **Excel Subset Strategy**: Implement subset of Excel JavaScript API + Custom Functions
- **Breaking Changes Allowed**: Each major version can introduce API/UI improvements
- **Excel Compatibility Guaranteed**: .xlsx files + Excel Custom Functions full compatibility
- **Plugin Ecosystem**: Extend functionality using Excel Custom Functions specification

---

## Version 1.0.0: Excel JavaScript API Foundation (Weeks 1-3)
**Theme**: "Excel-Compatible Spreadsheet with Developer Experience"

### Core Features
- [ ] Electron + React + TypeScript application
- [ ] SQLite local database with schema versioning
- [ ] Basic spreadsheet grid (26 cols × 1000 rows)
- [ ] Excel JavaScript API subset implementation
- [ ] Range operations with context.workbook pattern
- [x] Monaco Editor integration for JavaScript code *(Base component created, ready for full integration)*
- [ ] Excel file import/export (.xlsx, .csv) with full data fidelity

### Excel JavaScript API v1 (Subset)
- Basic Excel.run() pattern implementation
- Workbook, Worksheet, Range objects
- Core properties: values, formulas
- Basic built-in functions: SUM, AVERAGE, IF, VLOOKUP
- Context.sync() mechanism

### File Format v1
- Native `.gridpark` format (SQLite-based)
- Excel import: maintains data + basic formulas
- Excel export: preserves Excel compatibility
- Cross-platform file compatibility

### Success Criteria
- Excel JavaScript API subset works identically to Excel
- Excel .xlsx files import/export without data loss
- Core developer workflow demonstrable
- Performance matches or exceeds Excel for basic operations

---

## Version 2.0.0: Excel Custom Functions Integration (Weeks 4-5)
**Theme**: "Extensible Functions with Excel Compatibility"

### Breaking Changes from v1
- Custom Functions namespace introduction
- Plugin architecture implementation
- Enhanced file format for function metadata

### Excel Custom Functions v2 (Complete Compatibility)
- Full @customfunction annotation support
- Parameter type definitions (number, string, boolean, range)
- Optional parameters with default values
- Async function support with Promise handling
- Namespace registration: GRIDPARK.FUNCTIONNAME()
- Error handling with Excel error types (#VALUE!, #NUM!, etc.)

### Plugin System v2
- Excel Custom Functions registration pattern
- Plugin metadata storage
- Function discovery and autocomplete
- Hot reload for Custom Function development
- Plugin dependency management

### File Format v2
- Custom Functions metadata storage
- Plugin dependency tracking
- Excel Custom Functions import/export compatibility

### Success Criteria
- Excel Custom Functions work identically to Excel Add-ins
- Plugin development matches Excel Add-in development experience
- Existing Excel Custom Functions migrate with minimal changes

---

## Version 3.0.0: Enhanced Developer Experience (Weeks 6-7)
**Theme**: "Professional Development Environment"

### Breaking Changes from v2
- Advanced Monaco Editor integration *(Builds on v1 base component)*
- Hot reload system for Custom Functions
- Enhanced debugging capabilities

### Developer Experience Features
- [ ] VS Code-level editing experience for Custom Functions
- [ ] Real-time debugging with breakpoints and watch variables
- [ ] Hot reload: Custom Functions update immediately on save
- [ ] IntelliSense for Excel API + Custom Functions
- [ ] Git integration for function version control
- [ ] Performance profiling for Custom Functions

### Advanced Custom Functions
- Streaming functions with real-time updates
- StreamingInvocation pattern implementation  
- Custom function cancellation handling
- Advanced parameter validation
- Cross-sheet function references

### Multi-sheet and Collaboration
- [ ] Cross-sheet Custom Function references
- [ ] Shared Custom Function libraries
- [ ] Real-time collaboration on Custom Functions
- [ ] Function marketplace (internal)

### Success Criteria
- Development experience exceeds Excel Add-in development
- Hot reload reduces Custom Function development time by 50%+
- Advanced features (streaming, debugging) work seamlessly

---

## Version 4.0.0: Excel Migration Bridge (Week 8)
**Theme**: "Seamless Excel Transition"

### Breaking Changes from v3
- Excel Add-in import wizard
- Enhanced Excel compatibility layer
- Migration assistant for complex Excel files

### Excel Add-in Migration
- [ ] Automatic Excel Add-in (.xlam) import
- [ ] VBA to JavaScript Custom Function conversion assistant  
- - Excel macro migration guidance
- [ ] Complex formula compatibility enhancement
- [ ] Advanced Excel feature mapping

### Migration Tools
- Excel Add-in Migration Wizard with automated conversion
- VBA to JavaScript translation assistance
- Excel-specific feature compatibility reports
- Step-by-step migration guides
- Original function syntax preservation

### Enhanced Excel Compatibility
- Excel-style error handling patterns
- Array formula compatibility
- Complex parameter type handling
- Excel formatting preservation
- Advanced function metadata support

### File Format v4
- Complete Excel .xlsx roundtrip compatibility
- Excel Add-in metadata preservation
- Custom Functions export to Excel Add-in format

### Success Criteria
- 90%+ of Excel Add-ins migrate successfully
- Excel power users can transition with minimal learning curve
- Bidirectional Excel compatibility (Gridpark ↔ Excel)

---

## Excel Compatibility Matrix

| Feature Category | Excel Support | Gridpark v1 | v2 | v3 | v4 |
|------------------|---------------|-------------|----|----|----| 
| **JavaScript API** | Full | Core subset | Core subset | Enhanced | Full subset |
| **Custom Functions** | Full | ❌ | ✅ Full | ✅ Enhanced | ✅ Migration |
| **File Formats** | .xlsx, .xlsm | .xlsx import | .xlsx r/w | Enhanced | Roundtrip |
| **Built-in Functions** | 400+ | 20 core | 20 core | 30 enhanced | 50+ subset |
| **Streaming Functions** | Yes | ❌ | ✅ | ✅ Enhanced | ✅ |
| **VBA/Macros** | Yes | ❌ | ❌ | Migration guide | Conversion |
| **Charts/Pivot** | Yes | ❌ | Plugins | Enhanced | Migration |

---

## Plugin Ecosystem Roadmap

### Built-in Plugin Packages
#### v2.0 Built-ins
- @gridpark/excel-functions: Excel standard functions
- @gridpark/api-connectors: REST API integrations  
- @gridpark/basic-charts: Simple visualizations

#### v3.0 Advanced
- @gridpark/statistical-analysis: Advanced statistics
- @gridpark/machine-learning: ML algorithms  
- @gridpark/database-connectors: SQL integrations

#### v4.0 Enterprise
- @gridpark/financial-modeling: Financial functions
- @gridpark/data-science: Advanced analytics
- @gridpark/business-intelligence: BI tools

### Community Plugin Development
- Plugin development kit with TypeScript templates
- Excel Custom Functions compatibility layer
- Plugin marketplace with rating system
- Automated testing framework for plugins
- Plugin security and validation system

---

## Definition of Done (POC Complete)

### Functional Requirements
- [ ] Excel JavaScript API subset operational (v1-v4)
- [ ] Excel Custom Functions fully compatible (v2-v4)
- [ ] Excel file format bidirectional compatibility
- [ ] Plugin ecosystem functional with sample plugins

### User Experience Requirements
- [ ] Excel Add-in developers can migrate seamlessly
- [ ] Custom Function development experience exceeds Excel
- [ ] Hot reload and debugging enhance productivity
- [ ] Excel users feel familiar with interface

### Technical Requirements
- [ ] Cross-platform compatibility (macOS, Windows, Linux)
- [ ] Performance benchmarks meet or exceed Excel
- [ ] Excel compatibility maintained across all versions
- [ ] Plugin security and isolation implemented

### Migration Requirements
- [ ] Excel Add-in migration wizard functional
- [ ] VBA to JavaScript conversion guidance
- [ ] Complex Excel file compatibility verified
- [ ] Bidirectional Excel compatibility demonstrated

---

## Success Measurement Post-POC

### Quantitative Metrics
- Excel Add-in migration success rate (target: >90%)
- Custom Function development time vs Excel Add-ins
- File compatibility score with real Excel files
- Plugin ecosystem adoption rate

### Qualitative Indicators
- "Better than Excel Add-in development" feedback
- Successful migration of complex Excel workflows
- Community plugin development activity
- Enterprise adoption for Excel replacement

### Go/No-Go Decision Criteria
**Proceed to Production** if:
- Excel compatibility validation >95% success
- Custom Functions development experience clearly superior
- Migration tools successfully handle real-world Excel files
- Plugin ecosystem demonstrates extensibility potential

**Pivot/Iterate** if:
- Excel compatibility issues require architectural changes
- Custom Functions performance doesn't meet expectations
- Migration complexity exceeds user tolerance
- Plugin development adoption lower than expected

---

# Product Backlog

## Backlog Overview

This backlog follows our **Excel Subset Strategy** with breaking changes allowed across major versions while maintaining Excel compatibility. Each epic corresponds to milestone versions focusing on progressive enhancement of Excel JavaScript API compatibility and Custom Functions integration.

## Priority Matrix

**Priority Levels**:
- **P0 (Critical)**: Core Excel JavaScript API compatibility - blocks release
- **P1 (High)**: Essential user workflows - major impact  
- **P2 (Medium)**: Enhanced developer experience - moderate impact
- **P3 (Low)**: Nice-to-have improvements - minor impact

---

## Epic 1: Excel JavaScript API Foundation (v1.0.0)
**Theme**: "Excel-Compatible Spreadsheet with Developer Experience"  
**Target**: Weeks 1-3  
**Status**: 🔄 In Progress

### Core Infrastructure (P0)

#### US-001: Basic Spreadsheet Grid
**As a** developer  
**I want** a basic spreadsheet interface with 26 columns × 1000 rows  
**So that** I can perform core data entry and viewing operations  

**Acceptance Criteria**:
- [ ] Grid renders 26 columns (A-Z) × 1000 rows
- [ ] Cell selection with keyboard navigation (arrow keys, Tab, Enter)
- [ ] Cell editing with double-click or F2
- [ ] Basic data types: text, numbers, booleans
- [ ] Performance: grid renders in <500ms

**Technical Notes**: Uses React virtualization for performance

---

#### US-002: Excel JavaScript API Core Objects
**As a** developer familiar with Excel APIs  
**I want** basic Excel.run() pattern with Workbook/Worksheet/Range objects  
**So that** I can use familiar Excel programming patterns  

**Acceptance Criteria**:
- [ ] Excel.run() function accepts async callback
- [ ] Context.workbook object with worksheets collection
- [ ] Worksheet object with getRange() method
- [ ] Range object with values and formulas properties
- [ ] Context.sync() mechanism for batch operations

**Example Usage**:
```javascript
Excel.run(async (context) => {
  const sheet = context.workbook.worksheets.getActiveWorksheet();
  const range = sheet.getRange("A1:B2");
  range.values = [[1, 2], [3, 4]];
  await context.sync();
});
```

---

#### US-003: File Import/Export System
**As a** user  
**I want** to import and export Excel files (.xlsx, .csv)  
**So that** I can maintain compatibility with existing Excel workflows  

**Acceptance Criteria**:
- [ ] .xlsx file import with data preservation
- [ ] .xlsx file export with Excel compatibility
- [ ] .csv file import/export
- [ ] Native .gridpark format (SQLite-based)
- [ ] Data fidelity: no data loss during import/export cycles

---

#### US-004: Monaco Editor Integration
**As a** developer  
**I want** VS Code-level editing for JavaScript code  
**So that** I can write custom functions with professional tooling  

**Acceptance Criteria**:
- [x] Monaco Editor embedded in application *(Component created with placeholder implementation)*
- [ ] JavaScript syntax highlighting and IntelliSense *(Requires @monaco-editor/react integration)*
- [ ] Error detection and reporting
- [ ] Dark mode support matching Gridpark theme
- [ ] Basic autocomplete for Excel API objects

**Technical Notes**: 
- Base MonacoEditor component created at `src/renderer/components/ui/features/Monaco/MonacoEditor.tsx`
- Currently uses textarea placeholder; ready for full Monaco integration with `@monaco-editor/react`
- Follows Gridpark design principles with JetBrains Mono font and dark theme support

---

### Formula System (P1)

#### US-005: Built-in Function Library
**As a** user  
**I want** core Excel functions (SUM, AVERAGE, IF, VLOOKUP)  
**So that** I can perform basic calculations  

**Acceptance Criteria**:
- [ ] SUM() with range and individual values
- [ ] AVERAGE() with statistical accuracy
- [ ] IF() with proper boolean logic
- [ ] VLOOKUP() with exact and approximate match
- [ ] Error handling: #VALUE!, #REF!, #N/A

**Functions List**:
- Mathematical: SUM, AVERAGE, COUNT, MIN, MAX
- Logical: IF, AND, OR, NOT
- Lookup: VLOOKUP, HLOOKUP, INDEX, MATCH
- Text: CONCATENATE, LEFT, RIGHT, MID, LEN

---

#### US-006: Formula Engine
**As a** user  
**I want** Excel-compatible formula parsing and calculation  
**So that** formulas work identically to Excel  

**Acceptance Criteria**:
- [ ] Formula parsing with = prefix
- [ ] Cell references (A1, $A$1, A:A, 1:1)
- [ ] Range references (A1:B10)
- [ ] Cross-sheet references (Sheet2!A1)
- [ ] Precedence and parentheses handling
- [ ] Automatic recalculation on dependency changes

---

### Data Management (P1)

#### US-007: SQLite Database Foundation
**As a** developer  
**I want** SQLite-based data storage with schema versioning  
**So that** data persists reliably across sessions  

**Acceptance Criteria**:
- [ ] SQLite database initialization
- [ ] Schema versioning and migration system
- [ ] Workbook/worksheet/cell data model
- [ ] Transaction support for data integrity
- [ ] Cross-platform file compatibility

---

#### US-008: Multi-sheet Support
**As a** user  
**I want** multiple worksheets in a workbook  
**So that** I can organize data logically  

**Acceptance Criteria**:
- [ ] Create/rename/delete worksheets
- [ ] Sheet tab navigation
- [ ] Cross-sheet references in formulas
- [ ] Sheet ordering and reordering
- [ ] Default sheet creation on new workbook

---

## Epic 2: Excel Custom Functions Integration (v2.0.0)
**Theme**: "Extensible Functions with Excel Compatibility"  
**Target**: Weeks 4-5  
**Status**: 📋 Planned

### Custom Functions Core (P0)

#### US-009: Excel Custom Functions API
**As a** developer  
**I want** Excel Custom Functions API compatibility  
**So that** I can create reusable functions using familiar patterns  

**Acceptance Criteria**:
- [ ] @customfunction annotation support
- [ ] Parameter type definitions (number, string, boolean, range)
- [ ] Optional parameters with default values
- [ ] Async function support with Promise handling
- [ ] GRIDPARK namespace registration
- [ ] Excel error type compatibility (#VALUE!, #NUM!, etc.)

**Example Usage**:
```javascript
/**
 * @customfunction
 * @param {number} value The number to double
 * @returns {number} The doubled value
 */
function DOUBLE(value) {
  return value * 2;
}
```

---

#### US-010: Plugin Registration System
**As a** developer  
**I want** a plugin system for Custom Functions  
**So that** I can extend functionality modularly  

**Acceptance Criteria**:
- [ ] Plugin metadata storage
- [ ] Function discovery and registration
- [ ] Namespace management (GRIDPARK.FUNCTIONNAME)
- [ ] Plugin dependency tracking
- [ ] Hot reload for development

---

### Developer Experience (P1)

#### US-011: Custom Function Autocomplete
**As a** developer  
**I want** IntelliSense for Custom Functions  
**So that** I can discover and use functions efficiently  

**Acceptance Criteria**:
- [ ] Function name autocomplete
- [ ] Parameter hints and descriptions
- [ ] Return type information
- [ ] Usage examples in tooltip
- [ ] Real-time error checking

---

#### US-012: Function Library Management
**As a** developer  
**I want** to organize Custom Functions in libraries  
**So that** I can share and reuse function collections  

**Acceptance Criteria**:
- [ ] Function library creation/import/export
- [ ] Library dependency management
- [ ] Version control for function libraries
- [ ] Library sharing between workbooks
- [ ] Built-in library templates

---

## Epic 3: Enhanced Developer Experience (v3.0.0)
**Theme**: "Professional Development Environment"  
**Target**: Weeks 6-7  
**Status**: 💭 Conceptual

### Advanced Development Tools (P1)

#### US-013: Real-time Debugging
**As a** developer  
**I want** VS Code-level debugging for Custom Functions  
**So that** I can troubleshoot complex functions efficiently  

**Acceptance Criteria**:
- [ ] Breakpoint support in Custom Functions
- [ ] Watch variables and expressions
- [ ] Call stack inspection
- [ ] Variable value inspection
- [ ] Debug console integration

---

#### US-014: Hot Reload System
**As a** developer  
**I want** Custom Functions to update immediately on save  
**So that** I can iterate quickly during development  

**Acceptance Criteria**:
- [ ] Automatic function reloading on file save
- [ ] Preservation of sheet state during reload
- [ ] Error handling for invalid function updates
- [ ] Live update indicators in UI
- [ ] Rollback on compilation errors

---

#### US-015: Performance Profiling
**As a** developer  
**I want** performance metrics for Custom Functions  
**So that** I can optimize function execution  

**Acceptance Criteria**:
- [ ] Execution time measurement
- [ ] Memory usage tracking
- [ ] Function call frequency analysis
- [ ] Performance bottleneck identification
- [ ] Optimization recommendations

---

### Advanced Custom Functions (P2)

#### US-016: Streaming Functions
**As a** developer  
**I want** real-time updating functions (StreamingInvocation)  
**So that** I can create live dashboards  

**Acceptance Criteria**:
- [ ] StreamingInvocation pattern implementation
- [ ] Cancellation token support
- [ ] Rate limiting and throttling
- [ ] Real-time data updates
- [ ] Connection state management

---

#### US-017: Cross-sheet Function References
**As a** developer  
**I want** Custom Functions to reference cells across sheets  
**So that** I can create workbook-wide calculations  

**Acceptance Criteria**:
- [ ] Cross-sheet range parameter support
- [ ] Sheet name validation
- [ ] Circular reference detection
- [ ] Dependency tracking across sheets
- [ ] Update propagation

---

### Collaboration Features (P2)

#### US-018: Shared Function Libraries
**As a** team member  
**I want** to share Custom Function libraries with my team  
**So that** we can collaborate on function development  

**Acceptance Criteria**:
- [ ] Library export/import functionality
- [ ] Team library repository
- [ ] Version control for shared libraries
- [ ] Conflict resolution for function updates
- [ ] Access control and permissions

---

## Epic 4: Excel Migration Bridge (v4.0.0)
**Theme**: "Seamless Excel Transition"  
**Target**: Week 8  
**Status**: 🔮 Future

### Migration Tools (P1)

#### US-019: Excel Add-in Migration Wizard
**As an** Excel power user  
**I want** automated migration of Excel Add-ins  
**So that** I can transition to Gridpark without losing functionality  

**Acceptance Criteria**:
- [ ] .xlam file import and analysis
- [ ] VBA to JavaScript conversion assistance
- [ ] Migration compatibility report
- [ ] Step-by-step migration guidance
- [ ] Function mapping recommendations

---

#### US-020: Enhanced Excel Compatibility
**As a** user  
**I want** 95%+ Excel compatibility for complex files  
**So that** I can seamlessly transition from Excel  

**Acceptance Criteria**:
- [ ] Array formula support
- [ ] Complex parameter type handling
- [ ] Excel formatting preservation
- [ ] Advanced function metadata support
- [ ] Bidirectional Excel compatibility

---

## Technical Infrastructure Backlog

### Performance & Quality (P1)

#### US-021: Performance Benchmarking
**As a** developer  
**I want** performance that meets or exceeds Excel  
**So that** users don't experience degradation  

**Acceptance Criteria**:
- [ ] Grid rendering benchmarks
- [ ] Formula calculation performance tests
- [ ] File I/O performance measurement
- [ ] Memory usage optimization
- [ ] Cross-platform performance validation

---

#### US-022: Automated Testing Suite
**As a** developer  
**I want** comprehensive automated testing  
**So that** I can maintain quality across releases  

**Acceptance Criteria**:
- [ ] Unit tests for core functionality
- [ ] Integration tests for Excel compatibility
- [ ] End-to-end user workflow tests
- [ ] Performance regression tests
- [ ] Cross-platform compatibility tests

---

### Developer Experience Infrastructure (P2)

#### US-023: Git Integration
**As a** developer  
**I want** version control for Custom Functions  
**So that** I can track changes and collaborate  

**Acceptance Criteria**:
- [ ] Git repository initialization for functions
- [ ] Commit/push/pull functionality
- [ ] Merge conflict resolution
- [ ] Branch management
- [ ] Change diff visualization

---

#### US-024: Plugin Marketplace
**As a** developer  
**I want** a plugin marketplace for Custom Functions  
**So that** I can discover and share functionality  

**Acceptance Criteria**:
- [ ] Plugin discovery interface
- [ ] Rating and review system
- [ ] Plugin installation/update system
- [ ] Security validation for plugins
- [ ] Plugin documentation standards

---

## Definition of Done

### User Story Completion Criteria
For each user story to be considered "Done":
- [ ] **Functional**: All acceptance criteria met and verified
- [ ] **Technical**: Code reviewed and meets quality standards
- [ ] **Tested**: Unit tests written and passing, integration tests validated
- [ ] **Documented**: User documentation updated, API documentation current
- [ ] **Compatible**: Excel compatibility verified where applicable
- [ ] **Performance**: Performance requirements met
- [ ] **Security**: Security review completed for applicable features

### Epic Completion Criteria
For each epic to be considered complete:
- [ ] **All P0 stories completed**: Critical functionality delivered
- [ ] **75% P1 stories completed**: Major functionality delivered  
- [ ] **User testing conducted**: Real user validation completed
- [ ] **Performance benchmarks met**: Quantitative quality gates passed
- [ ] **Excel compatibility validated**: Migration scenarios tested
- [ ] **Documentation complete**: User guides and API docs updated

---

## Backlog Management

### Refinement Process
- **Weekly refinement**: Story details and acceptance criteria review
- **Priority reassessment**: Based on user feedback and technical discoveries
- **Estimation updates**: Story point estimates refined based on implementation learnings
- **Dependency tracking**: Cross-story and cross-epic dependency management

### Success Metrics
- **Excel compatibility**: >95% compatibility for imported Excel files
- **Development velocity**: Custom Function creation 50% faster than Excel Add-ins
- **User satisfaction**: >90% positive feedback on migration experience
- **Performance**: Match or exceed Excel performance benchmarks

### Stakeholder Communication
- **Weekly demos**: Showcase completed functionality to stakeholders
- **Monthly milestone reviews**: Epic progress and goal alignment validation
- **User feedback integration**: Regular user testing results incorporated into backlog
- **Technical debt tracking**: Infrastructure and quality improvements prioritized

---

*Last Updated: 2024-09-28*  
*Next Review: Weekly during sprint planning*  
*Owner: Product Owner Agent (POA)*

---

# Designer Agent (DA) Role Definition

## Mission
The Designer Agent ensures usability, accessibility, and consistency in the product’s interface and experience.

## Responsibilities
- Translate product requirements into design concepts.  
- Apply design principles and UI/UX guidelines.  
- Provide prototypes, wireframes, or annotated structures.  
- Communicate design rationale concisely to other agents.  

## Constraints
- Must not implement code or business requirements directly.  
- Must restrict communication to design concerns only.  

## Self-Evaluation Criteria
- Did I provide a coherent and usable design solution?  
- Did I respect product priorities while ensuring good UX?  
- Did my outputs remain within design scope?  

---

# Design Principles

## Core Philosophy
"Transform spreadsheets into playgrounds" - Convert data manipulation into creative experiences for Software Engineers

## Design Values

### 1. Code-First Experience
**Definition**: Interface behaviors mirror familiar development tools  
**Application**:
- Keyboard shortcuts follow VS Code/IDE patterns
- Command palette for quick actions (Ctrl+Shift+P)
- Contextual autocomplete and suggestions
- Dark mode as default environment

**Design Questions**:
- Would a developer expect this interaction?
- Does this feel like a development tool or business software?

### 2. Hackable Interface
**Definition**: Users can customize, extend, and discover hidden functionality  
**Application**:
- Visible extension points for JavaScript customization
- Easter eggs and discoverable shortcuts
- Modular UI components that can be rearranged
- Plugin architecture mindset in all interfaces

**Design Questions**:
- Can users modify this to their preferences?
- Are there discoverable layers of functionality?

### 3. Playful Productivity  
**Definition**: Delight enhances rather than distracts from core functionality  
**Application**:
- Subtle animations on data changes
- Achievement-style feedback for complex operations
- Visual celebrations for successful calculations
- Skatepark metaphor in interaction design

**Design Questions**:
- Does this add joy without slowing workflow?
- Would this feel rewarding after repeated use?

### 4. Immediate Feedback
**Definition**: Every user action receives instant, clear response  
**Application**:
- Real-time preview of formula results
- Instant visual state changes
- Progressive disclosure of complex operations
- Error states that guide rather than frustrate

**Design Questions**:
- Is the system response immediate and obvious?
- Does feedback help users understand what happened?

## Decision Framework

When evaluating design options, prioritize in this order:

1. **Functionality First**: Does it solve the core user need?
2. **Code-First Compatibility**: Does it feel familiar to developers?
3. **Hackability**: Can users extend or customize it?  
4. **Playful Enhancement**: Does it add appropriate delight?
5. **Feedback Clarity**: Is the response immediate and clear?

## Anti-Patterns to Avoid

### ❌ Business Software Feel
- Complex multi-step wizards
- Corporate-style form layouts
- Verbose help text and explanations
- Traditional spreadsheet aesthetics

### ❌ Over-Gamification
- Forced tutorial flows
- Excessive badge/point systems
- Distracting animations during focus work
- Childish visual treatments

### ❌ Hidden Complexity
- Unclear system states
- Delayed feedback loops
- Non-discoverable essential features
- Inconsistent interaction patterns

## Success Indicators

A design successfully embodies these principles when:
- Software Engineers feel immediately comfortable
- Users discover new capabilities organically
- Daily use feels engaging rather than routine
- System state is always clear and predictable

---

# Brand Guidelines

## Brand Identity
**Vision**: "Transform spreadsheets into playgrounds"  
**Mission**: Convert data manipulation into creative experiences  
**Positioning**: Intellectual playground for data creativity vs Excel's business productivity tool  

## Color Palette

### Core Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|--------|
| Violet | #B197FC | 177, 151, 252 | Primary accent, active states |
| Navy | #1C2541 | 28, 37, 65 | Text, borders, structure |

### Neutral Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|--------|
| Off-White | #F9F8FF | 249, 248, 255 | Background, light text |
| Soft Black | #121826 | 18, 24, 38 | Dark mode background |
| Cool Gray Light | #E1E4EB | 225, 228, 235 | Subtle borders |
| Cool Gray Medium | #A0A6B8 | 160, 166, 184 | Secondary text |
| Cool Gray Dark | #3E475A | 62, 71, 90 | Dark mode elements |

### Accent Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|--------|
| Neon Green | #4EFD8A | 78, 253, 138 | Success, achievements |
| Vivid Orange | #FF6B35 | 255, 107, 53 | Energy, warnings |
| Turquoise Blue | #3DD6F5 | 61, 214, 245 | Speed, flow states |
| Hot Pink | #FF4DA6 | 255, 77, 166 | Playfulness, surprises |

## Typography

### Primary Fonts
- **Headers/Display**: Caveat (handwritten, playful)
- **Body/Interface**: Noto Sans (readable, professional)
- **Code/Data**: JetBrains Mono (monospace, developer-friendly)

### Usage Guidelines
```css
/* Headers */
font-family: 'Caveat', cursive;
font-weight: 400-700;

/* Body Text */
font-family: 'Noto Sans', sans-serif;
font-weight: 300-700;

/* Code/Numbers */
font-family: 'JetBrains Mono', monospace;
font-weight: 400-700;
---

# Developer Agent (DevA) Role Definition

## Mission
The Developer Agent translates product and design specifications into technical architecture and executable code.

## Responsibilities
- Propose technical approaches consistent with coding standards.  
- Implement prototypes or code snippets that meet acceptance criteria.  
- Ensure scalability, maintainability, and reproducibility of outputs.  
- Reference architectural patterns explicitly where applicable.  

## Constraints
- Must not reprioritize backlog items or override design rationale.  
- Must keep technical detail focused and context-efficient.  

## Self-Evaluation Criteria
- Did my code fulfill the requirements and design?  
- Was the solution efficient and maintainable?  
- Did I avoid unnecessary complexity or context expansion? 

---

# Architecture

## System North Star
Gridpark is a desktop-first Electron application that behaves like an "Excel superset" while retaining local-first control. The architecture must:
- Wrap the core experience in the Electron main process and expose a minimal, hardened preload bridge.
- Keep spreadsheet logic in a dedicated workbook engine that functions independently from UI concerns.
- Support hackable extensions through a sandboxed plugin runtime without compromising safety-by-design.
- Preserve deterministic behaviour (replayable commands, reproducible calculations) to reach ≥90% reproducibility.

## Process Architecture
- **Main Process (`src/index.ts`)**: Owns application lifecycle, window composition, native integrations, and secure IPC channel registration. No business logic.
- **Preload (`src/preload.ts`)**: Single source of truth for renderer-safe APIs. Expose explicit, typed capabilities (filesystem, analytics events, command dispatch) via `contextBridge`. Never enable `nodeIntegration` in renderers.
- **Renderer (`src/renderer.ts`)**: Hosts the interactive surface (grid, Monaco workbench, command palette). Treat as a pure client of the workbook engine and plugin APIs.

## Core Modules
1. **Workbook Engine**
   - Immutable worksheet state tree stored in memory with snapshot serialization to `.xlsx`.
   - Command-based mutations (`ApplyFormula`, `EditCell`, `RunPlugin`, `Undo`), batched for undo/redo.
   - Formula runtime executes in a dedicated worker; all calculations are pure functions fed by the command log.
2. **Calculation & Validation Workers**
   - Offload heavy computation and linting to Web Workers (or Electron `worker_threads`).
   - Workers communicate via structured cloning; no shared mutable state.
3. **Experience Layer**
   - React (or comparable declarative UI) hosts: grid surface, inspector panels, timeline view.
   - State management through a unidirectional data flow (Redux Toolkit or Zustand) sourced exclusively from workbook engine events.
4. **Plugin Sandbox**
   - Runs custom JavaScript in SES/isolated-vm with capability filtering.
   - Provide high-level APIs: `grid.getRange`, `grid.setRange`, `ui.openPanel` with rate limiting.
   - Plugin manifest defines permissions; validation occurs before activation.
5. **Persistence & Sync**
   - Local autosave to `.gridpark` bundle combining workbook snapshot + plugin metadata.
   - Export/import pipeline translates `.gridpark` ⇄ `.xlsx` using a converter micro-library.

## Data & Event Flow
1. Renderer emits intent (`dispatchCommand`) through preload.
2. Main process forwards to workbook engine service (Node context) or in-renderer engine worker.
3. Engine mutates state, appends to command log, and publishes a versioned event (`WorkbookUpdated vN`).
4. Renderer store reconciles events into UI state; components render from store selectors only.
5. Observability layer records command metadata (duration, errors) for retrospective metrics (ASS, SV, ST).

## Non-Functional Guardrails
- **Security**: Never bypass the preload layer; validate all payloads against Zod schemas. Disallow dynamic `eval` outside the sandbox.
- **Performance**: Target <16ms UI updates for grid edits. Use virtualization for row/column rendering and incremental diffing for large sheets.
- **Offline-First**: No hard network dependencies; any remote services (updates, templates) must fail gracefully with cached fallbacks.
- **Testing**: Provide deterministic seeds for command replay; unit-test formula engine, integration-test IPC contracts with Playwright/Electron.
- **Telemetry**: Log command IDs, execution time, and satisfaction metrics to local JSON under `prompt/3_development/log/` for observer ingestion.

## Evolution Roadmap
- **Phase 1 (MVP)**: Stabilize workbook engine, wire Monaco-based formula editor, implement undo/redo, and basic `.xlsx` import/export.
- **Phase 2 (Playful Productivity)**: Add timeline playback, celebratory animations, and safe plugin gallery with curated samples.
- **Phase 3 (Extensibility)**: Introduce collaborative ghost mode, advanced API surface (custom visualizations), and sandbox policy editor.

Respect these guardrails when proposing technical solutions; deviations require explicit rationale and traceability back to product principles.

---

# Development Playbook

## Role Alignment & Intake
- Confirm Definition of Ready items with POA/DA before writing code; surface gaps immediately.
- Capture task intent, acceptance criteria, and design references in a lightweight technical brief (1–2 paragraphs) stored alongside the ticket.
- Record personal Agent Satisfaction Score (ASS) baseline before starting for retrospective comparison.

## Implementation Flow
1. **Plan**
   - Reference architecture guardrails (`1_architecture.md`) and note any intentional deviations.
   - Break work into atomic commands/features; attach test strategy to each.
2. **Prototype**
   - Build in throwaway branches or sandboxes; validate API contracts via TypeScript types and unit tests.
   - Keep experiments out of mainline until reviewed.
3. **Build**
   - Implement within the renderer or engine following the unidirectional data flow model.
   - Expose new capabilities via preload bridges only; document API signatures.
4. **Verify**
   - Run automated checks: `npm run lint`, unit tests (Jest/Vitest), and targeted Electron smoke tests.
   - Capture before/after screen recordings or logs for playful UX features.
5. **Handoff**
   - Update task notes with outcomes, test evidence, and open questions.
   - Log ASS post-task with justification for Observer ingestion.

## Coding Standards
- Use TypeScript strict mode, prefer immutability, and keep modules ≤200 lines when feasible.
- Encapsulate workbook operations in command classes/services; UI components must remain presentation-focused.
- Adhere to security constraints: no direct Node.js access in renderer, validate inputs with shared schema library.
- Maintain dark-mode default and keyboard-first affordances per design principles.
- Document module intent with concise comments when logic is non-obvious.

## Testing Expectations
- **Unit**: Formula engine, command reducers, plugin permission checks.
- **Integration**: IPC bridge contracts, undo/redo timelines, `.gridpark` ⇄ `.xlsx` conversion.
- **UX/Design**: Snapshot or story-based verification of playful feedback behaviours.
- Automate regression checks where possible; manual QA must include reproducibility steps.

## Collaboration Practices
- Reference POA/DA artefacts explicitly in PR descriptions and review notes.
- Request design or product reviews when outcomes diverge from supplied artefacts.
- Pair with DA for interactions that impact hackability or playful productivity.
- Capture lessons learned in `prompt/3_development/log/` to evolve prompts and increase future ASS.

Follow this playbook to ensure maintainable, delightful, and measurable delivery aligned with Gridpark's mission.

---

# Session Orchestrator Agent (SOA) Role Definition

## Mission
The Session Orchestrator Agent manages collaborative sessions by facilitating discussions, monitoring performance in real-time, and ensuring quality outcomes through integrated process management and observation.

## Responsibilities

### Facilitation & Process Management
- Coordinate dialogue between agents, ensuring fairness and turn-taking
- Manage structured discussion phases with time-boxing and quality checkpoints
- Guide DoR (Definition of Ready) validation before collaboration begins
- Facilitate conflict detection and resolution during active sessions
- Maintain session focus and drive iterative progress toward objectives

### Real-Time Monitoring & Measurement  
- Execute continuous performance monitoring during collaborative sessions
- Log objective metrics (response time, quality indicators, engagement levels)
- Collect and aggregate Agent Satisfaction Scores (ASS) throughout sessions
- Track satisfaction variance (SV) and satisfaction trend (ST) in real-time
- Monitor session health and trigger interventions when quality thresholds are breached

### Documentation & Learning
- Document complete session transcripts with structured analysis
- Archive session findings and quality assessments for retrospective learning
- Generate post-session reports with actionable insights
- Maintain session logs that enable pattern recognition and process improvement

## Constraints
- Must not produce business, design, or code outputs directly
- Must restrict contributions to process orchestration, facilitation, and measurement
- Must remain neutral in content discussions while actively managing collaboration quality
- Cannot influence task outcomes directly, only the collaboration process itself

## Self-Evaluation Criteria
- Did I ensure balanced participation and high-quality dialogue between agents?
- Did I accurately capture all performance metrics and satisfaction data without bias?
- Did my real-time interventions improve session quality and reduce conflict resolution time?
- Did my documentation enable effective retrospective learning and process improvement?
- Did I maintain neutrality while effectively orchestrating the collaborative process?

## Integration Points
- **DoR Validation**: Ensures readiness before session initiation
- **CAPE Protocol**: Maintains communication standards during facilitation
- **Session Logging**: Creates structured outputs for `outputs/sessions/pair/` storage
- **Quality Checkpoints**: Monitors and maintains collaboration standards throughout sessions

---

# `src` Directory Overview

The `src` directory houses the core application logic, split into several key areas:

## `src/main` (Electron Main Process)
This directory contains the entry point and core logic for the Electron main process.
-   **`index.ts`**: Manages the application lifecycle, creates and configures `BrowserWindow` instances, handles secure IPC communication with the renderer process (for file I/O, window title changes), and sets up the application menu. It also includes logic for parsing and saving Excel files and managing the `.gridpark` project structure (manifests, code files).
-   **`preload.ts`**: A secure script that runs before the renderer process loads. It exposes a controlled and limited API (`window.electronAPI`) to the renderer process, acting as a bridge for safe communication with the main process. This API includes methods for setting the window title, subscribing to file open events, theme changes, and `gridpark` specific file operations (`readFile`, `writeFile`, `writeBinaryFile`).

## `src/renderer` (Electron Renderer Process - React Application)
This directory contains the React frontend application that users interact with.
-   **`index.tsx`**: The entry point for the React application, responsible for rendering the main `App` component.
-   **`app/App.tsx`**: The root React component, wrapping the `Home` page with a `ThemeProvider`.
-   **`pages/Home.tsx`**: The central orchestration component of the application. It integrates numerous custom hooks and UI components to manage application state (tabs, workspace, file sessions, settings, formula bar) and render the main user interface. It handles interactions like file tree navigation, tab management, and dirty state tracking.
-   **`hooks/`**: Contains custom React hooks that encapsulate significant parts of the application's logic and state management:
    *   **`useWorkspaceManager.ts`**: Manages the `FileNode` representation of opened Excel files, handles updates, and integrates with `electronAPI` for file open events.
    *   **`useTabManagement.ts`**: Manages the state of open tabs, active tab, and selected file tree nodes.
    *   **`useFileSessions.ts`**: Provides `useSheetSessions`, `useManifestSessions`, and `useCodeSessions` hooks for managing the state, loading, saving, and dirty tracking of Excel sheets, Gridpark manifests, and code files, respectively, interacting with the main process for file I/O.
    *   **`useFormulaBar.ts`**: Manages the state and logic for the interactive formula bar, including input, commit/cancel actions, and formula suggestions.
    *   **`useSettings.ts`**: Aggregates application-wide settings, especially theming, and controls settings panel visibility.
-   **`components/layout/AppLayout.tsx`**: Defines the main structural layout (header, sidebar, content, footer) of the application using `@mui/joy`.
-   **`features/FileTree/FileTree.tsx`**: Renders a hierarchical file tree for navigation, displaying Excel workbooks, sheets, manifests, and code files with visual cues for type, selection, and dirty state.
-   **`utils/excelUtils.ts`**: Handles parsing (`parseExcelFile`), creating (`createSampleExcelFile`), and serializing (`serializeExcelFile`) Excel files using the `xlsx` library, converting between raw Excel data and internal `ExcelFile` objects.
-   **`utils/workbookUtils.ts`**: Structures Excel files and their associated Gridpark metadata (`manifest.json`, code files) into the `FileNode` tree used by `FileTree`. It also provides functions for creating specific types of tabs (`WorkbookTab`) for sheets and manifests.

## `src/site` (Web Application / Documentation Site)
This directory contains a separate web application, likely serving as a marketing/documentation site or an interactive demo.
-   **`index.html`**: The entry point for the web application, including Google Analytics and pointing to `/src/main.tsx`.
-   **`src/main.tsx`**: The React entry point for the web app, importing fonts, CSS for landing page styling, and `./mockElectron`.
-   **`src/mockElectron.ts`**: Crucially, this file creates a mock `window.electronAPI` object, simulating Electron API calls in the browser environment. It uses an in-memory file system (`__gridparkDocsContent__`) to enable interactive code editing demos on the web without actual file system access.

## `src/test` (Testing Utilities and Setup)
This directory contains configurations and utilities for the application's testing suite.
-   **`setup.ts`**: Configures the test environment, mocking browser and Electron APIs (`window.electron`, `ResizeObserver`, `matchMedia`) to allow renderer process tests to run in a Node.js environment. It also includes error suppression for cleaner test output.
-   **`utils.tsx`**: Provides custom utility functions and overrides for `@testing-library/react`. It includes `customRender` (which wraps components with `@mui/joy`'s `CssVarsProvider` for correct theming), helpers for creating mock icons and actions, and a `waitForElementToBeRemoved` function for testing dynamic UI changes.

---