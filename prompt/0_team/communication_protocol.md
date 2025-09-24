# Communication Protocol for CAPE Agents

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