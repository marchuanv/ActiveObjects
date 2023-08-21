import { Container, GithubBranch, GithubFile } from './registry.mjs'
import path from 'node:path'
import utils from 'utils';
export class Store extends Container {
    constructor({ filePath, storeAuthToken }) {
        const fileName = path.basename(filePath).toLowerCase();
        const branchName = 'testing';
        super({
            root: {
                container: {
                    members: {
                        githubBranch: {
                            class: { GithubBranch },
                            args: { branchName, fileName, storeAuthToken }
                        },
                        githubFile: {
                            class: { GithubFile },
                            args: { branchName, fileName, storeAuthToken }
                        },
                        branchName: {
                            value: branchName
                        },
                        fileName: {
                            value: fileName
                        },
                        utils: {
                            value: utils
                        },
                        createBranch: {
                            callback: async () => {
                                const githubBranch = await this.githubBranch;
                                if ((!await githubBranch.exists())) {
                                    await githubBranch.create();
                                }
                            },
                            args: {}
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
    async exists() {
        const githubFile = await this.githubFile;
        return await githubFile.exists();
    }
    async write({ content }) {
        const githubFile = await this.githubFile;
        const utils = await this.utils;
        let _content = typeof content === 'object' ? JSON.stringify(content) : content;
        _content = utils.stringToBase64(_content);
        return await githubFile.ensureContent({ content: _content });
    }
    async read() {
        const githubFile = await this.githubFile;
        const utils = await this.utils;
        const content = await githubFile.getContent();
        return utils.base64ToString(content);
    }
    async remove() {
        const githubFile = await this.githubFile;
        return await githubFile.delete();
    }
}