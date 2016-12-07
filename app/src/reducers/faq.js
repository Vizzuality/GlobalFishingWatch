const initialState = null;
import { GET_FAQ_ENTRIES } from 'actions';

export default function (state = initialState, action) {
  switch (action.type) {
    case GET_FAQ_ENTRIES:
      return action.payload;
    default:
      return state;
  }
}
