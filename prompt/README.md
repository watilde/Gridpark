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
