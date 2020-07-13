import { createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import {annotationsReducer} from "./reducers";

let store = createStore(annotationsReducer, applyMiddleware(thunk));

export default store;