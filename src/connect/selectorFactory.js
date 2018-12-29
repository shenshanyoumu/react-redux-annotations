import verifySubselectors from "./verifySubselectors";

/**
 * 如果不显式设置pure形式的选择器，则每次当HOC组件接受新的props或者redux的state状态树发生变化，都会触发HOC组件的重新渲染
 * 这对于前后状态没有发生变化的场景，显然会损耗性能
 *
 * @param {*} mapStateToProps 开发中实现的选择器函数
 * @param {*} mapDispatchToProps 开发中实现的选择器函数
 * @param {*} mergeProps 开发中实现的选择器函数
 * @param {*} dispatch 表示store.dispatch函数
 */
export function impureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch
) {
  /**
   * 合并state/dispatch和react容器组件自身props，形成新的更加完整的props
   * state对象就是redux中store管理的state状态树
   * ownProps表示react容器组件自身的props
   */
  return function impureFinalPropsSelector(state, ownProps) {
    return mergeProps(
      mapStateToProps(state, ownProps),
      mapDispatchToProps(dispatch, ownProps),
      ownProps
    );
  };
}

/**
 * 针对前后状态没有发生变化的场景，可以避免不必要的HOC组件渲染，提高性能。
 * 下面选择器函数之所以具有memorization能力，主要表现为在前后状态不变时，mergedProps引用也不会发生变化
 *
 * @param {*} mapStateToProps
 * @param {*} mapDispatchToProps
 * @param {*} mergeProps
 * @param {*} dispatch
 * @param {*} param4 开发者自定义的三个对象比较函数
 */
export function pureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch,
  { areStatesEqual, areOwnPropsEqual, areStatePropsEqual }
) {
  let hasRunAtLeastOnce = false;
  let state;
  let ownProps;
  let stateProps;
  let dispatchProps;
  let mergedProps;

  // 在开发中第一次调用connect函数生成的HOC高阶组件时触发下面逻辑
  function handleFirstCall(firstState, firstOwnProps) {
    state = firstState;
    ownProps = firstOwnProps;
    stateProps = mapStateToProps(state, ownProps);
    dispatchProps = mapDispatchToProps(dispatch, ownProps);
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    hasRunAtLeastOnce = true;
    return mergedProps;
  }

  // 当react容器组件接受新的props或者redux的state状态树发生变化
  function handleNewPropsAndNewState() {
    stateProps = mapStateToProps(state, ownProps);

    // 表示mapDispatchToProps子选择器函数是否接受容器组件自身的props
    if (mapDispatchToProps.dependsOnOwnProps) {
      dispatchProps = mapDispatchToProps(dispatch, ownProps);
    }

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }

  // 当react容器组件接受新的props，则需要判定mapStateToProps子选择器函数和mapDispatchToProps选择器函数
  // 是否接受react容器props作为选择器参数，如果接受则需要重新计算HOC新的mergedProps

  function handleNewProps() {
    if (mapStateToProps.dependsOnOwnProps)
      stateProps = mapStateToProps(state, ownProps);

    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps);

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }

  // 当redux中state状态树发生变化，则重新计算HOC的mergedProps
  function handleNewState() {
    const nextStateProps = mapStateToProps(state, ownProps);
    const statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps);
    stateProps = nextStateProps;

    if (statePropsChanged)
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps);

    return mergedProps;
  }

  // 每次当HOC容器组件接受新的props或者redux的state状态树发生变化，则触发下面逻辑
  function handleSubsequentCalls(nextState, nextOwnProps) {
    const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps);
    const stateChanged = !areStatesEqual(nextState, state);
    state = nextState;
    ownProps = nextOwnProps;

    if (propsChanged && stateChanged) return handleNewPropsAndNewState();
    if (propsChanged) return handleNewProps();
    if (stateChanged) return handleNewState();
    return mergedProps;
  }

  /**
   * nextState表示react应用中redux的state状态树发生变化
   * nextOwnProps表示react应用中HOC高阶组件接受新的props
   * hasRunAtLeastOnce表示HOC组件是否首次挂载
   */
  return function pureFinalPropsSelector(nextState, nextOwnProps) {
    return hasRunAtLeastOnce
      ? handleSubsequentCalls(nextState, nextOwnProps)
      : handleFirstCall(nextState, nextOwnProps);
  };
}

export default function finalPropsSelectorFactory(
  dispatch,
  { initMapStateToProps, initMapDispatchToProps, initMergeProps, ...options }
) {
  const mapStateToProps = initMapStateToProps(dispatch, options);
  const mapDispatchToProps = initMapDispatchToProps(dispatch, options);
  const mergeProps = initMergeProps(dispatch, options);

  // 在开发环境，需要验证各个子选择器函数的形式合法性
  if (process.env.NODE_ENV !== "production") {
    verifySubselectors(
      mapStateToProps,
      mapDispatchToProps,
      mergeProps,
      options.displayName
    );
  }

  //设置pure可以实现选择器的memorization能力，从而避免不必要的渲染过程
  const selectorFactory = options.pure
    ? pureFinalPropsSelectorFactory
    : impureFinalPropsSelectorFactory;

  return selectorFactory(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    dispatch,
    options
  );
}
