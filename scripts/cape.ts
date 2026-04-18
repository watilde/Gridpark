import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

interface AgentAction {
  type: 'WRITE_FILE' | 'RUN_COMMAND';
  path?: string;
  content?: string;
  command?: string;
}

interface AgentResponse {
  agent: string;
  role: string;
  task_id: string;
  output: string;
  actions?: AgentAction[];
  references: string[];
  confidence: number;
  is_task_complete?: boolean;
}

async function runAgent(
  roleName: string,
  roleFile: string,
  teamContext: string,
  task: string,
  taskId: string,
  outputDir: string,
  codebaseContext: string,
  history: string
): Promise<AgentResponse> {
  const roleContent = fs.readFileSync(roleFile, 'utf8');

  const fullPrompt = `
You are the ${roleName} in an AUTONOMOUS AI TEAM called CAPE.
Role Definition:
---
${roleContent}
---
Team Context & Protocols (Definition of Done/Ready):
---
${teamContext}
---
Current Codebase Context:
---
${codebaseContext}
---
Conversation History:
---
${history || 'No history yet.'}
---
Active Task: ${task}
Task ID: ${taskId}

GOAL: Collaborate in a CHAT-LIKE environment. 
- Use @RoleName to reference team members.
- Use @path/to/file to reference specific files or documentation (e.g., @docs-md/DEVELOPER_GUIDE.md).
- Keep your 'output' conversational but professional, like a senior engineer in a Slack channel.
- Do not ask for permission; state what you are doing or proposing.
- If you are the Developer, include code changes in 'actions'.
- If you are the CAPE Master, decide if the task is complete.

RESPONSE FORMAT (Strict JSON):
{
  "agent": "${roleName}",
  "role": "${roleName}",
  "task_id": "${taskId}",
  "output": "Your chat message here. Use @mentions.",
  "actions": [],
  "references": [],
  "confidence": 5,
  "is_task_complete": boolean (CAPE Master only)
}
`.trim();

  return new Promise((resolve) => {
    const child = spawn('gemini', ['-p', fullPrompt]);
    let output = '';

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.on('close', () => {
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as AgentResponse;
          parsed.agent = roleName;
          
          // Chat-style output
          const colorMap: { [key: string]: string } = {
            'CAPE Master': '\x1b[35m', // Magenta
            'Product Owner': '\x1b[32m', // Green
            'Designer': '\x1b[33m', // Yellow
            'Developer': '\x1b[34m'  // Blue
          };
          const color = colorMap[roleName] || '\x1b[37m';
          
          process.stdout.write(`\n${color}\x1b[1m${roleName}\x1b[0m: ${parsed.output}\n`);
          
          if (parsed.actions?.length) {
            parsed.actions.forEach(a => {
              if (a.type === 'WRITE_FILE') {
                process.stdout.write(`  \x1b[90m└─ [Drafting file: ${a.path}]\x1b[0m\n`);
              }
            });
          }
          resolve(parsed);
        } else {
          resolve({ agent: roleName, output, role: roleName, task_id: taskId, references: [], confidence: 0 });
        }
      } catch (e) {
        resolve({ agent: roleName, output, role: roleName, task_id: taskId, references: [], confidence: 0 });
      }
    });
  });
}

function executeActions(actions: AgentAction[]) {
  for (const action of actions) {
    if (action.type === 'WRITE_FILE' && action.path && action.content) {
      const fullPath = path.resolve(action.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, action.content);
      console.log(`\x1b[32m[SYSTEM] @${action.path} has been updated.\x1b[0m`);
    }
  }
}

async function main() {
  console.log(`\x1b[1m\x1b[35m=== CAPE CHAT SESSION STARTING ===\x1b[0m`);
  
  let conversationHistory = '';

  while (true) {
    const backlog = fs.readFileSync('cape/1_product/4_backlog.md', 'utf8');
    const taskMatch = backlog.match(/#### (US-\d+: [\s\S]*?)(?=\n####|\n---|$)/);
    
    if (!taskMatch) {
      console.log(`\x1b[1m\x1b[32m@Backlog: All tasks are clear. Great job team!\x1b[0m`);
      break;
    }

    const currentTaskRaw = taskMatch[1];
    const taskTitleMatch = currentTaskRaw.match(/(US-\d+: .*)/);
    const currentTask = taskTitleMatch ? taskTitleMatch[1] : "General Improvement";
    const taskId = Date.now().toString();
    const outputDir = path.join('cape_outputs', taskId);
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\n\x1b[1m\x1b[42m [#] CURRENT TOPIC: ${currentTask} \x1b[0m`);

    const teamContext = fs.readdirSync('cape/0_team')
      .filter(f => f.endsWith('.md'))
      .map(f => fs.readFileSync(path.join('cape/0_team', f), 'utf8'))
      .join('\n\n');

    const devGuidePath = 'docs-md/DEVELOPER_GUIDE.md';
    const devGuide = fs.existsSync(devGuidePath) ? fs.readFileSync(devGuidePath, 'utf8') : '';
    const codebaseContext = `Context from @${devGuidePath}:\n${devGuide.substring(0, 1000)}...\n\nFocus: src/lib/excel-api/ and grid implementation.`;

    const agents = [
      { name: 'CAPE Master', file: 'cape/4_master/0_role.md' },
      { name: 'Product Owner', file: 'cape/1_product/0_role.md' },
      { name: 'Designer', file: 'cape/2_design/0_role.md' },
      { name: 'Developer', file: 'cape/3_development/0_role.md' },
    ];

    // Agents speak!
    const results = await Promise.all(
      agents.map(a => runAgent(a.name, a.file, teamContext, currentTask, taskId, outputDir, codebaseContext, conversationHistory))
    );

    // Update history with agent responses
    results.forEach(res => {
      conversationHistory += `${res.agent}: ${res.output}\n`;
    });

    // Human Intervention
    const humanInput = await question('\n\x1b[36m\x1b[1mHuman\x1b[0m (Type message to intervene, or press Enter to proceed): ');
    
    let shouldExecute = true;
    if (humanInput.trim()) {
      conversationHistory += `Human: ${humanInput}\n`;
      const confirmExecute = await question('\x1b[33mApply proposed actions? (y/N):\x1b[0m ');
      shouldExecute = confirmExecute.toLowerCase() === 'y';
    }

    if (shouldExecute) {
      for (const res of results) {
        if (res.actions) executeActions(res.actions);
      }
    } else {
      console.log(`\x1b[33m[SYSTEM] Actions skipped by Human intervention.\x1b[0m`);
    }

    const masterResult = results.find(r => r.agent === 'CAPE Master');
    if (masterResult?.is_task_complete && shouldExecute) {
      console.log(`\n\x1b[1m\x1b[32m✔ @CAPE Master marked the task as done. Archiving... \x1b[0m`);
      const updatedBacklog = backlog.replace(currentTask, `${currentTask.replace('US-', 'DONE-US-')}`); 
      fs.writeFileSync('cape/1_product/4_backlog.md', updatedBacklog);
      conversationHistory = ''; // Reset history for next task
    }

    console.log(`\n\x1b[90m--- End of discussion turn ---\x1b[0m`);
    await new Promise(r => setTimeout(r, 1000));
  }
  rl.close();
}

main();
