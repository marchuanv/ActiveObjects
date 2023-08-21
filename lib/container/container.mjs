import utils from "utils";
import { MemberInfo } from "./member-info.mjs";
import { Member } from "./member.mjs";
import { Logging } from "./logging.mjs";
import { ContainerConfig } from "./container-config.mjs";
import { ContainerConfigTemplate } from "./container-config-template.mjs";

const membersInfo = new Map();
const originalPrototypes = new Map();
const singletons = new Map();
const loggers = new Map();
const configTemplate = new ContainerConfigTemplate();

export class Container {
   constructor(config) {
      const contextPrototype = this.constructor.prototype;
      const contextName = this.constructor.name;
      this.contextName = contextName;
      if (contextName === Container.name) {
         throw new Error('Container is an abstract class');
      }
      this.contextId = utils.generateGUID();
      const contextId = this.contextId;
      loggers.set(contextId, new Logging({ contextId, contextName }));
      if (!originalPrototypes.has(contextId)) {
         originalPrototypes.set(contextId, Object.getOwnPropertyNames(contextPrototype));
      }
      this.config = new ContainerConfig(configTemplate, config);
      if (areAllPublicMembersAsync.call(this)) {
         if (singletons.has(contextName)) {
            mapSingleton.call(this);
         } else {
            mapSingleton.call(this);
            mapPublicMembers.call(this);
            mapPrivateMembers.call(this, { config });
            if (!process.environment.isProduction) {
               configureMockedMembers.call(this, { config });
            }
            configureMembersBehaviour.call(this, { config });
            mapMemberDependencies.call(this, { config });
            setupMembers.call(this);
         }
      } else {
         throw new Error(`all members of ${contextName} must be async`);
      }
      Object.freeze(this);
   }
   get logging() {
      return loggers.get(this.contextId);
   }
}

const areAllPublicMembersAsync = function () {
   const _membersInfo = getMembersInfo.call(this);
   const asyncMembers = _membersInfo.filter(mi => mi.isAsync);
   return _membersInfo.length === asyncMembers.length;
}

const mapPublicMembers = function () {
   const memberExlusions = ['logging', 'constructor'];
   const originalPrototype = originalPrototypes.get(this.contextId);
   const memberNames = originalPrototype.filter(prop => !memberExlusions.find(excl => excl === prop));
   const newMembersInfo = memberNames.map((memberName) => {
      const member = this.constructor.prototype[memberName];
      if (!member) {
         throw new Error('this should not happen');
      }
      return new MemberInfo(memberName, member, {}, true, null, false, true, false, false, this.contextId);
   });
   for (const newMemberInfo of newMembersInfo) {
      getMembersInfo.call(this).push(newMemberInfo);
   }
};

const mapSingleton = function () {
   const contextName = this.contextName;
   this.config.reset();
   this.config.find('behaviour', (node) => {
      node.reset();
      while (node.nextChild) {
         let singleton = null;
         node.currentChild.find('singleton', (node) => {
            singleton = node.value;
         });
         const isSingleton = (typeof singleton === "boolean") ? singleton : false;
         if (isSingleton) {
            if (!singletons.has(contextName)) {
               singletons.delete(contextName);
               singletons.set(contextName, this);
               return;
            }
            if (singletons.has(contextName)) {
               const singletonContext = singletons.get(contextName);
               if (singletonContext.contextId !== this.contextId) {
                  proxyMembers.call(this, singletonContext);
                  Object.freeze(this);
                  return;
               }
            }
         }
      }
   });
}

const mapPrivateMembers = function () {
   this.config.reset();
   this.config.find('members', (node) => {
      node.reset();
      while (node.nextChild) {
         let type = null;
         let args = null;
         let key = node.currentChild.key;
         let value = null;
         let callback = null;
         node.currentChild.find('class', (node) => {
            type = Object.keys(node.value).map(key => node.value[key]);
         });
         node.currentChild.find('args', (node) => {
            args = node.value;
         });
         node.currentChild.find('value', (node) => {
            value = node.value;
         });
         node.currentChild.find('callback', (node) => {
            callback = node.value;
         });
         let memberInfo = null;
         if (type && args) {
            args.contextId = this.contextId;
            memberInfo = new MemberInfo(key, type, args, false, null, false, false, true, false, this.contextId);
         } else if (key && value !== undefined && value !== null) {
            memberInfo = new MemberInfo(key, null, null, false, value, false, false, true, false, this.contextId);
         } else if (callback && args) {
            memberInfo = new MemberInfo(key, callback, args, false, null, false, true, false, true, this.contextId);
         }
         if (memberInfo) {
            getMembersInfo.call(this).push(memberInfo);
         }
      }
   });
}

const mapMemberDependencies = function () {
   for (const privatePropertyMemberInfo of getMembersInfo.call(this).filter(x => !x.isPublic && x.isProperty)) {
      for (const publicMemberInfo of getMembersInfo.call(this).filter(x => x.isPublic && (x.isFunction || x.isProperty))) {
         privatePropertyMemberInfo.children.push(publicMemberInfo);
         publicMemberInfo.parent = privatePropertyMemberInfo;
      }
   }
   for (const privateFunctionMemberInfo of getMembersInfo.call(this).filter(x => !x.isPublic && x.isFunction)) {
      for (const publicMemberInfo of getMembersInfo.call(this).filter(x => x.isPublic && (x.isFunction || x.isProperty))) {
         privateFunctionMemberInfo.children.push(publicMemberInfo);
         publicMemberInfo.parent = privateFunctionMemberInfo;
      }
   }
   // for (const memberInfo of getAllMemberInfo().filter(mi => mi.contextId !== this.contextId)) {
   //    if (memberInfo.func) {
   //       for (const func of memberInfo.func) {
   //          if (func === this.constructor) {
   //             for (const publicMemberInfo of getMembersInfo.call(this).filter(x => x.isPublic && (x.isFunction || x.isProperty))) {
   //                // publicMemberInfo.children.push(memberInfo);
   //             }
   //          }
   //       }
   //    }
   // }
}

const configureMockedMembers = function () {
   this.config.reset();
   this.config.find('mocks', (node) => {
      while (node.nextChild) {
         let type = null;
         let args = null;
         let key = node.currentChild.key;
         let mockType = null;
         node.currentChild.find('class', (node) => {
            type = Object.keys(node.value).map(key => node.value[key]);
         });
         node.currentChild.find('mockClass', (node) => {
            mockType = Object.keys(node.value).map(key => node.value[key]);
         });
         for (let i = 0; i < getMembersInfo.call(this).length; i++) {
            const dependencyMember = getMembersInfo.call(this)[i];
            if (dependencyMember.isClass && dependencyMember.isContainerClass &&
               dependencyMember.func.find(f => type.find(x => x.name === f.name))) {
               {
                  const { name } = getMembersInfo.call(this).splice(i, 1)[0];
                  const memberInfo = new MemberInfo(name, mockType, args, false, null, false, false, true, false, this.contextId);
                  getMembersInfo.call(this).push(memberInfo);
               }
            }
         }
      }
   });
}

const configureMembersBehaviour = function () {
   this.config.find('behaviour', (node) => {
      while (node.nextChild) {
         let errorHalt = true;
         node.currentChild.find('errorHalt', (node) => {
            errorHalt = node.value;
         });
         for (let i = 0; i < getMembersInfo.call(this).length; i++) {
            const memberInfo = getMembersInfo.call(this)[i];
            if (memberInfo.isPublic) {
               memberInfo.errorHalt = errorHalt;
            }
         }
      }
   });
}

const setupMembers = function () {
   for (const memberInfo of getMembersInfo.call(this)) {
      Member.createMember({ memberInfo, context: this });
   }
}

const proxyMembers = function (context) {
   for (const memberInfo of getMembersInfo.call(this, context)) {
      memberInfo.proxy();
      Member.createMember({ memberInfo, context: this });
   }
}

const getMembersInfo = function (context) {
   if (!context) {
      context = this;
   }
   if (!context.contextId) {
      throw new Error('container context id was not set');
   }
   if (!membersInfo.has(context.contextId)) {
      membersInfo.set(context.contextId, []);
   }
   return membersInfo.get(context.contextId);
}

const getAllMemberInfo = function () {
   let allMemberInfo = [];
   for (const key of membersInfo.keys()) {
      allMemberInfo = allMemberInfo.concat(membersInfo.get(key));
   }
   return allMemberInfo;
}
