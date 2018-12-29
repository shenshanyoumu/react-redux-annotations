import verifyPlainObject from "../utils/verifyPlainObject";

export function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options);

    function constantSelector() {
      return constant;
    }
    constantSelector.dependsOnOwnProps = false;
    return constantSelector;
  };
}

/**
 * 用于判定mapToProps函数定义中是否接受HOC组件自身的props作为参数
 * @param {*} mapToProps 函数，由开发者定义的mapDispatchToProps函数或者mapStateToProps函数
 */
export function getDependsOnOwnProps(mapToProps) {
  return mapToProps.dependsOnOwnProps !== null &&
    mapToProps.dependsOnOwnProps !== undefined
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1;
}

/**
 *
 * @param {*} mapToProps 在react-redux库实现中，可以是mapStateToProps或者mapDispatchToProps。
 * @param {*} methodName 表示具体的子选择器函数名称
 */
export function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    /**
     * proxy函数负责具体的子选择处理逻辑
     * @param {*} stateOrDispatch state表示react应用的store管理的state状态树；而dispatch就是store.dispatch
     * @param {*} ownProps 表示react应用中有connect函数执行后生成的HOC组件本身接受的props
     */
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch);
    };

    // 子选择器函数默认接受HOC组件的自身props参数
    proxy.dependsOnOwnProps = true;

    //
    proxy.mapToProps = function detectFactoryAndVerify(
      stateOrDispatch,
      ownProps
    ) {
      proxy.mapToProps = mapToProps;

      // 判定在开发过程中，mapToProps表示的子选择器函数是否接受了HOC组件自身的props作为参数
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps);

      // todo：怎么感觉会死循环呢？？
      let props = proxy(stateOrDispatch, ownProps);

      // 表示开发中mapDispatchToProps或者mapStateToProps可以是函数
      if (typeof props === "function") {
        proxy.mapToProps = props;
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props);
        props = proxy(stateOrDispatch, ownProps);
      }

      // 在生成环境下，props是普通对象
      if (process.env.NODE_ENV !== "production") {
        verifyPlainObject(props, displayName, methodName);
      }

      return props;
    };

    return proxy;
  };
}
