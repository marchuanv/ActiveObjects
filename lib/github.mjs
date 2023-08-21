import { Container } from './registry.mjs'
import { Octokit } from 'octokit';
export class Github extends Container {
    constructor({ auth }) {
        super({
            root: {
                container: {
                    members: {
                        octokit: {
                            class: { Octokit },
                            args: { auth }
                        },
                        locked: {
                            value: false
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
    request({ route, parameters }) {
        return new Promise(async (resolve) => {
            if (this.locked) {
                setTimeout(async () => {
                    resolve((await request({ route, parameters })));
                }, 1000);
            } else {
                resolve((await this.octokit.request(route, parameters)));
            }
        });
    }
}
