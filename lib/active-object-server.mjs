import { Container, Route } from './registry.mjs'
import http from 'node:http';
export class ActiveObjectServer extends Container {
    constructor() {
        super({
            root: {
                container: {
                    members: {
                        state: {
                            value: {
                                isStarting: false,
                                isRequest: false,
                            }
                        },
                        server: {
                            value: http.createServer()
                        },
                        requests: {
                            value: []
                        },
                        handle: {
                            callback: async () => {
                                const server = await this.server;
                                const requests = await this.requests;
                                const state = await this.state;
                                server.on("request", (request, response) => {
                                    const path = request.url.toLowerCase();
                                    const headers = request.headers;
                                    let content = '';
                                    request.on('data', (chunk) => content += chunk);
                                    request.on('end', async () => {
                                        const { username, hashedpassphrase, sessionauthtoken } = headers;
                                        requests.unshift({ username, path, hashedpassphrase, sessionauthtoken, content, complete: ({ statusCode, statusMessage, content, contentType }) => {
                                            response.writeHead(statusCode, statusMessage, {
                                                'Content-Length': Buffer.byteLength(content),
                                                'Content-Type': contentType
                                            });
                                            response.end(content);
                                        }});
                                        const id = setInterval(async () => {
                                            if (!state.isStarting) {
                                                try {
                                                    state.isRequest = true;
                                                    clearInterval(id);
                                                    let request =  requests.shift();
                                                    while (request) {
                                                        let { path, content, username, hashedpassphrase, sessionauthtoken } = request;
                                                        if (username || sessionauthtoken) {
                                                            const route = new Route({ path, content, username, storeAuthToken: process.env.GIT, hashedPassphrase: hashedpassphrase, sessionAuthToken: sessionauthtoken });
                                                            {
                                                                const { statusCode, statusMessage, content, contentType } = await route.handle();
                                                                request.complete({ statusCode, statusMessage, content, contentType });
                                                            }
                                                        } else {
                                                            const statusMessage = '400 Bad Request';
                                                            const contentType = 'application/json';
                                                            request.complete({ statusCode: 400, statusMessage, content: JSON.stringify({ message: statusMessage }), contentType });
                                                        }
                                                        request = requests.shift();
                                                    }
                                                    state.isRequest = false;
                                                } catch(error) {
                                                    if (request) {
                                                        requests.unshift(request);
                                                    }
                                                    await logging.log(error);
                                                }
                                            }
                                        }, 100);
                                    });
                                });
                            },
                            args: {}
                        }
                    },
                    behaviour: {
                        singleton: true,
                        errorHalt: true
                    },
                    mocks: {}
                }
            }
        });
      
    }
    start() {
        return new Promise( async (resolve, reject) => {
            const port = process.env.PORT || 80;
            const server = await this.server;
            const logging = await this.logging;
            const requests = await this.requests;
            const state = await this.state;
            const id = setInterval(async () => {
                try {

                    if (requests.length === 0 && state.isRequest === false) {
                        state.isStarting = true;
                        clearInterval(id);
                        await server.close();
                        await logging.log(`server was stoppped on port ${port}`);
                        await server.listen(port, async () => {
                            state.isStarting = false;
                            await logging.log(`server is listening on port ${port}`);
                        });
                        resolve();
                    }
                } catch(error) {
                    state.isStarting = false;
                    reject(error);
                }
            }, 100);
        });
    }
}
