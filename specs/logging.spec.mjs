import { Logging } from '../lib/logging.mjs';
describe('when logging messages given context', () => {
    let logging;
    beforeAll((done) => {
        logging = new Logging({ contextId: 'CONTEXT A', contextName: 'Logging' });
        logging.log('Hello World 1');
        logging.log('Hello World 2');
        logging.log('Hello World 3');
        logging.log('Hello World 4');
        setTimeout(() => {
            logging = new Logging({ contextId: 'CONTEXT B', contextName: 'Logging' });
            logging.log('Hello World 5');
            logging.log('Hello World 6');
            logging.log('Hello World 7');
            logging.log('Hello World 8');
            setTimeout(() => {
                done();
            }, 1000);
        }, 1000);
    });
    it('should display messages', async () => {
    });
});