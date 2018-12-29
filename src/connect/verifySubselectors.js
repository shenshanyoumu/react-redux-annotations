import warning from "../utils/warning";

/**
 *
 * @param {*} selector 状态选择器函数
 * @param {*} methodName 选择器的名称
 * @param {*} displayName 出现警告信息时的显示名称
 */
function verify(selector, methodName, displayName) {
  if (!selector) {
    throw new Error(`Unexpected value for ${methodName} in ${displayName}.`);
  } else if (
    methodName === "mapStateToProps" ||
    methodName === "mapDispatchToProps"
  ) {
    if (!selector.hasOwnProperty("dependsOnOwnProps")) {
      warning(
        `The selector for ${methodName} of ${displayName} did not specify a value for dependsOnOwnProps.`
      );
    }
  }
}

// 选择器注册props/state/dispatch触发的状态变化，并执行回调
export default function verifySubselectors(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  displayName
) {
  verify(mapStateToProps, "mapStateToProps", displayName);
  verify(mapDispatchToProps, "mapDispatchToProps", displayName);
  verify(mergeProps, "mergeProps", displayName);
}
