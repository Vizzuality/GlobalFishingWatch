import { ADD_CUSTOM_LAYER, TOGGLE_LAYER_VISIBILITY, TOGGLE_LAYER_WORKSPACE_PRESENCE } from 'layers/layersActions';
import { ADD_REPORT_POLYGON, DELETE_REPORT_POLYGON, SET_REPORT_STATUS_SENT, SHOW_POLYGON } from 'report/reportActions';
import { SET_FLAG_FILTERS, CHANGE_SPEED } from 'filters/filtersActions';
import { SET_SEARCH_TERM } from 'search/searchActions';
import { SET_RECENT_VESSELS_VISIBILITY } from 'recentVessels/recentVesselsActions';
import {
  GA_DISCARD_REPORT,
  GA_EXTERNAL_LINK_CLICKED,
  GA_INNER_TIMELINE_DATES_UPDATED,
  GA_INNER_TIMELINE_EXTENT_CHANGED,
  GA_MAP_CENTER_TILE,
  GA_MAP_POINT_CLICKED,
  GA_OUTER_TIMELINE_DATES_UPDATED,
  GA_PLAY_STATUS_TOGGLED,
  GA_SEARCH_RESULT_CLICKED,
  GA_SET_LAYER_HUE,
  GA_SET_LAYER_OPACITY,
  GA_VESSEL_POINT_CLICKED,
  GA_RECENT_VESSEL_ADDED
} from 'analytics/analyticsActions';

import isFunction from 'lodash/isFunction';
import { SEARCH_QUERY_MINIMUM_LIMIT, TIMELINE_SPEED_CHANGE } from 'config';

import { FLAGS } from 'app/src/constants';
import { TOGGLE_VESSEL_PIN, SET_PINNED_VESSEL_HUE } from 'actions/vesselInfo';
import { SET_WORKSPACE_ID } from 'actions/workspace';

const GA_ACTION_WHITELIST = [
  {
    type: TOGGLE_LAYER_VISIBILITY,
    category: 'Layer',
    action: (action, state) => {
      const layerIndex = state.layers.workspaceLayers.findIndex(l => l.id === action.payload.layerId);
      const changedLayer = state.layers.workspaceLayers[layerIndex];
      const isVisible = action.payload.forceStatus !== null ? action.payload.forceStatus : !changedLayer.visible;
      return isVisible ? 'Turn Layer On' : 'Turn Layer Off';
    },
    getPayload: action => action.payload.layerId
  },
  {
    type: GA_SET_LAYER_OPACITY,
    category: 'Layer',
    action: 'Set layer opacity',
    getPayload: action => `${action.payload.layerId}:${action.payload.opacity}`
  },
  {
    type: GA_SET_LAYER_HUE,
    category: 'Layer',
    action: 'Set layer hue',
    getPayload: action => `${action.payload.layerId}:${action.payload.hue}`
  },
  {
    type: TOGGLE_LAYER_WORKSPACE_PRESENCE,
    category: 'Layer',
    action: action => (action.payload.added ? 'Add from GFW Library' : 'Remove from GFW Library'),
    getPayload: action => action.payload.layerId
  },
  {
    type: ADD_CUSTOM_LAYER,
    category: 'Layer',
    action: 'Add user generated layer',
    getPayload: action => action.payload.layerId
  },
  {
    type: SET_SEARCH_TERM,
    category: 'Search',
    action: 'Search for vessel',
    getPayload: (action) => {
      if (action.payload.length >= SEARCH_QUERY_MINIMUM_LIMIT) {
        return action.payload;
      }
      return null;
    }
  },
  {
    type: GA_SEARCH_RESULT_CLICKED,
    category: 'Search',
    action: 'Search result selected',
    getPayload: action => action.payload.name
  },
  {
    type: GA_RECENT_VESSEL_ADDED,
    category: 'Search',
    action: 'Recent Vessels',
    getPayload: () => 'Selects a recent vessel to view'
  },
  {
    type: TOGGLE_VESSEL_PIN,
    category: 'Search',
    action: (action) => {
      const actionLabel = (action.payload.pinned === true) ? 'Pin a vessel' : 'Unpin a vessel';
      return actionLabel;
    },
    getPayload: action => `${action.payload.tilesetId}:${action.payload.seriesgroup}:${action.payload.vesselname}`
  },
  {
    type: GA_VESSEL_POINT_CLICKED,
    category: 'Map Interaction',
    action: 'Loaded a vessel data',
    getPayload: action => `${action.payload.name}:${action.payload.tilesetId}:${action.payload.seriesgroup}`
  },
  {
    type: GA_MAP_POINT_CLICKED,
    category: 'Map Interaction',
    action: 'Click a vessel point',
    getPayload: action => `${action.payload.lat}:${action.payload.long}:${action.payload.type}`
  },
  {
    type: GA_OUTER_TIMELINE_DATES_UPDATED,
    category: 'Timeline',
    action: 'Outer period changed',
    getPayload: action => `${action.payload[0].getTime()}:${action.payload[1].getTime()}`
  },
  {
    type: GA_INNER_TIMELINE_DATES_UPDATED,
    category: 'Timeline',
    action: 'Inner dates changed',
    getPayload: action => `${action.payload[0].getTime()}:${action.payload[1].getTime()}`
  },
  {
    type: GA_INNER_TIMELINE_EXTENT_CHANGED,
    category: 'Timeline',
    action: 'Inner extent changed',
    getPayload: action => action.payload.toString()
  },
  {
    type: GA_PLAY_STATUS_TOGGLED,
    category: 'Timeline',
    action: 'Press Play',
    getPayload: (action, state) => {
      if (action.payload === false) { // pressed play
        return `play:${state.filters.timelineInnerExtent[0].getTime()}`;
      }
      return `pause:${state.filters.timelineInnerExtent[1].getTime()}`;
    }
  },
  {
    type: SET_WORKSPACE_ID,
    category: 'Share',
    action: 'Share Link',
    getPayload: action => action.payload
  },
  {
    type: SET_FLAG_FILTERS,
    category: 'Settings',
    action: 'Filter by Country',
    getPayload: ({ payload }) => {
      const filters = payload.flagFilters.filter(flagFilter => typeof flagFilter.flag !== 'undefined');
      if (filters.length) {
        return filters.map((flagFilter) => {
          if (flagFilter.flag) return FLAGS[flagFilter.flag];
          return 'ALL';
        });
      }
      return null;
    }
  },
  {
    type: GA_EXTERNAL_LINK_CLICKED,
    category: 'External Link',
    action: 'Click to leave',
    getPayload: ({ payload }) => payload
  },
  {
    type: SHOW_POLYGON,
    category: 'Report Interaction',
    action: 'Click on polygon',
    getPayload: (action, state) => `${state.report.layerId}:${action.payload.polygonData.name}`
  },
  {
    type: ADD_REPORT_POLYGON,
    category: 'Report Interaction',
    action: 'Add polygon to report',
    getPayload: (action, state) => `${state.report.layerId}:${state.report.currentPolygon.name}`
  },
  {
    type: DELETE_REPORT_POLYGON,
    category: 'Report Interaction',
    action: 'Add polygon to report',
    getPayload: (action, state) => `${state.report.layerId}:${state.report.polygons[action.payload.polygonIndex].name}`
  },
  {
    type: GA_DISCARD_REPORT,
    category: 'Report Interaction',
    action: 'Discard report',
    getPayload: (action, state) => `${state.report.layerId}:${state.report.polygons.map(elem => elem.name).join(':')}`
  },
  {
    type: SET_REPORT_STATUS_SENT,
    category: 'Report Interaction',
    action: 'Report sent',
    getPayload: (action, state) => `${state.report.layerId}:${state.report.polygons.map(elem => elem.name).join(':')}`
  },
  {
    type: GA_MAP_CENTER_TILE,
    category: 'Map Interaction',
    action: 'Changed area',
    getPayload: action => `${action.payload.x},${action.payload.y}`
  },
  {
    type: CHANGE_SPEED,
    category: 'Timeline',
    action: 'Speed Control',
    getPayload: (action, state) => {
      const label = (action.payload.shouldDecrease ? 'Decrease speed to' : 'Increase speed to');
      const speedChangeFactor = (action.payload.shouldDecrease ? 1 / TIMELINE_SPEED_CHANGE : TIMELINE_SPEED_CHANGE);
      return `${label} ${state.filters.timelineSpeed * speedChangeFactor}x`;
    }
  },
  {
    type: SET_PINNED_VESSEL_HUE,
    category: 'Settings',
    action: 'Change vessel track colour',
    getPayload: 'user changes colour'
  },
  {
    type: SET_RECENT_VESSELS_VISIBILITY,
    category: 'Search',
    action: 'Recent Vessels',
    getPayload: action => (action.payload ? 'Open infowindow' : null) // Send only if the modal is opened
  }
];

const googleAnalyticsMiddleware = store => next => (action) => {
  if (typeof window.ga !== 'undefined' && typeof action.type !== 'undefined') {
    const state = store.getState();
    const gaAction = GA_ACTION_WHITELIST.find(whitelistAction => action.type === whitelistAction.type);
    if (gaAction) {
      const gaEvent = {
        hitType: 'event',
        eventCategory: gaAction.category
      };
      if (isFunction(gaAction.action)) {
        gaEvent.eventAction = gaAction.action(action, state);
      } else {
        gaEvent.eventAction = gaAction.action;
      }
      if (gaAction.getPayload) {
        gaEvent.eventLabel = gaAction.getPayload(action, state);
      }
      if (gaEvent.eventLabel !== null && typeof gaEvent.eventLabel !== 'undefined') {
        window.ga('send', gaEvent);
      }
    }
  }

  return next(action);
};

export { googleAnalyticsMiddleware as default };
