import React, { Component } from "react";
import PropTypes from "prop-types";
import { ReactReduxContext } from "./Context";

class Provider extends Component {
  constructor(props) {
    super(props);

    const { store } = props;

    this.state = {
      storeState: store.getState(),
      store
    };
  }

  // 组件挂载后，注册回调到store对象上
  componentDidMount() {
    this._isMounted = true;
    this.subscribe();
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this._isMounted = false;
  }

  componentDidUpdate(prevProps) {
    // 下面的含义是当应用中的store发生变化，则需要重新注册回调到store实例上
    // 一般而言应用的store不会发生引用变化，除非SSR渲染等过程存在
    if (this.props.store !== prevProps.store) {
      if (this.unsubscribe) {
        this.unsubscribe();
      }

      this.subscribe();
    }
  }

  subscribe() {
    const { store } = this.props;

    // 注册到store上，当store接收到dispatch动作后触发
    this.unsubscribe = store.subscribe(() => {
      const newStoreState = store.getState();

      if (!this._isMounted) {
        return;
      }

      // 最新的react版本中，推荐使用setState(prevState=>{})方式修改组件状态
      this.setState(providerState => {
        // 如果store前后state没有变化，则不需要启动react的渲染周期
        if (providerState.storeState === newStoreState) {
          return null;
        }

        return { storeState: newStoreState };
      });
    });

    // 为了保证组件中的storeState与store的state状态一致，需要处理当组件首次render和mount之间的action动作
    const postMountStoreState = store.getState();
    if (postMountStoreState !== this.state.storeState) {
      this.setState({ storeState: postMountStoreState });
    }
  }

  render() {
    const Context = this.props.context || ReactReduxContext;

    return (
      // 将store和store.state对象传递给后代组件使用
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    );
  }
}

// Provider组件接受redux的store对象，并被后代组件共享
Provider.propTypes = {
  store: PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
  }),

  // 外部传递的context对象
  context: PropTypes.object,
  children: PropTypes.any
};

export default Provider;
