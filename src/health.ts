import { createServer, type Server } from 'node:http';

export type HealthState = {
  startedAt: string;
  authenticated: boolean;
  socketConnected: boolean;
  processed: number;
  replied: number;
  errors: number;
};

export function startHealthServer(port: number, state: HealthState): Server {
  const server = createServer((request, response) => {
    if (request.url !== '/health') {
      response.writeHead(404).end();
      return;
    }
    const ready = state.authenticated && state.socketConnected;
    response.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: ready ? 'ok' : 'starting', ...state }));
  });
  server.listen(port, '0.0.0.0');
  return server;
}
