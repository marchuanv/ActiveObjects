import {
    Container
} from '../../../lib/registry.mjs';
describe('when-activating-get-config-endpoint', () => {
    let $getClassEndpoint;
    beforeAll(() => {
        const container = new Container();
        ({ $getClassEndpoint } = container);
    });
    it('should get an instance', () => {
        expect($getClassEndpoint).toBeDefined();
    });
    it('should verify class members', () => {
        expect($getClassEndpoint.name).toBe('active-object-class-get');
    });
});