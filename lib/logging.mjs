let _logs = [];
const logConfig = JSON.parse(process.env.LOG);
process.on("exit", () => {
    if (logConfig.enabled && logConfig.onExit) {
        Logging.writeLogs(); 
    }
});
let isLogging = false;
export class Logging {
    constructor({ contextId, contextName }) {
        this.contextId = contextId;
        this.contextName = contextName;
    }
    async log(message) {
        isLogging = true;
        _logs.push({ contextId: this.contextId, contextName: this.contextName, date: new Date(), message });
        if (logConfig.enabled) {
            setTimeout(() => {
                logConfig.onExit = false;
                if (isLogging) {
                    if (!logConfig.onExit) {
                        console.clear();
                        Logging.writeLogs();
                    }
                }
            },5000);
        }
        isLogging = false;
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