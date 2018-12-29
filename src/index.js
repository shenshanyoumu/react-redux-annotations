// 提供给应用的Provider组件，内部封装了react的context特性，实现属性在后代组件的共享
import Provider from "./components/Provider";

import connectAdvanced from "./components/connectAdvanced";

// react的context特性
import { ReactReduxContext } from "./components/Context";

import connect from "./connect/connect";

export { Provider, connectAdvanced, ReactReduxContext, connect };
