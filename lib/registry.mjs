export { Container } from 'module-container'
export { Route } from './route.mjs'
export { Github } from './github.mjs'
export { GithubMock } from './mocks/github.mjs'
export { Store } from './store.mjs'
export { GithubBranch } from './github-branch.mjs'
export { GithubFile } from './github-file.mjs'
export { ActiveObjectServer } from './server.mjs'
export { Logging } from './logging.mjs'
export { UserSession } from './user-session.mjs'

import { CreateClassEndpoint } from './endpoints/v1/create-class-v1.mjs'
import { CreateConfigEndpoint } from './endpoints/v1/create-config-v1.mjs'
import { DeleteClassEndpoint } from './endpoints/v1/delete-class-v1.mjs'
import { DeleteConfigEndpoint } from './endpoints/v1/delete-config-v1.mjs'
import { GetClassEndpoint } from './endpoints/v1/get-class-v1.mjs'
import { GetConfigEndpoint } from './endpoints/v1/get-config-v1.mjs'

export let v1Endpoints = {
    CreateClassEndpoint,
    CreateConfigEndpoint,
    DeleteClassEndpoint,
    DeleteConfigEndpoint,
    GetClassEndpoint,
    GetConfigEndpoint
};