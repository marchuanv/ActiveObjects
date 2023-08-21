import utils from "utils";
import { Container } from "./container.mjs";

const _memberProperties = new WeakMap();
const configureProperties = function (name, func, args, isPublic, value, isProxy, isProperty, isFunction, isCallBeforePublicMember, contextId) {
   if (!_memberProperties.has(this)) {
      _memberProperties.set(this, {});
   }
   const properties = _memberProperties.get(this);
   if (properties.Id === undefined) {
      properties.Id = utils.generateGUID();
      properties.name = name;
      properties.func = func;
      properties.isProperty = isProperty;
      properties.isCallBeforePublicMember = isCallBeforePublicMember;
      properties.isFunction = isFunction;
      properties.errorHalt = true;
      properties.args = args || {};
      properties.isPublic = isPublic;
      properties.enabled = true;
      let isAsyncMember = false;
      let isClassMember = false;
      let isContainerClassMember = false;
      let isValueTypeMember = false;
      properties.func = properties.func ? (Array.isArray(properties.func) ? properties.func : [properties.func]) : [];
      for (const _func of properties.func) {
         try {
            if (isAsyncMember && !checkIsAsync({ func: _func })) {
               throw new Error('one or more classes in collection is not async');
            }
            isAsyncMember = checkIsAsync({ func: _func });
            if (isClassMember && !checkIsClass({ func: _func })) {
               throw new Error('one or more classes in collection is not async');
            }
            isClassMember = checkIsClass({ func: _func });
            if (isContainerClassMember && !checkIsContainerClass({ func: _func })) {
               throw new Error('one or more classes in collection is not async');
            }
            isContainerClassMember = checkIsContainerClass({ func: _func });
         } catch (error) {
            debugger;
         }
      }
      isValueTypeMember = checkIsValueType({ name, value });
      properties.isAsync = isAsyncMember;
      properties.isClass = isClassMember;
      properties.isContainerClass = isContainerClassMember;
      properties.isValueType = isValueTypeMember;
      properties.value = value;
      properties.contextId = contextId;
   }
   properties.isProxy = isProxy;
   return properties;
}
const children = new Map();
const parent = new Map();
export class MemberInfo {
   properties;
   constructor(name, func, args, isPublic, value, isProxy, isFunction, isProperty, isCallBeforePublicMember, contextId) {
      children.set(this, []);
      parent.set(this, null);
      this.properties = configureProperties.call(this, name, func, args, isPublic, value, isProxy, isProperty, isFunction, isCallBeforePublicMember, contextId);
   }
   proxy() {
      this.properties = configureProperties.call(this, this.name, this.func, this.args, this.isPublic, this.value, true, this.isProperty, this.isFunction, this.isCallBeforePublicMember, this.contextId);
   }
   get contextId() {
      return this.properties["contextId"];
   }
   get children() {
      return children.get(this);
   }
   get parent() {
      return parent.get(this);
   }
   set parent(value) {
      return parent.set(this, value);
   }
   get isCallBeforePublicMember() {
      return this.properties["isCallBeforePublicMember"];
   }
   get isFunction() {
      return this.properties["isFunction"];
   }
   get isProperty() {
      return this.properties["isProperty"];
   }
   get isProxy() {
      return this.properties["isProxy"];
   }
   get enabled() {
      return this.properties["enabled"];
   }
   set enabled(value) {
      this.properties["enabled"] = value;
   }
   get Id() {
      return this.properties["Id"];
   }
   get isAsync() {
      return this.properties["isAsync"];
   }
   get isContainerClass() {
      return this.properties["isContainerClass"];
   }
   get isClass() {
      return this.properties["isClass"];
   }
   get isValueType() {
      return this.properties["isValueType"];
   }
   get value() {
      return this.properties["value"];
   }
   set value(_value) {
      this.properties["value"] = _value;
   }
   set errorHalt(_value) {
      this.properties["errorHalt"] = _value;
   }
   get errorHalt() {
      return this.properties["errorHalt"];
   }
   get isPublic() {
      return this.properties["isPublic"];
   }
   get args() {
      return this.properties["args"];
   }
   get func() {
      return this.properties["func"];
   }
   get name() {
      return this.properties["name"];
   }
   get Id() {
      return this.properties["Id"];
   }
}
function getScript({ func }) {
   return func ? func.toString().toLowerCase().replace(/\s+/g, '') : '';
}
function checkIsAsync({ func }) {
   const script = getScript({ func });
   const name = getFunctionName({ func });
   return script ? script.startsWith(`async${name.toLowerCase()}(`) ||
      script.startsWith(`async(`) ||
      script.indexOf('returnnewpromise(') > -1 : false;
}
function checkIsClass({ func }) {
   const script = getScript({ func });
   const name = getFunctionName({ func });
   return script ? script.startsWith(`class${name.toLowerCase()}`) || script.startsWith(`class`) : false;
}
function checkIsContainerClass({ func }) {
   const script = getScript({ func });
   const name = getFunctionName({ func });
   return script ? script.startsWith(`class${name.toLowerCase()}extends${Container.name.toLowerCase()}`) : false;
}
function checkIsValueType({ name, value }) {
   return (value !== undefined && value !== null && name) ? true : false;
}
function getFunctionName({ func }) {
   if (!func) {
      throw new Error('func is null or undefined.');
   }
   const type = typeof func;
   if (!(type === 'function')) {
      throw new Error(`func is of type: ${type}`);
   }
   const _name = func.name;
   if (!_name) {
      throw new Error(`unable to determine function name`);
   }
   return _name;
}
