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
