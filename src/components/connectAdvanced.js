// 对于HOC，被wrapped的组件的静态方法无法绑定到外部组件上，因此需要下面模块
import hoistStatics from "hoist-non-react-statics";

// react中定义的invarinat与warning不同在于，invariant在生产环境和开发环境都抛出警告
import invariant from "invariant";
import React, { Component, PureComponent } from "react";

// 判定对象是否是合法的react元素
import { isValidElementType } from "react-is";

// react的context对象，用于属性的共享
import { ReactReduxContext } from "./Context";

// 组件的序列化
const stringifyComponent = Comp => {
  try {
    return JSON.stringify(Comp);
  } catch (err) {
    return String(Comp);
  }
};

// connectAdvanced属于高阶函数，即执行后返回内部函数。注意而内部函数才是HOC，即高阶组件
export default function connectAdvanced(
  //该工厂函数执行后返回selector函数，用于处理state/props/dispatch等产生的新的props；
  //注意不要在react应用中直接使用connectAdvanced，因为不具备memorization能力导致性能开销
  /**
   *  export default connectAdvanced((dispatch, options) => (state, props) => ({
        thing: state.things[props.thingId],
        saveThing: fields => dispatch(actionCreators.saveThing(props.thingId, fields)),
      }))(YourComponent)
   */
  selectorFactory,
  // 配置对象
  {
    //connectAdvanced高阶函数对外显示的名称
    getDisplayName = name => `ConnectAdvanced(${name})`,

    // 方法名称
    methodName = "connectAdvanced",

    // 已经被移除的属性
    renderCountProp = undefined,

    // 用于指示当前connectAdvanced高阶是否监听store的state变化
    shouldHandleStateChanges = true,

    // 已经被移除的属性
    storeKey = "store",

    // 已经被移除的属性
    withRef = false,

    // 使用react的forwardRef特性来引用wrapped组件实例
    forwardRef = false,

    // react的context特性，实现属性共享
    context = ReactReduxContext,

    //其他属性选项
    ...connectOptions
  } = {}
) {
  invariant(
    renderCountProp === undefined,
    `renderCountProp is removed. render counting is built into the latest React dev tools profiling extension`
  );

  invariant(
    !withRef,
    "withRef is removed. To access the wrapped instance, use a ref on the connected component"
  );

  const customStoreWarningMessage =
    "To use a custom Redux store for specific components,  create a custom React context with " +
    "React.createContext(), and pass the context object to React Redux's Provider and specific components" +
    " like:  <Provider context={MyContext}><ConnectedComponent context={MyContext} /></Provider>. " +
    "You may also pass a {context : MyContext} option to connect";

  invariant(
    storeKey === "store",
    "storeKey has been removed and does not do anything. " +
      customStoreWarningMessage
  );

  // 保存从外部传入的context对象，context对象是react新版本对context特性的实现
  const Context = context;

  //WrappedComponent就是react应用中传入的react容器组件
  return function wrapWithConnect(WrappedComponent) {
    // 在开发环境中检查react组件的类型
    if (process.env.NODE_ENV !== "production") {
      invariant(
        isValidElementType(WrappedComponent),
        `You must pass a component to the function returned by ` +
          `${methodName}. Instead received ${stringifyComponent(
            WrappedComponent
          )}`
      );
    }

    // wrapped组件的名称
    const wrappedComponentName =
      WrappedComponent.displayName || WrappedComponent.name || "Component";

    // 为了调试方便，需要显示被高阶组件封装的组件名称
    const displayName = getDisplayName(wrappedComponentName);

    // selector工厂函数的配置选项，注意selector工厂函数执行后返回selector函数
    // selector函数针对state/props/dispatch触发的新props进行监听
    const selectorFactoryOptions = {
      ...connectOptions,
      getDisplayName,
      methodName,
      renderCountProp,
      shouldHandleStateChanges,
      storeKey,
      displayName,
      wrappedComponentName,
      WrappedComponent
    };

    // 在react开发中，一般通过connect传递的参数就在connectOptions保存
    // 比如mapDispatchToProps等，目前可以在connect传入pure来优化渲染性能
    const { pure } = connectOptions;

    let OuterBaseComponent = Component;
    let FinalWrappedComponent = WrappedComponent;

    if (pure) {
      OuterBaseComponent = PureComponent;
    }

    // 对state/props和dispatch触发的状态修改进行监听
    function makeDerivedPropsSelector() {
      let lastProps;
      let lastState;
      let lastDerivedProps;
      let lastStore;
      let sourceSelector;

      return function selectDerivedProps(state, props, store) {
        if (pure && lastProps === props && lastState === state) {
          return lastDerivedProps;
        }

        // 一般react应用中store对象一旦生成，其引用就不会发生变化
        if (store !== lastStore) {
          lastStore = store;

          //基于
          sourceSelector = selectorFactory(
            store.dispatch,
            selectorFactoryOptions
          );
        }

        lastProps = props;
        lastState = state;

        const nextProps = sourceSelector(state, props);

        lastDerivedProps = nextProps;
        return lastDerivedProps;
      };
    }

    //
    function makeChildElementSelector() {
      let lastChildProps, lastForwardRef, lastChildElement;

      return function selectChildElement(childProps, forwardRef) {
        if (childProps !== lastChildProps || forwardRef !== lastForwardRef) {
          lastChildProps = childProps;
          lastForwardRef = forwardRef;

          // FinalWrappedComponent组件就是wrapped组件，即react应用中的容器组件
          lastChildElement = (
            <FinalWrappedComponent {...childProps} ref={forwardRef} />
          );
        }

        return lastChildElement;
      };
    }

    // 注意OuterBaseComponent要么是React.Component，要么是React.PureComponent
    // 取决于开发者是否给connectAdvanced函数传入包含pure参数的配置
    // 下面就是通常的属性代理方式的HOC编程规范
    class Connect extends OuterBaseComponent {
      constructor(props) {
        super(props);
        invariant(
          forwardRef ? !props.wrapperProps[storeKey] : !props[storeKey],
          "Passing redux store in props has been removed and does not do anything. " +
            customStoreWarningMessage
        );

        // selector函数监听state/props和dispatch触发的状态变化
        this.selectDerivedProps = makeDerivedPropsSelector();
        this.selectChildElement = makeChildElementSelector();
        this.renderWrappedComponent = this.renderWrappedComponent.bind(this);
      }

      //value就是从Provider组件传递下来的props属性对象
      renderWrappedComponent(value) {
        invariant(
          value,
          `Could not find "store" in the context of ` +
            `"${displayName}". Either wrap the root component in a <Provider>, ` +
            `or pass a custom React context provider to <Provider> and the corresponding ` +
            `React context consumer to ${displayName} in connect options.`
        );

        // 注意下面解构过程，在Provider组件中传入的value属性对象就是下面结构
        const { storeState, store } = value;

        let wrapperProps = this.props;
        let forwardedRef;

        if (forwardRef) {
          wrapperProps = this.props.wrapperProps;
          forwardedRef = this.props.forwardedRef;
        }

        // 参数storeState/store都是Provider组件提供的，其中storeState会在每次redux的state发生变化跟随变化
        // 而wrapperProps是connect执行后的高阶组件作为react体系中一个组件存在时，接收到其他props
        let derivedProps = this.selectDerivedProps(
          storeState,
          wrapperProps,
          store
        );

        return this.selectChildElement(derivedProps, forwardedRef);
      }

      render() {
        const ContextToUse = this.props.context || Context;

        // Context.Consumer是react新版本用于接受context属性的编程形式
        return (
          <ContextToUse.Consumer>
            {this.renderWrappedComponent}
          </ContextToUse.Consumer>
        );
      }
    }

    // HOC组件的封装组件为开发者的react容器组件，为了调试方便HOC组件的显示名称为开发者的react容器组件名称
    Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = displayName;

    //forwardRef语法是react用于引用真实DOM节点的新语法，用于替换之前的refs语法
    if (forwardRef) {
      const forwarded = React.forwardRef(function forwardConnectRef(
        props,
        ref
      ) {
        return <Connect wrapperProps={props} forwardedRef={ref} />;
      });

      forwarded.displayName = displayName;
      forwarded.WrappedComponent = WrappedComponent;
      return hoistStatics(forwarded, WrappedComponent);
    }

    // 静态方法的提升，即将react容器组件的静态方法复制到HOC组件上
    return hoistStatics(Connect, WrappedComponent);
  };
}
