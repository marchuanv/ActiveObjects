import { Container, Route, UserSession } from './registry.mjs'
import http from 'node:http'
export class ActiveObjectServer extends Container {
    constructor() {
        super({
            members: {
                server: {
                    value: http.createServer()
                },
                configure: {
                    callback: async () => {
                        const server = await this.server;
                        server.on("request", (request, response) => {
                            const path = request.url.toLowerCase();
                            const headers = request.headers;
                            let content = '';
                            request.on('data', (chunk) => content += chunk);
                            request.on('end', async () => {
                                const { username, hashedpassphrase, sessionauthtoken } = headers;
                                const route = new Route({ 
                                    path,
                                    content,
                                    username,
                                    storeAuthToken: process.env.GIT,
                                    hashedPassphrase: hashedpassphrase,
                                    sessionAuthToken: sessionauthtoken
                                });
                                const { statusCode, statusMessage, responseContent, contentType } = await route.handle();
                                response.writeHead(statusCode, statusMessage, {
                                    'Content-Length': Buffer.byteLength(responseContent),
                                    'Content-Type': contentType
                                });
                                response.end(responseContent);
                            });
                        });
                    },
                    args: {}
                }
            }
        });
    }
    async start() {
        const port = process.env.PORT || 80;
        const server = await this.server;
        const logging = await this.logging;
        server.listen(port, async () => await logging.log(`server is listening on port ${port}`));
    }
}
