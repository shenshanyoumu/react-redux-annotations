// connect函数的核心实现
import connectAdvanced from "../components/connectAdvanced";

// 对象浅比较
import shallowEqual from "../utils/shallowEqual";

// 在react开发中，开发者一般会自定义下面三个子选择器函数
import defaultMapDispatchToPropsFactories from "./mapDispatchToProps";
import defaultMapStateToPropsFactories from "./mapStateToProps";
import defaultMergePropsFactories from "./mergeProps";

// 选择器工厂函数，执行后返回选择器函数。而选择器函数由若干个子选择器函数组成，比如mergeProps、
// mapStateToProps和mapDispatchToProps等
import defaultSelectorFactory from "./selectorFactory";

/**
 *
 * @param {*} arg 表示子选择器，类似mapDispatchToProps
 * @param {*} factories 表示子选择器工厂函数，类似defaultMapDispatchToPropsFactories
 * @param {*} name 表示子选择器名称，类似“mapDispatchToProps”
 */
function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg);
    if (result) return result;
  }

  return (dispatch, options) => {
    throw new Error(
      `Invalid value of type ${typeof arg} for ${name} argument when connecting component ${
        options.wrappedComponentName
      }.`
    );
  };
}

function strictEqual(a, b) {
  return a === b;
}

/**
 *
 * @param {*} connectHOC用于创建HOC组件的函数，在实际开发中一般默认使用connectAdvanced
 * defaultMapStateToPropsFactories，在实际应用中，有开发者编写MapStateToProps函数/对象
 * defaultMapDispatchToPropsFactories，在实际应用中，有开发者编写MapDispatchToProps函数/对象
 * defaultMergePropsFactories，这个在实际应用中很少设置，主要目的是合并多种来源的子选择，为HOC组件提供统一的props
 * defaultSelectorFactory，选择器函数工厂，用于生成选择器函数
 */
export function createConnect({
  connectHOC = connectAdvanced,
  mapStateToPropsFactories = defaultMapStateToPropsFactories,
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  mergePropsFactories = defaultMergePropsFactories,
  selectorFactory = defaultSelectorFactory
} = {}) {
  return function connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    // 下面表示可选的配置参数
    {
      pure = true,
      areStatesEqual = strictEqual,
      areOwnPropsEqual = shallowEqual,
      areStatePropsEqual = shallowEqual,
      areMergedPropsEqual = shallowEqual,
      ...extraOptions
    } = {}
  ) {
    const initMapStateToProps = match(
      mapStateToProps,
      mapStateToPropsFactories,
      "mapStateToProps"
    );
    const initMapDispatchToProps = match(
      mapDispatchToProps,
      mapDispatchToPropsFactories,
      "mapDispatchToProps"
    );
    const initMergeProps = match(mergeProps, mergePropsFactories, "mergeProps");

    // connectHOC默认为ConnectAdvanced函数，用于生成HOC高阶函数
    return connectHOC(selectorFactory, {
      // used in error messages
      methodName: "connect",

      // 便于调试HOC组件，使用wrappedComponent即开发者编写的react容器组件名
      getDisplayName: name => `Connect(${name})`,

      // 如果在react开发中，单纯使用connect而没有定义mapStateToProps,则不会监听应用store的state状态树变化
      shouldHandleStateChanges: Boolean(mapStateToProps),

      //传递给选择器工厂函数的参数
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,
      pure,
      areStatesEqual,
      areOwnPropsEqual,
      areStatePropsEqual,
      areMergedPropsEqual,

      // 实际开发中额外的参数
      ...extraOptions
    });
  };
}

export default createConnect();
