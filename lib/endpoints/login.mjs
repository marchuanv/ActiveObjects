import { Container, UserSession } from '../registry.mjs';
export class Login extends Container {
    constructor({ username, sessionAuthToken, passphrase, hashedPassphrase, storeAuthToken }) {
        super({
            members: {
                username: {
                    value: username
                },
                user: {
                    class: { UserSession },
                    args: { username, sessionAuthToken, passphrase, hashedPassphrase, storeAuthToken }
                }
            }
        });
    }
    async matchPath() {
        const path = await this.path;
        const pathMatch = /\/api\/login/g;
        return pathMatch.test(path);
    }
    async handle() {
        const user = await this.user;
        const username = await this.username;
        if ((await user.isAuthenticated())) {
            return {
                contentType: 'application/json',
                statusCode: 200,
                statusMessage: '200 Success',
                responseContent: utils.getJSONString({ message: `${username} is authenticated` })
            };
        } else {
            if ((await user.authenticate())) {
                return {
                    contentType: 'application/json',
                    statusCode: 200,
                    statusMessage: '200 Success',
                    responseContent: utils.getJSONString({ message: `${username} is authenticated` })
                };
            }
        }
        return {
            contentType: 'application/json',
            statusCode: 401,
            statusMessage: '401 Unauthorised',
            responseContent: utils.getJSONString({ message: `failed to authenticate ${username}` })
        };
    }
}
