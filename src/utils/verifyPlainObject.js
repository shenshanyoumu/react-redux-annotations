import isPlainObject from "./isPlainObject";
import warning from "./warning";

/**
 *
 * @param {*} value 检查是否普通对象
 * @param {*} displayName 组件展示的名称
 * @param {*} methodName 组件包含的方法名称
 */
export default function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    );
  }
}
