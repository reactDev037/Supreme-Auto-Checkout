import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory, hashHistory } from 'react-router';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { reducer as formReducer } from 'redux-form';
import * as reducers from './reducers';
import getRoutes from './routes';
import { loadSavedState, saveState } from './utils/StorageManager';


const VERSION = '0.0.1';

injectTapEventPlugin();

const middleware = [routerMiddleware(browserHistory)];
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}

const savedState = loadSavedState(VERSION);
const store = createStore(
  combineReducers(Object.assign({}, reducers, {
    routing: routerReducer,
    form: formReducer,
  })),
  savedState,
  applyMiddleware(...middleware),
);

// Save state in localStorage automatically
store.subscribe(() => {
  const state = store.getState();
  if (state) {
    saveState({
      task: state.task,
      auth: state.auth,
    }, VERSION);
  }
});

const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={hashHistory}>
      {getRoutes(store)}
    </Router>
  </Provider>,
  document.getElementById('app'),
);
