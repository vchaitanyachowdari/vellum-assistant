import * as net from 'node:net';
import * as readline from 'node:readline';
import { getSocketPath } from './util/platform.js';
import {
  serialize,
  createMessageParser,
  type ClientMessage,
  type ServerMessage,
} from './daemon/ipc-protocol.js';

export async function startCli(): Promise<void> {
  const socketPath = getSocketPath();
  const socket = net.createConnection(socketPath);
  const parser = createMessageParser();
  let sessionId = '';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt(): void {
    rl.setPrompt('you> ');
    rl.prompt();
  }

  function send(msg: ClientMessage): void {
    socket.write(serialize(msg));
  }

  socket.on('data', (data) => {
    const messages = parser.feed(data.toString()) as ServerMessage[];
    for (const msg of messages) {
      switch (msg.type) {
        case 'session_info':
          sessionId = msg.sessionId;
          process.stdout.write(
            `\n  Session: ${msg.title}\n  Type your message. Ctrl+D to detach.\n\n`,
          );
          prompt();
          break;

        case 'assistant_text_delta':
          process.stdout.write(msg.text);
          break;

        case 'message_complete':
          process.stdout.write('\n\n');
          prompt();
          break;

        case 'tool_use_start':
          process.stdout.write(`\n[Tool: ${msg.toolName}]\n`);
          break;

        case 'tool_result':
          process.stdout.write(
            `[Result: ${msg.result.slice(0, 200)}]\n`,
          );
          break;

        case 'confirmation_request': {
          const reqId = msg.requestId;
          rl.question(
            `[Permission] ${msg.toolName}: allow/always/deny/never? `,
            (answer) => {
              const map: Record<string, 'allow' | 'always_allow' | 'deny' | 'always_deny'> = {
                allow: 'allow',
                always: 'always_allow',
                deny: 'deny',
                never: 'always_deny',
              };
              const decision = map[answer.trim().toLowerCase()] ?? 'deny';
              send({
                type: 'confirmation_response',
                requestId: reqId,
                decision,
              });
            },
          );
          break;
        }

        case 'error':
          process.stdout.write(`\n[Error: ${msg.message}]\n`);
          prompt();
          break;

        case 'session_list_response':
          for (const session of msg.sessions) {
            process.stdout.write(`  ${session.id}  ${session.title}\n`);
          }
          prompt();
          break;

        case 'pong':
          break;
      }
    }
  });

  rl.on('line', (line) => {
    const content = line.trim();
    if (content) {
      send({ type: 'user_message', sessionId, content });
    }
  });

  rl.on('close', () => {
    process.stdout.write('\nDetaching from vellum...\n');
    process.exit(0);
  });

  // Ctrl+C also detaches (don't kill daemon)
  process.on('SIGINT', () => {
    rl.close();
  });

  socket.on('close', () => {
    process.stdout.write('\nDisconnected from daemon.\n');
    process.exit(1);
  });

  socket.on('error', (err) => {
    process.stderr.write(`Connection error: ${err.message}\n`);
    process.exit(1);
  });
}
