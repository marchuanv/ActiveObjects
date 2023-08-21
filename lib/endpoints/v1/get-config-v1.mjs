import { Container, Store, UserSession } from '../../registry.mjs';
import utils from 'utils'
export class GetConfigEndpoint extends Container {
    constructor({ username, path, sessionAuthToken, storeAuthToken }) {
        const filePath = 'active-object-config.json';
        super({
            root: {
                container: {
                    members: {
                        path: {
                            value: path
                        },
                        store: {
                            class: { Store },
                            args: {
                                filePath,
                                storeAuthToken
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
        const pathMatch = /\/api\/v1\/config\/get/g;
        return pathMatch.test(path);
    }
    async handle() {
        const session = await this.session;
        if ((await session.isAuthorised())) {
            const store = await this.store;
            const utils = await this.utils;
            const filePath = await this.filePath;

            if ((await store.exists())) {
                let content = await store.read();
                if (content) {
                    content = utils.getJSONObject(content);
                    return {
                        contentType: 'application/json',
                        statusCode: 200,
                        statusMessage: '200 Success',
                        content: utils.getJSONString({ message: 'Success', content })
                    };
                } else {
                    return {
                        contentType: 'application/json',
                        statusCode: 500,
                        statusMessage: '500 Internal Server Error',
                        content: utils.getJSONString({ message: `${filePath} exists but no content was found` })
                    };
                }
            } else {
                return {
                    contentType: 'application/json',
                    statusCode: 404,
                    statusMessage: '404 Not Found',
                    content: utils.getJSONString({ message: `${filePath} was not found` })
                };
            }
        } else {
            return {
                contentType: 'application/json',
                statusCode: 401,
                statusMessage: '401 Unauthorised',
                contents: utils.getJSONString({ message: 'user is not authorised' })
            };
        }
    }
}
