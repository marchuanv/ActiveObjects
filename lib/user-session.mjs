import { Container, Store } from './registry.mjs';
import utils from 'utils';
const users = new Map();
export class UserSession extends Container {
    constructor({ username, sessionAuthToken, hashedPassphrase, passphrase, storeAuthToken }) {
        const _username = username.toLowerCase();
        const filePath = `${_username}.json`;
        super({
            root: {
                container: {
                    members: {
                        username: {
                            value: _username
                        },
                        store: {
                            class: { Store },
                            args: {
                                filePath,
                                storeAuthToken
                            }
                        },
                        setup: {
                            callback: async () => {
                                users.delete(_username);
                                const store = await this.store;
                                let storedHashedPassphrase = null;
                                let storedHashedPassphraseSalt = null;
                                let storedDecryptionKey = null;
                                let storedEncryptionKey = null;
                                let sessionAuth = null;
                                if ((await store.exists())) {
                                    let content = await store.read();
                                    content = utils.getJSONObject(content);
                                    ({ storedHashedPassphrase, storedHashedPassphraseSalt, storedDecryptionKey, storedEncryptionKey } = content[_username]);
                                    if (sessionAuthToken) {
                                        sessionAuth = utils.base64ToString(sessionAuthToken);
                                        sessionAuth = JSON.parse(sessionAuth);
                                    }
                                }
                                users.set(_username, {
                                    sessionAuth,
                                    hashedPassphrase,
                                    storedHashedPassphrase,
                                    storedHashedPassphraseSalt,
                                    storedDecryptionKey,
                                    storedEncryptionKey,
                                    passphrase
                                });
                            },
                            args: {},
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
    async isAuthorised() {
        if ((await this.isAuthenticated())) {
            return true;
        }
        return false;
    }
    async isRegistered() {
        const username = await this.username;
        const user = users.get(username);
        let { storedHashedPassphrase, storedHashedPassphraseSalt, storedDecryptionKey } = user;
        if (storedHashedPassphrase || storedHashedPassphraseSalt || storedDecryptionKey) {
            return true;
        }
        return false;
    }
    async register() {
        if (!(await this.isRegistered())) {
            const username = await this.username;
            const store = await this.store;
            const user = users.get(username);
            let { storedHashedPassphrase, storedHashedPassphraseSalt, storedDecryptionKey, storedEncryptionKey, passphrase } = user;
            if (!passphrase) {
                throw new Error('passphrase was not provided');
            }
            ({ hashedPassphraseSalt: storedHashedPassphraseSalt, hashedPassphrase: storedHashedPassphrase } = utils.hashPassphrase(passphrase));
            ({ privateKey: storedDecryptionKey, publicKey: storedEncryptionKey } = utils.generatePublicPrivateKeys(storedHashedPassphrase));
            const content = {};
            user.storedHashedPassphrase = storedHashedPassphrase;
            user.storedHashedPassphraseSalt = storedHashedPassphraseSalt;
            user.storedDecryptionKey = storedDecryptionKey;
            user.storedEncryptionKey = storedEncryptionKey;
            content[username] = {
                storedHashedPassphrase,
                storedHashedPassphraseSalt,
                storedDecryptionKey,
                storedEncryptionKey
            };
            await store.write({ content });
            return true;
        }
        return false;
    }
    async authenticate() {
        const username = await this.username;
        const user = users.get(username);
        let { passphrase, hashedPassphrase, storedHashedPassphrase, storedHashedPassphraseSalt, storedDecryptionKey, storedEncryptionKey } = user;
        if (storedHashedPassphrase && storedHashedPassphraseSalt && storedDecryptionKey && storedEncryptionKey) {
            if (passphrase) {
                ({ hashedPassphrase } = utils.hashPassphrase(passphrase, storedHashedPassphraseSalt));
            }
            if (hashedPassphrase === storedHashedPassphrase) {
                const sessionAuth = { token: { hashedPassphrase }, username };
                const sessionAuthTokenStr = JSON.stringify(sessionAuth.token);
                sessionAuth.token = utils.encryptToBase64Str(sessionAuthTokenStr, storedEncryptionKey);
                user.sessionAuth = sessionAuth;
            }
        }
    }
    async isAuthenticated() {
        const username = await this.username;
        const user = users.get(username);
        const { storedHashedPassphrase, storedDecryptionKey, sessionAuth } = user;
        if (storedHashedPassphrase && storedDecryptionKey && sessionAuth) {
            let decrypted = utils.decryptFromBase64Str(sessionAuth.token, storedDecryptionKey, storedHashedPassphrase);
            decrypted = JSON.parse(decrypted);
            if (decrypted && sessionAuth.username === username && decrypted.hashedPassphrase === storedHashedPassphrase) {
                return true;
            }
        }
        return false;
    }
    async getSessionToken() {
        const username = await this.username;
        const { sessionAuth } = users.get(username);
        if (!(await this.isAuthenticated())) {
            throw new Error(`session is not authenticated for ${username}`);
        }
        return utils.stringToBase64(utils.getJSONString(sessionAuth));
    }
}
