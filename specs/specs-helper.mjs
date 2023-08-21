import { UserSession, Store, Route, ActiveObjectServer, v1Endpoints, GithubMock } from '../lib/registry.mjs';
export class SpecsHelper {
    static async getStoreToken() {
        return process.env.GIT;
    }
    static HandleFetchRespond(response) {
        new Promise((resolve, reject) => {
            const dest = fs.createWriteStream(`filename.mp3`);
            response.body.pipe(dest);
            response.body.on('end', () => resolve());
            dest.on('error', reject);
        })
    }
    static async ctorUserSession(clearStore = true, register = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: `${args.username}.json` });
        }
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        const userSession = new UserSession(args);
        if (!(await userSession.isRegistered()) && register) {
            await userSession.register();
        }
        await userSession.authenticate();
        return userSession;
    }
    static async getUserSessionToken() {
        const userSession = await SpecsHelper.ctorUserSession(false);
        return await userSession.getSessionToken();
    }
    static async ctorStore({ filePath }) {
        return new Store({ filePath, storeAuthToken: process.env.GIT });
    }
    static async clearStore({ filePath }) {
        const store = await SpecsHelper.ctorStore({ filePath });
        await store.remove();
    }
    static async ctorActiveObjectServer() {
        return new ActiveObjectServer();
    }
    static async ctorGithubMock() {
        return new GithubMock();
    }
    static async ctorGetConfigRoute(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.path = '/api/v1/config/get';
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        return new Route(args);
    }
    static async ctorCreateConfigRoute(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: { className: 'HelloWorld', language: 'JavaScript', dependencyInjection: false } }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.path = '/api/v1/config/create';
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.content = JSON.stringify(args.content);
        return new Route(args);
    }
    static async ctorGetClassRoute(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.path = '/api/v1/class/get';
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        return new Route(args);
    }
    static async ctorCreateClassRoute(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: `class HelloWorld { sayHello() { console.log("hello"); }}` }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.path = '/api/v1/class/create';
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        return new Route(args);
    }

    static async ctorGetConfigRouteExists() {
        const route = await SpecsHelper.ctorCreateConfigRoute(true);
        await route.handle();
        return SpecsHelper.ctorGetConfigRoute(false);
    }
    static async ctorGetClassRouteExists() {
        const route = await SpecsHelper.ctorCreateClassRoute(true);
        await route.handle();
        return SpecsHelper.ctorGetClassRoute(false);
    }

    static async activeObjectServerHttpGetConfig(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/config/get`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'GET';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers });
        return response;
    }
    static async activeObjectServerHttpCreateConfig(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: { className: 'HelloWorld', language: 'JavaScript', dependencyInjection: false } }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/config/create`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'PUT';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers, body: JSON.stringify(args.content) });
        return response;
    }
    static async activeObjectServerHttpDeleteConfig(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/config/delete`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'DELETE';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers, body: JSON.stringify(args.content) });
        return response;
    }
    static async activeObjectServerHttpGetConfigExists() {
        await SpecsHelper.activeObjectServerHttpCreateConfig(true);
        return await SpecsHelper.activeObjectServerHttpGetConfig(false);
    }
    static async activeObjectServerHttpCreateConfigExists() {
        await SpecsHelper.activeObjectServerHttpCreateConfig(true);
        return SpecsHelper.activeObjectServerHttpCreateConfig(false);
    }
    static async activeObjectServerHttpDeleteConfigExists() {
        await SpecsHelper.activeObjectServerHttpCreateConfig(true);
        return await SpecsHelper.activeObjectServerHttpDeleteConfig(false);
    }

    static async activeObjectServerHttpGetClass(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/class/get`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'GET';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers });
        return response;
    }
    static async activeObjectServerHttpCreateClass(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: `class HelloWorld { sayHello() { console.log("hello"); }}` }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/class/create`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'PUT';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers, body: args.content });
        return response;
    }
    static async activeObjectServerHttpDeleteClass(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        const sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        const url = `http://localhost:${process.env.PORT || 80}/api/v1/class/delete`;
        const headers = { username: args.username, sessionAuthToken };
        const method = 'DELETE';
        const server = await SpecsHelper.ctorActiveObjectServer();
        await server.start();
        const response = await fetch(url, { method, headers, body: args.content });
        return response;
    }
    static async activeObjectServerHttpGetClassExists() {
        await SpecsHelper.activeObjectServerHttpCreateClass(true);
        return await SpecsHelper.activeObjectServerHttpGetClass(false);
    }
    static async activeObjectServerHttpCreateClassExists() {
        await SpecsHelper.activeObjectServerHttpCreateClass(true);
        return SpecsHelper.activeObjectServerHttpCreateClass(false);
    }
    static async activeObjectServerHttpDeleteClassExists() {
        await SpecsHelper.activeObjectServerHttpCreateClass(true);
        return await SpecsHelper.activeObjectServerHttpDeleteClass(false);
    }

    static async ctorCreateConfigEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: { className: 'HelloWorld', language: 'JavaScript', dependencyInjection: false } }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/config/create';
        args.content = JSON.stringify(args.content);
        return new v1Endpoints.CreateConfigEndpoint(args);
    }
    static async ctorGetConfigEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/config/get';
        return new v1Endpoints.GetConfigEndpoint(args);
    }
    static async ctorDeleteConfigEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-config.json' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/config/delete';
        return new v1Endpoints.DeleteConfigEndpoint(args);
    }
    static async ctorCreateConfigEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateConfigEndpoint(true);
        const response = await endpoint.handle();
        return await SpecsHelper.ctorCreateConfigEndpoint(false);
    }
    static async ctorGetConfigEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateConfigEndpoint(true);
        await endpoint.handle();
        return await SpecsHelper.ctorGetConfigEndpoint(false);
    }
    static async ctorDeleteConfigEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateConfigEndpoint(true);
        await endpoint.handle();
        return await SpecsHelper.ctorDeleteConfigEndpoint(false);
    }

    static async ctorCreateClassEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234', content: `class HelloWorld { sayHello() { console.log("hello"); }}` }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/class/create';
        return new v1Endpoints.CreateClassEndpoint(args);
    }
    static async ctorGetClassEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/class/get';
        return new v1Endpoints.GetClassEndpoint(args);
    }
    static async ctorDeleteClassEndpoint(clearStore = true, args = { username: 'Joe', passphrase: 'Joe1234' }) {
        if (clearStore) {
            await SpecsHelper.clearStore({ filePath: 'active-object-class.js' });
        }
        args.sessionAuthToken = await SpecsHelper.getUserSessionToken(args);
        args.storeAuthToken = await SpecsHelper.getStoreToken();
        args.path = '/api/v1/class/delete';
        return new v1Endpoints.DeleteClassEndpoint(args);
    }
    static async ctorCreateClassEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateClassEndpoint(true);
        const response = await endpoint.handle();
        return await SpecsHelper.ctorCreateClassEndpoint(false);
    }
    static async ctorGetClassEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateClassEndpoint(true);
        await endpoint.handle();
        return await SpecsHelper.ctorGetClassEndpoint(false);
    }
    static async ctorDeleteClassEndpointExists() {
        const endpoint = await SpecsHelper.ctorCreateClassEndpoint(true);
        await endpoint.handle();
        return await SpecsHelper.ctorDeleteClassEndpoint(false);
    }
}
