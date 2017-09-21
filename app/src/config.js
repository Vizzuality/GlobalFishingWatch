import moment from 'moment';

// Application settings
export const TIMELINE_STEP = 24 * 60 * 60 * 1000; // 1 day
export const MIN_FRAME_LENGTH_MS = TIMELINE_STEP; // 1 day
export const LOADERS = {
  HEATMAP_TILES: 'HEATMAP_TILES'
};

export const DEFAULT_FILTER_HUE = 1;

// Absolute maximum supported
export const TIMELINE_OVERALL_START_DATE = new Date(Date.UTC(2012, 0, 1));
export const TIMELINE_OVERALL_END_DATE = moment().subtract(3, 'days').toDate();

export const TIMELINE_DEFAULT_OUTER_START_DATE = new Date(Date.UTC(2015, 0, 1));
export const TIMELINE_DEFAULT_OUTER_END_DATE = new Date(Date.UTC(2016, 0, 1));

export const TIMELINE_DEFAULT_INNER_START_DATE = new Date(Date.UTC(2015, 0, 1));
export const TIMELINE_DEFAULT_INNER_END_DATE = new Date(Date.UTC(2015, 1, 1));

export const TIMELINE_MIN_INNER_EXTENT = 1.21e+9; // 2 weeks

export const TIMELINE_MAX_STEPS = 190; // six months
export const TIMELINE_MAX_TIME = TIMELINE_STEP * TIMELINE_MAX_STEPS; // six months

export const TIMELINE_SPEED_CHANGE = 2; // 2 for double and half speed
export const TIMELINE_MAX_SPEED = 16;
export const TIMELINE_MIN_SPEED = 0.03125;

export const MIN_ZOOM_LEVEL = 2;
export const MAX_ZOOM_LEVEL = 12;
export const MAX_AUTO_ZOOM_LONGITUDE_SPAN = 200;
export const CLUSTER_CLICK_ZOOM_INCREMENT = 1;

export const GUEST_PERMISSION_SET = [];

// for now, auth users get no special permissions, everything comes from the API
export const AUTH_PERMISSION_SET = GUEST_PERMISSION_SET;

// vessels rendering
// from this zoom level and above, render using circle style instead of heatmap
export const VESSELS_HEATMAP_STYLE_ZOOM_THRESHOLD = 6;
// the base radius, it can only be scaled down by the radius factor calculated on the dataset
export const VESSELS_BASE_RADIUS = 8;
// the minimum multiplier for vessels radius. Multiply by VESSELS_BASE_RADIUS to get the final radius in px
export const VESSELS_MINIMUM_RADIUS_FACTOR = 0.25;
// in heatmap style, defines how 'blurry' a point will look. Higher = less blur
export const VESSELS_HEATMAP_BLUR_FACTOR = 0.15;

export const VESSELS_HUES_INCREMENTS_NUM = 31; // 360 / VESSELS_HUES_INCREMENTS_NUM - 1  should give a round number
export const VESSELS_HUES_INCREMENT = 360 / (VESSELS_HUES_INCREMENTS_NUM - 1);

export const VESSELS_MINIMUM_OPACITY = 0.5;
export const VESSELS_HEATMAP_DIMMING_ALPHA = 0.5;

// tracks
export const HEATMAP_TRACK_HIGHLIGHT_HUE = 312;
export const TRACKS_DOTS_STYLE_ZOOM_THRESHOLD = 2;

// half a world, in projected world units
export const HALF_WORLD = 256 / 2;

// which scale (based on zoom level, here after <<) should be used for analytics tracked tile coordinates
export const ANALYTICS_TRACK_DRAG_FROM_ZOOM = 5;
export const ANALYTICS_TILE_COORDS_SCALE = 1 << 5;

// At which intervals should we consider showing a new frame. Impacts performance.
// Expressed in ms, for example 86400000 is 1 day (24*60*60*1000)
export const PLAYBACK_PRECISION = 86400000;
export const TIMELINE_OVERALL_START_DATE_OFFSET = Math.floor(TIMELINE_OVERALL_START_DATE / PLAYBACK_PRECISION);

// radius of vessels lookup in pixels,
// ie how large the clicked region should be for including vessels
export const VESSEL_CLICK_TOLERANCE_PX = 3.5;

// Colors of the layers, areas, ...
export const COLORS = {
  yellow: '#FBFF8B',
  lightBlue: '#67FBFE',
  purple: '#7D84FA',
  red: '#CC4E4E',
  orange: '#EC6C33',
  pink: '#CC68C4'
};

// Hue for each color
export const COLOR_HUES = {
  yellow: 60,
  lightBlue: 182,
  purple: 236,
  red: 0,
  orange: 36,
  pink: 305
};

// time range options in the duration picker menu
// replace moment humanized duration: use '1 month' instead of 'one month'
// https://momentjs.com/docs/#/customization/relative-time/
moment.updateLocale('en', {
  relativeTime: {
    m: '1 minute',
    h: '1 hour',
    d: '1 day',
    M: '1 month',
    y: '1 year'
  }
});

export const DURATION_PICKER_OPTIONS = [
  moment.duration(1, 'week'),
  moment.duration(15, 'days'),
  moment.duration(1, 'month'),
  moment.duration(3, 'months')
];

// search
export const SEARCH_RESULTS_LIMIT = 4;
export const SEARCH_QUERY_MINIMUM_LIMIT = 3;
export const SEARCH_MODAL_PAGE_SIZE = 14;

// filters
export const FLAG_FILTERS_LIMIT = 10;

// responsive
export const REVERSE_TOOLTIP_ITEMS_MOBILE = 5;
export const REVERSE_TOOLTIP_FILTERS_MOBILE = 3;

export const DEFAULT_EMBED_SIZE = 'Small';
export const EMBED_SIZE_SETTINGS = [
  {
    name: 'Small',
    width: 600,
    height: 400
  },
  {
    name: 'Medium',
    width: 800,
    height: 600
  },
  {
    name: 'Large',
    width: 1000,
    height: 800
  }
];

export const MINI_GLOBE_SETTINGS = {
  viewBoxX: -75,
  viewBoxY: -75,
  viewBoxWidth: 200,
  viewBoxHeight: 200,
  svgWidth: 50,
  scale: 100,
  viewportRatio: 1.1,
  zoomRatio: 2.4,
  defaultSize: 20,
  minZoom: 3
};
