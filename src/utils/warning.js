/**
 * 下面代码拷贝redux
 * @param {*} message 警告信息
 */
export default function warning(message) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }

  try {
    throw new Error(message);
  } catch (e) {}
}
