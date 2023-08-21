import { SpecsHelper } from './specs-helper.mjs';
describe('when accessing a private member of the ActiveObjectServer class given a different context', () => {
    it('should return a security error and no return value', async () => {
        let error;
        let returnValue;
        const oas = await SpecsHelper.ctorActiveObjectServer();
        try {
            await oas.start();
            returnValue = await oas.server;
        } catch (err) {
            error = err;
        }
        expect(returnValue).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.message).toBe('server member is private for ActiveObjectServer');
    });
});
describe('when accessing a private member of the GithubMock class from a different context given that the class is configured as a singleton', () => {
    it('should return a security error and no return value', async () => {
        let error;
        let returnValue;
        const gitHub = await SpecsHelper.ctorGithubMock();
        try {
            await gitHub.refs;
            returnValue = await gitHub.octokit;
        } catch (err) {
            error = err;
        }
        expect(returnValue).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.message).toContain(`octokit member is private for GithubMock`);
    });
});
