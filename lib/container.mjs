import utils from "utils";

class MemberProperty {
   constructor({ member }) {
      this.Id = utils.generateGUID();
      if (member.isClass || member.isContainerClass || member.isValueType) {
         Object.defineProperty(member.context, member.name, {
            configurable: false,
            get: () => this.property.call(member.context, { member, args: null, value: null }),
            set: (value) => this.property.call(member.context, { member, args: null, value })
         });
      }
      if (member.isPublic) {
         Object.defineProperty(member.context, member.name, {
            configurable: false, value: async (_args) => {
               const stack = stackContext.get(member.context);
               stack.unshift({ context: member.context.constructor.name, function: member.name });
               await this.resolveDependencies({ member });
               return await member.call({ args: _args });
            }
         });
      }
   }
   async resolveDependencies({ member }, timeoutMill = 10) {
      return new Promise((resolve, reject) => {
         setTimeout(async () => {
            try {
               if (contextLock.has(member.context)) {
                  try {
                     await resolveDependencies({ member }, timeoutMill + 10);
                  } catch (error) {
                     console.log(error);
                  }
               } else {
                  contextLock.set(member.context, true);
                  for (const dependantMember of member.dependantMembers) {
                     if (dependantMember.isAsync && !dependantMember.isClass && !dependantMember.isContainerClass) {
                        await dependantMember.call({});
                     }
                  }
                  resolve();
               }
            } catch (error) {
               reject(error);
            } finally {
               contextLock.delete(member.context);
            }
         }, timeoutMill);
      });
   }
   property({ args, member, value }) {
      const context = member.context;
      const stack = stackContext.get(context);
      const stackItem = stack[0];
      let isValidStackCall = false;
      if (stackItem && stackItem.context === context.constructor.name) {
         isValidStackCall = true;
      }
      if (!isValidStackCall) {
         throw new Error(`Unable to access member: ${member.name}, it is private to: ${member.context.contextId}`);
      }
      if (member.isValueType) {
         if (value !== undefined && value !== null) {
            member.value = value;
         }
         return member.value;
      }
      if (member.isClass || member.isContainerClass) {
         let instance = null;
         let Class = dependencyMockMembers.get(member.func.name);
         if (!Class) {
            Class = member.func;
         }
         instance = new Class(member.args);
         console.log(`created new instance of ${instance.contextId}`);
         return instance;
      }
   }
}

class Member {
   constructor(name, func, args, isPublic, value, context) {
      const properties = {};
      if (members.has(this)) {
         properties = members.get(this);
      } else {
         members.set(this, properties);
      }

      properties.Id = `${context.contextId}-${name}`.toLowerCase();
      properties.context = context;
      properties.name = name;
      properties.func = func;
      properties.args = args || {};
      properties.isPublic = isPublic;

      const _name = func ? func.name : name;
      const script = func ? func.toString().toLowerCase().replace(/\s+/g, '') : '';
      const isAsyncMember = script ? script.startsWith(`async${_name.toLowerCase()}(`) || script.startsWith(`async(`) || script.indexOf('returnnewpromise(') > -1 : false;
      properties.isAsync = isAsyncMember;
      const isClassMember = script ? script.startsWith(`class${_name.toLowerCase()}`) : false;
      properties.isClass = isClassMember;
      const isContainerClassMember = script ? script.startsWith(`class${_name.toLowerCase()}extends${Container.name.toLowerCase()}`) : false;
      properties.isContainerClass = isContainerClassMember;
      const isValueTypeMember = (value !== undefined && value !== null && name) ? true : false;
      properties.isValueType = isValueTypeMember;
      properties.value = value;
      let dependantMembers = [];
      if (isPublic) {
         for (const dependantMember of getDependantMembers({ context }).filter(m => !m.isPublic && m.Id !== this.Id)) {
            dependantMembers.push(dependantMember);
         }
      }
      properties.dependantMembers = dependantMembers;
      new MemberProperty({ member: this });
   }
   get dependantMembers() {
      return members.get(this)["dependantMembers"];
   }
   get isAsync() {
      return members.get(this)["isAsync"];
   }
   get isContainerClass() {
      return members.get(this)["isContainerClass"];
   }
   get isClass() {
      return members.get(this)["isClass"];
   }
   get isValueType() {
      return members.get(this)["isValueType"];
   }
   get value() {
      return members.get(this)["value"];
   }
   set value(_value) {
      members.get(this)["value"] = _value;
   }
   get isPublic() {
      return members.get(this)["isPublic"];
   }
   get args() {
      return members.get(this)["args"];
   }
   get func() {
      return members.get(this)["func"];
   }
   get name() {
      return members.get(this)["name"];
   }
   get Id() {
      return members.get(this)["Id"];
   }
   get context() {
      return members.get(this)["context"];
   }
   async call({ args }) {
      return await this.func.call(this.context, args);
   }
}
const dependencyMembers = new Map();
const dependencyMockMembers = new Map();
const originalPrototypes = new Map();
const stackContext = new WeakMap;
const members = new WeakMap();
const contextLock = new WeakMap();

export class Container {
   constructor(config) {
      const context = this;
      const contextPrototype = context.constructor.prototype;
      this.contextId = `${context.constructor.name}(${utils.generateGUID()})`;
      dependencyMembers.set(this.contextId, []);
      stackContext.set(context, []);
      if (context.constructor.name === Container.name) {
         throw new Error('Container is an abstract class');
      }
      if (!originalPrototypes.has(this.contextId)) {
         originalPrototypes.set(this.contextId, Object.getOwnPropertyNames(contextPrototype));
      }
      if (areAllPublicMembersAsync({ context })) {
         mapValueTypeMembers({ config, context });
         mapClassMembers({ config, context });
         mapFunctionMembers({ config, context });
         mapPublicMembersFromPrototype({ context });
      } else {
         throw new Error(`all members of ${context.constructor.name} must be async`);
      }
      Object.freeze(this);
   }
   async mock({ Class, FakeClass }) {
      dependencyMockMembers.delete(Class.name);
      dependencyMockMembers.set(Class.name, FakeClass);
   }
}

const areAllPublicMembersAsync = ({ context }) => {
   const members = getDependantMembers({ context });
   const asyncMembers = members.filter(mi => mi.isAsync);
   return members.length === asyncMembers.length;
}

const mapPublicMembersFromPrototype = ({ context }) => {
   const memberExlusions = ['dependency', 'constructor'];
   const originalPrototype = originalPrototypes.get(context.contextId);
   const properties = originalPrototype.filter(prop => !memberExlusions.find(excl => excl === prop));
   const members = properties.map((prop) => {
      const member = context.constructor.prototype[prop];
      if (!member) {
         throw new Error('this should not happen');
      }
      return new Member(prop, member, {}, true, null, context);
   });
   const _dependencyMembers = dependencyMembers.get(context.contextId);
   for (const member of members) {
      _dependencyMembers.push(member);
   }
};

const mapClassMembers = ({ config, context }) => {
   const members = Object.keys(config).reduce((items, key) => {
      const childConfig = config[key];
      if (typeof childConfig === 'object') {
         const keys = Object.keys(childConfig);
         const Class = keys.filter(key2 => childConfig[key2] && childConfig[key2].name && getTypeName({ Class: childConfig[key2] }) === key).map(key => childConfig[key])[0]
         if (childConfig.ctorArgs && Class) {
            const member = new Member(key, Class, childConfig.ctorArgs, false, null, context);
            items.push(member);
         }
      }
      return items;
   }, []);
   const _dependencyMembers = dependencyMembers.get(context.contextId);
   for (const member of members) {
      _dependencyMembers.push(member);
   }
}

const mapValueTypeMembers = ({ config, context }) => {
   const members = Object.keys(config).reduce((items, key) => {
      const value = config[key];
      if (!value.ctorArgs && typeof value !== 'function') {
         const member = new Member(key, () => { }, null, false, value, context);
         items.push(member);
      }
      return items;
   }, []);
   const _dependencyMembers = dependencyMembers.get(context.contextId);
   for (const member of members) {
      _dependencyMembers.push(member);
   }
}

const mapFunctionMembers = ({ config, context }) => {
   const members = Object.keys(config).reduce((items, key) => {
      const func = config[key];
      if (typeof func === 'function') {
         const member = new Member(key, func, null, false, null, context);
         items.push(member);
      }
      return items;
   }, []);
   const _dependencyMembers = dependencyMembers.get(context.contextId);
   for (const member of members) {
      _dependencyMembers.push(member);
   }
}

const getTypeName = function ({ Class }) {
   let name = Class.name;
   name = name.charAt(0).toLowerCase() + name.slice(1);
   return name;
}

const getDependantMembers = ({ context }) => {
   return dependencyMembers.get(context.contextId);
}