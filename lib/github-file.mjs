import { Container, Github, GithubMock } from "./registry.mjs";
export class GithubFile extends Container {
   constructor({ branchName, fileName, storeAuthToken }) {
      super({
         root: {
            container: {
               members: {
                  github: {
                     class: { Github },
                     args: { auth: storeAuthToken },
                     mock: { GithubMock },
                  },
                  branchName: {
                     value: branchName
                  },
                  fileName: {
                     value: fileName
                  },
                  jsFileNameExp: {
                     value: /^.js$/g
                  },
                  jsonFileNameExp: {
                     value: /^.json$/g
                  },
               },
               behaviour: {
                  singleton: false,
                  errorHalt: false
               }
            }
         }
      });
   }
   async getMetadata() {

      const github = await this.github;
      const jsFileNameExp = await this.jsFileNameExp;
      const jsonFileNameExp = await this.jsonFileNameExp;
      const branchName = await this.branchName;
      const fileName = await this.fileName;

      const _fileName = fileName.replace(jsFileNameExp, '.js').replace(jsonFileNameExp, '.json');
      const response = await github.request({ route: `GET /repos/marchuanv/active-objects/contents/${_fileName}?ref=${branchName}` });
      const { data } = response;
      return data;
   }
   async exists() {
      const metadata = await this.getMetadata();
      if (metadata) {
         return true;
      }
      return false;
   }
   async getContent() {
      const fileName = await this.fileName;
      const branchName = await this.branchName;
      const metadata = await this.getMetadata();
      if (!metadata) {
         throw new Error(`no '${fileName}' file(s) in the '${branchName}' branch.`);
      }
      return metadata.content;
   }
   async ensureContent({ content }) {

      const github = await this.github;
      const jsFileNameExp = await this.jsFileNameExp;
      const jsonFileNameExp = await this.jsonFileNameExp;
      const branchName = await this.branchName;
      const fileName = await this.fileName;
      const metadata = await this.getMetadata();

      const _fileName = fileName.replace(jsFileNameExp, '.js').replace(jsonFileNameExp, '.json');
      await github.request({
         route: `PUT /repos/marchuanv/active-objects/contents/${_fileName}`, parameters: {
            owner: 'marchuanv',
            repo: 'active-objects',
            path: `/${_fileName}`,
            message: 'created/updated',
            branch: branchName,
            committer: {
               name: 'active-objects-admin',
               email: 'active-objects-admin@gmail.com'
            },
            content,
            sha: metadata?.sha
         }
      });
      return true;
   }
   async delete() {

      const github = await this.github;
      const jsFileNameExp = await this.jsFileNameExp;
      const jsonFileNameExp = await this.jsonFileNameExp;
      const branchName = await this.branchName;
      const fileName = await this.fileName;
      const metadata = await this.getMetadata();

      const _fileName = fileName.replace(jsFileNameExp, '.js').replace(jsonFileNameExp, '.json');
      if (metadata) {
         await github.request({
            route: `DELETE /repos/marchuanv/active-objects/contents/${_fileName}`, parameters: {
               owner: 'marchuanv',
               repo: 'active-objects',
               path: `/${_fileName}`,
               message: 'deleted',
               branch: branchName,
               committer: {
                  name: 'active-objects-admin',
                  email: 'active-objects-admin@gmail.com'
               },
               sha: metadata?.sha
            }
         });
         return true;
      }
   }
}
