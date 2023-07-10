import { Container, Store } from '../../registry.mjs';
import utils from 'utils'
export class CreateConfigEndpoint extends Container {
    constructor({ path, content, token }) {
        super({
            path,
            content,
            store: {
                Store,
                ctorArgs: {
                    branchName: 'testing',
                    filePath: 'active-object-config.json',
                    token
                }
            },
            filePath: 'active-object-config.json',
            utils
        });
    }
    async matchPath() {
        const pathMatch = /\/api\/v1\/config\/create/g;
        return pathMatch.test(this.path);
    }
    async handle() {
        const requestTemplate = { className: 'HelloWorld', language: 'JavaScript', dependencyInjection: false };
        let isValid = true;
        let content = this.utils.getJSONObject(this.content);
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
            if ((await this.store.exists())) {
                return {
                    contentType: 'application/json',
                    statusCode: 409,
                    statusMessage: '409 Conflict',
                    responseContent: this.utils.getJSONString({ message: `${this.filePath} already exist` })
                };
            } else {
                await this.store.write({ content: this.content });
                return {
                    contentType: 'application/json',
                    statusCode: 200,
                    statusMessage: '200 Success',
                    responseContent: this.utils.getJSONString({ message: `${this.filePath} was created` })
                };
            }
        } else {
            return {
                contentType: 'application/json',
                statusCode: 400,
                statusMessage: '400 Bad Request',
                responseContent: this.utils.getJSONString(requestTemplate)
            };
        }
    }
}
