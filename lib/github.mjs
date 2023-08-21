import utils from 'utils';
import { Container } from './registry.mjs'
import { Octokit } from 'octokit';
export class Github extends Container {
    constructor({ auth }) {
        super({
            root: {
                container: {
                    members: {
                        promises: {
                            value: []
                        },
                        cache: {
                            value: []
                        },
                        octokit: {
                            class: { Octokit },
                            args: { auth }
                        }
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
                        const output = await this.request(promise);
                        await promise.resolve(output);
                    } catch (error) {
                        await promise.reject(error);
                    }
                }
            } else {
                try {
                    const index = promises.findIndex(x => x.id === id);
                    promises.splice(index, 1);
                    const octokit = await this.octokit;
                    const cache = await this.cache;
                    const routeId = utils.getBase64String(route);
                    if(route.startsWith('GET')) {
                        let cacheItem = cache.shift();
                        while(cacheItem){
                            if(cacheItem.routeId === routeId) {
                                cache.unshift(cacheItem);
                                return resolve(cacheItem.data);
                            }
                            cacheItem = cache.shift();
                        }
                        const output = await octokit.request(route, parameters);
                        cache.unshift( { routeId, data: output } );
                        resolve(output);
                    } else {
                        const output = await octokit.request(route, parameters);
                        const index = cache.findIndex(ci => ci.routeId === routeId);
                        if (index > -1) {
                            cache.splice(index, 1);
                        }
                        resolve(output);
                    }
                } catch (error) {
                    await reject(error);
                }
            }
        });
    }
}
