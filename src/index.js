// 提供给应用的Provider组件，内部封装了react的context特性，实现属性在后代组件的共享
import Provider from "./components/Provider";

// connect函数的默认核心实现函数
import connectAdvanced from "./components/connectAdvanced";

// react的context特性，基于新版的context对象实现
import { ReactReduxContext } from "./components/Context";

//一般开发者使用connect函数
import connect from "./connect/connect";

export { Provider, connectAdvanced, ReactReduxContext, connect };
