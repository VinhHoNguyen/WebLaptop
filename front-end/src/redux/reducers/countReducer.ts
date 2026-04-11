import type { CountAction } from "../actions/countActions";

export type CountState = {
  isLoad: boolean;
};

const initialState: CountState = {
  isLoad: true,
};

const countReducer = (state: CountState = initialState, action: CountAction): CountState => {
  switch (action.type) {
    case "CHANGE_LOAD":
      return {
        isLoad: !action.data,
      };
    default:
      return state;
  }
};

export default countReducer;
