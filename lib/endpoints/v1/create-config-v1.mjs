import { Container, Store, UserSession } from '../../registry.mjs';
import utils from 'utils'
export class CreateConfigEndpoint extends Container {
    constructor({ username, content, path, sessionAuthToken, storeAuthToken }) {
        const filePath = 'active-object-config.json';
        super({
            root: {
                container: {
                    members: {
                        path: {
                            value: path
                        },
                        content: {
                            value: content
                        },
                        store: {
                            class: { Store },
                            args: {
                                filePath, storeAuthToken
                            }
                        },
                        session: {
                            class: { UserSession },
                            args: { username, sessionAuthToken, storeAuthToken }
                        },
                        filePath: {
                            value: filePath
                        },
                        utils: {
                            value: utils
                        }
                    },
                    behaviour: {
                        singleton: false,
                        errorHalt: true
                    }
                }
            }
        });
    }
    async matchPath() {
        const path = await this.path;
        const pathMatch = /\/api\/v1\/config\/create/g;
        return pathMatch.test(path);
    }
    async handle() {
        const session = await this.session;
        if ((await session.isAuthorised())) {
            const store = await this.store;
            const utils = await this.utils;
            const filePath = await this.filePath;
            let content = await this.content;

            const requestTemplate = { className: 'HelloWorld', language: 'JavaScript', dependencyInjection: false };
            let isValid = true;
            content = utils.getJSONObject(content);
            if (content) {
                for (const prop of Object.keys(requestTemplate)) {
                    if (content[prop] === undefined) {
                        isValid = false;
                        break;
                    }
                }
            } else {
                isValid = false;
            }
            if (isValid) {
                if ((await store.exists())) {
                    return {
                        contentType: 'application/json',
                        statusCode: 409,
                        statusMessage: '409 Conflict',
                        content: utils.getJSONString({ message: `${filePath} already exist` })
                    };
                } else {
                    if ((await store.write({ content }))) {
                        return {
                            contentType: 'application/json',
                            statusCode: 200,
                            statusMessage: '200 Success',
                            content: utils.getJSONString({ message: `${filePath} was created` })
                        };
                    } else {
                        return {
                            contentType: 'application/json',
                            statusCode: 500,
                            statusMessage: '500 Internal Server Error',
                            content: utils.getJSONString({ message: `${filePath} was not created` })
                        };
                    }
                }
            } else {
                return {
                    contentType: 'application/json',
                    statusCode: 400,
                    statusMessage: '400 Bad Request',
                    content: utils.getJSONString(requestTemplate)
                };
            }
        } else {
            return {
                contentType: 'application/json',
                statusCode: 401,
                statusMessage: '401 Unauthorised',
                content: utils.getJSONString({ message: 'user is not authorised' })
            };
        }
    }
}
