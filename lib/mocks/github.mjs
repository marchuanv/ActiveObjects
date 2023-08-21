import utils from 'utils';
import { Container } from '../registry.mjs'
export class GithubMock extends Container {
    constructor() {
        super({
            root: {
                container: {
                    members: {
                        promises: {
                            value: []
                        },
                        octokit: {
                            value: {
                                refs: new Map(),
                                branches: new Map(),
                                content: new Map(),
                                Id: utils.generateGUID()
                            }
                        },
                        setup: {
                            args: {},
                            callback: async () => {
                                const octokit = await this.octokit;
                                octokit.refs.set('heads', {
                                    data: [{
                                        object: { sha: 12345678 }
                                    }]
                                });
                            }
                        },
                    },
                    behaviour: {
                        singleton: true,
                        errorHalt: true
                    }
                }
            }
        });
    }
    request({ route, parameters }) {
        return new Promise(async (resolve, reject) => {
            const id = utils.generateGUID();
            const promises = await this.promises;
            promises.push({ id, resolve, reject, route, parameters });
            if (promises.length > 1) {
                for (const promise of promises) {
                    try {
                        const output = await request(promise);
                        await promise.resolve(output);
                    } catch (error) {
                        await promise.reject(error);
                    }
                }
            } else {
                const index = promises.findIndex(x => x.id === id);
                promises.splice(index, 1);
                const octokit = await this.octokit;
                let isBranch = /\/branch/g.test(route);
                let isBranchRef = /git\/refs\/heads/g.test(route);
                if (!isBranchRef) {
                    isBranchRef = /\/git\/refs/g.test(route);
                }
                let fileMatches = /[a-zA-Z0-9\-]+\.((json)|(js))/g.exec(route);
                if (route.indexOf('GET /repos') > -1) {
                    if (isBranch) {
                        let branch = octokit.branches.get('testing');
                        if (branch) {
                            return resolve(true);
                        } else {
                            return reject(new Error('branch does not exist'));
                        }
                    }
                    if (isBranchRef) {
                        const data = octokit.refs.get('heads');
                        return resolve(data);
                    }
                    if (fileMatches.length > 0) {
                        const id = fileMatches[0];
                        let content = octokit.content.get(id);
                        if (content) {
                            return resolve({ data: { content } });
                        } else {
                            return resolve({ data: null });
                        }
                    }
                }
                if (route.indexOf('PUT /repos') > -1) {
                    if (fileMatches.length > 0) {
                        const id = fileMatches[0];
                        octokit.content.set(id, parameters.content);
                        return resolve();
                    }
                }
                if (route.indexOf('POST /repos') > -1) {
                    if (isBranchRef) {
                        const id = 'testing';
                        octokit.branches.set(id, 'testing');
                        return resolve();
                    }
                }
                if (route.indexOf('DELETE /repos') > -1) {
                    if (fileMatches.length > 0) {
                        const id = fileMatches[0];
                        if (octokit.content.has(id)) {
                            octokit.content.delete(id);
                            return resolve();
                        } else {
                            return reject(new Error('file does not exist'));
                        }
                    }
                }
                return reject(new Error('Not Implemented'));
            }
        });
    }
}
