import { combineReducers, createStore } from "redux";
import countReducer from "./reducers/countReducer";

const rootReducer = combineReducers({
  Count: countReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const store = createStore(rootReducer);

export default store;
