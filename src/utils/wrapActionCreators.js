import { bindActionCreators } from "redux";

/**
 * 将store.dispatch 方法和actionCreators进行封装，从而在react端可以直接调用
 * @param {*} actionCreators 函数执行后返回action对象
 */
export default function wrapActionCreators(actionCreators) {
  return dispatch => bindActionCreators(actionCreators, dispatch);
}
