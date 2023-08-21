import { Container, Github, GithubMock } from "./registry.mjs";
export class GithubBranch extends Container {
   constructor({ branchName, storeAuthToken }) {
      super({
         root: {
            container: {
               members: {
                  github: {
                     class: { Github },
                     args: { auth: storeAuthToken },
                     mock: { GithubMock }
                  },
                  branchName: {
                     value: branchName
                  }
               },
               behaviour: {
                  singleton: false,
                  errorHalt: false
               }
            }
         }
      });
   }
   async exists() {
      const github = await this.github;
      const branchName = await this.branchName;
      return await github.request({ route: `GET /repos/marchuanv/active-objects/branches/${branchName}` });
   }
   async create() {
      const github = await this.github;
      const branchName = await this.branchName;
      const { data } = await github.request({ route: `GET /repos/marchuanv/active-objects/git/refs/heads` });
      let revision = data.shift().object.sha;
      if (revision) {
         await github.request({
            route: `POST /repos/marchuanv/active-objects/git/refs`, parameters: {
               ref: `refs/heads/${branchName}`,
               sha: revision
            }
         });
         return true;
      }
      return false;
   }
   async delete() {
      const github = await this.github;
      const branchName = await this.branchName;
      await github.request({ route: `DELETE /repos/marchuanv/active-objects/git/refs/heads/${branchName}` });
      return true;
   }
}
