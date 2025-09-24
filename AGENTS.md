# AGENT.md

# CAPE: Collaborative Agents Prompt Engineering  

## Framework Overview
**CAPE (Collaborative Agents Prompt Engineering with Human Team Dynamics)** is a role-based multi-agent framework that emulates human team collaboration.  
The framework emphasizes **context-efficient communication**, **retrospective learning**, and **evolutionary prompt management**.  

A central novelty of CAPE is the introduction of the **Agent Satisfaction Score (ASS)** as the primary evaluation metric.  
This metric captures how well each agent perceives it has fulfilled its role, enabling team-like self-reflection and continuous improvement.

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
- **Role Prompts**: Each agent maintains prompts in `prompt/[role]/role_definition.md`.  
- **Version Control**: All prompt assets are managed via Git.  
- **Structured Logging**: JSON logs are maintained for all interactions and metrics.  
- **Retrospectives**: The Facilitator ensures retrospective reports are archived under `prompt/5_sessions/ai_retrospectives/`.  
- **Self-Organization Principle**: Agents must autonomously adjust their collaboration and prompts to improve satisfaction and task outcomes over successive iterations.  

### Example: Recommended Folder Structure

```
prompt/
├── 0_team/
│ ├── README.md # CAPE framework overview
│ ├── team_charter.md # Team charter and shared values
│ └── communication_protocol.md # Rules for agent-to-agent communication
│
├── 1_product/
│ ├── role_definition.md # Product Owner Agent prompts
│ ├── backlog_templates.md # Task and backlog templates
│ ├── user_story_formats.md # User story formats
│ └── log/
│ └── 2024-09-24_poa_session.md
│
├── 2_design/
│ ├── role_definition.md # Designer Agent prompts
│ ├── design_principles.md # Design guidelines
│ ├── prototype_templates.md # Prototyping templates
│ └── log/
│ └── 2024-09-24_da_session.md
│
├── 3_development/
│ ├── role_definition.md # Developer Agent prompts
│ ├── coding_standards.md # Coding standards
│ ├── architecture_patterns.md # Architecture guidelines
│ └── log/
│ └── 2024-09-24_deva_session.md
│
├── 4_facilitation/
│ ├── role_definition.md # Facilitator Agent prompts
│ ├── facilitation_guides.md # Facilitation guidelines
│ ├── retrospective_formats.md # Retrospective formats
│ └── log/
│ └── 2024-09-24_fa_session.md
│
├── 5_observer/
│ ├── role_definition.md # Observer Agent prompts
│ ├── metrics_schema.md # Definition of metrics (ASS, SV, TSR, etc.)
│ └── log/
│ └── 2024-09-24_oa_session.md
│
└── 6_sessions/
├── cross_role_templates.md # Templates for multi-agent sessions
├── decision_log.md # Records of team-level decisions
└── ai_retrospectives/
└── 2024-09-24_cape_retro.md
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
