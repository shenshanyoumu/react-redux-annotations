/**
 * 下面代码与redux库中代码类似
 * @param {*} obj 对象如果是普通对象，则obj._proto_就是 Object.prototype
 */
export default function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  let proto = Object.getPrototypeOf(obj);
  if (proto === null) return true;

  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
}
