import React, { PureComponent } from "react"
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from "redux-thunk"
import { createLogger } from "redux-logger"
import Router from './Router';
// import reducers from '../whizzard-react-native/components/Store/Reducers/index'
import reducers from './components/Store/Reducers/index'
import { LogBox } from 'react-native';


const logger = createLogger({ collapsed: true, diff: true })

const middlewares = [];

if (__DEV__) {
    middlewares.push(thunk);
    middlewares.push(logger);
} else {
    middlewares.push(thunk);
}
const store = createStore(reducers, applyMiddleware(...middlewares));
export default class App extends PureComponent {
    render() {
        LogBox.ignoreAllLogs();
        return (
            <Provider store={store}>
                <Router/>
            </Provider>
        )
    }
}
