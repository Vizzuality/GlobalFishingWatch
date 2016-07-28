const initialState = {
  loading: false,
  layers: []
};
import {VESSEL_INIT, SHOW_LOADING, TOGGLE_LAYER_VISIBILITY, SET_LAYERS, GET_SERIESGROUP} from "../constants";

export default function (state = initialState, action) {
  switch (action.type) {
    case VESSEL_INIT:
      return Object.assign({}, state, action.payload);
    case SHOW_LOADING:
      return Object.assign({}, state, {loading: action.payload.data});
    case SET_LAYERS:
      return Object.assign({}, state, {layers: action.payload});
    case GET_SERIESGROUP:
      return Object.assign({}, state, {track: action.payload});
    case TOGGLE_LAYER_VISIBILITY:
      const layers = state.layers.slice(0);
      for (let i = 0, length = layers.length; i < length; i++) {
        if (layers[i].title === action.payload.title) {
          action.payload.visible = !action.payload.visible
          layers[i] = action.payload;
          break;
        }
      }
      return Object.assign({}, state, {layers});
    default:
      return state;
  }
};