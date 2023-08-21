let _logs = [];
process.on("exit", () => {
    if (process.environment.logging.enabled && process.environment.logging.onExit) {
        Logging.writeLogs(); 
    }
});
export class Logging {
    constructor({ contextId, contextName }) {
        this.contextId = contextId;
        this.contextName = contextName;
    }
    async log(message) {
        _logs.push({ contextId: this.contextId, contextName: this.contextName, date: new Date(), message });
        if (process.environment.logging.enabled && !process.environment.logging.onExit) {
            console.clear();
            Logging.writeLogs();
        }
    }
    static async writeLogs() {
        _logs = _logs.sort((x, y) => x.date.getTime() - y.date.getTime());
        const contextIds = [...new Set(_logs.map(x => x.contextId))];
        const contextNames = [...new Set(_logs.map(x => x.contextName))];
        for(const contextName of contextNames) {
            console.log(`\r\nClass: ${contextName}\r\n`);
            for (const contextId of contextIds) {
                if (_logs.find(x => x.contextName == contextName && x.contextId === contextId)) {
                    console.log(`\r\n   Instance: ${contextId}\r\n`);
                    for (let { date, message } of _logs.filter(x => x.contextId === contextId)) {
                        date = JSON.stringify(date);
                        if (message instanceof Error) {
                            const stack = message.stack.split('\n');
                            console.log(`       ${date}: ${stack.shift()}`);
                            for(const line of stack) {
                                console.log(`       ${Array.from(date).map(x => ' ').join('').replace(/\s+/g,'')}${line}`);
                            }
                        } else {
                            console.log(`       ${date}: ${message}`);
                        }
                    }
                }
            }
        }
    }
}