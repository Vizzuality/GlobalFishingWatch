import debounce from 'lodash/debounce';
import moment from 'moment';

export const GA_DISCARD_REPORT = 'GA_DISCARD_REPORT';
export const GA_EXTERNAL_LINK_CLICKED = 'GA_EXTERNAL_LINK_CLICKED';
export const GA_INNER_TIMELINE_DATES_UPDATED = 'GA_INNER_TIMELINE_DATES_UPDATED';
export const GA_INNER_TIMELINE_EXTENT_CHANGED = 'GA_INNER_TIMELINE_EXTENT_CHANGED';
export const GA_MAP_CENTER_TILE = 'GA_MAP_CENTER_TILE';
export const GA_MAP_POINT_CLICKED = 'GA_MAP_POINT_CLICKED';
export const GA_OUTER_TIMELINE_DATES_UPDATED = 'GA_OUTER_TIMELINE_DATES_UPDATED';
export const GA_PLAY_STATUS_TOGGLED = 'GA_PLAY_STATUS_TOGGLED';
export const GA_SEARCH_RESULT_CLICKED = 'GA_SEARCH_RESULT_CLICKED';
export const GA_SET_LAYER_HUE = 'GA_SET_LAYER_HUE';
export const GA_SET_LAYER_OPACITY = 'GA_SET_LAYER_OPACITY';
export const GA_VESSEL_POINT_CLICKED = 'GA_VESSEL_POINT_CLICKED';
export const GA_RECENT_VESSEL_ADDED = 'GA_RECENT_VESSEL_ADDED';

/**
 * Only add here actions that are GA-exclusive.
 * These aim at removing ambiguities in other actions.
 */
export const trackLayerOpacityChange = debounce((dispatch, opacity, layerId) => {
  dispatch({
    type: GA_SET_LAYER_OPACITY,
    payload: { opacity, layerId }
  });
}, 1000);
export const trackLayerHueChange = debounce((dispatch, hue, layerId) => {
  dispatch({
    type: GA_SET_LAYER_HUE,
    payload: { hue, layerId }
  });
}, 1000);
export const trackOuterTimelineChange = debounce((dispatch, outerTimelineDates) => {
  dispatch({
    type: GA_OUTER_TIMELINE_DATES_UPDATED,
    payload: outerTimelineDates
  });
}, 1000);

const trackInnerTimelineExtentChanged = debounce((dispatch, daysDelta) => {
  dispatch({
    type: GA_INNER_TIMELINE_EXTENT_CHANGED,
    payload: daysDelta
  });
}, 500);

const trackInnerTimelineDatesUpdated = debounce((dispatch, innerTimelineDates) => {
  dispatch({
    type: GA_INNER_TIMELINE_DATES_UPDATED,
    payload: innerTimelineDates
  });
}, 500);

export const trackInnerTimelineChange = (dispatch, innerTimelineDates, previousInnerTimelineDates, timelinePaused) => {
  const currentDelta = previousInnerTimelineDates[1] - previousInnerTimelineDates[0];
  const newDelta = innerTimelineDates[1] - innerTimelineDates[0];
  const extentChanged = Math.abs(currentDelta - newDelta) > 1;
  if (extentChanged) {
    const daysDelta = Math.round(moment.duration(newDelta).asDays());
    trackInnerTimelineExtentChanged(dispatch, daysDelta);
  } else if (timelinePaused !== false) {
    trackInnerTimelineDatesUpdated(dispatch, innerTimelineDates);
  }
};

export function trackSearchResultClicked(tilesetId, seriesgroup) {
  return (dispatch, getState) => {
    const state = getState();
    const vesselIndex = state.vesselInfo.vessels.findIndex(vessel => vessel.seriesgroup === seriesgroup);
    // name can be undefined, but GA doesn't support objects as a label, so if undefined name will be removed on stringify
    const name = state.vesselInfo.vessels[vesselIndex].vesselname;
    dispatch({
      type: GA_SEARCH_RESULT_CLICKED,
      payload: { tilesetId, seriesgroup, name }
    });
  };
}

export function trackVesselPointClicked(tilesetId, seriesgroup) {
  return (dispatch, getState) => {
    const state = getState();
    const vesselIndex = state.vesselInfo.vessels.findIndex(vessel => vessel.seriesgroup === seriesgroup);
    // name can be undefined, but GA doesn't support objects as a label, so if undefined name will be removed on stringify
    const name = state.vesselInfo.vessels[vesselIndex].vesselname;
    dispatch({
      type: GA_VESSEL_POINT_CLICKED,
      payload: { tilesetId, seriesgroup, name }
    });
  };
}

export function trackMapClicked(lat, long, type) {
  return (dispatch) => {
    dispatch({
      type: GA_MAP_POINT_CLICKED,
      payload: { lat, long, type }
    });
  };
}

export function trackExternalLinkClicked(link) {
  return (dispatch) => {
    dispatch({ type: GA_EXTERNAL_LINK_CLICKED, payload: link });
    window.location = link;
  };
}

export function trackDiscardReport() {
  return (dispatch) => {
    dispatch({
      type: GA_DISCARD_REPORT
    });
  };
}

export function trackCenterTile(x, y) {
  return {
    type: GA_MAP_CENTER_TILE,
    payload: { x, y }
  };
}

export function trackRecentVesselAdded() {
  return {
    type: GA_RECENT_VESSEL_ADDED
  };
}
