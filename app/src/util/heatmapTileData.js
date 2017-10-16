import PelagosClient from 'lib/pelagosClient';
import pull from 'lodash/pull';
import uniq from 'lodash/uniq';
import sumBy from 'lodash/sumBy';
import { point, inside, polygon } from '@turf/turf';

import {
  PLAYBACK_PRECISION,
  VESSELS_HEATMAP_STYLE_ZOOM_THRESHOLD,
  VESSELS_MINIMUM_RADIUS_FACTOR,
  VESSELS_MINIMUM_OPACITY,
  VESSEL_CLICK_TOLERANCE_PX,
  TIMELINE_OVERALL_START_DATE_OFFSET
} from 'config';

/**
 * From a timestamp in ms returns a time with the precision set in Constants.
 * @param timestamp
 */
export const getTimeAtPrecision = timestamp =>
  Math.floor(timestamp / PLAYBACK_PRECISION);

/**
 * From a timestamp in ms returns a time with the precision set in Constants, offseted at the
 * beginning of available time (outerStart)
 * @param timestamp
 */
export const getOffsetedTimeAtPrecision = timestamp =>
  Math.max(0, getTimeAtPrecision(timestamp) - TIMELINE_OVERALL_START_DATE_OFFSET);

/**
 * Generates the URLs to load vessel track data for a tile
 *
 * @param {string} tilesetUrl       the tileset base URL
 * @param {array} temporalExtents   all tileset temporal extents
 * @param {object} params           - seriesgroup: a seriesgroup id, used for tracks loading
 *                                  - tileCoordinates: this tiles tile coordinates (zoom, x, y). Will default to 0,0,0
 *                                  - temporalExtentsIndices: restrict to these temporalExtents indices
 * @returns {Array}                 an array of URLs for this tile
 */
const getTemporalTileURLs = (tilesetUrl, temporalExtents, params) => {
  const urls = [];
  (temporalExtents || [null]).forEach((extent, index) => {
    let url = `${tilesetUrl}/`;
    if (params.seriesgroup) {
      url += `sub/seriesgroup=${params.seriesgroup}/`;
    }
    if (extent !== null && params.temporalExtentsLess !== true) {
      const start = new Date(extent[0]).toISOString();
      const end = new Date(extent[1]).toISOString();
      url += `${start},${end};`;
    }
    if (params.tileCoordinates) {
      url += `${params.tileCoordinates.zoom},${params.tileCoordinates.x},${params.tileCoordinates.y}`;
    } else {
      // meh.
      url += '0,0,0';
    }
    if (!params.temporalExtentsIndices || params.temporalExtentsIndices.indexOf(index) > -1) {
      urls.push(url);
    }
  });
  return urls;
};


/**
 * See getTemporalTileURLs.
 */
export const getTilePelagosPromises = (tilesetUrl, token, temporalExtents, params) => {
  const promises = [];
  const urls = getTemporalTileURLs(
    tilesetUrl,
    temporalExtents,
    params
  );
  for (let urlIndex = 0, length = urls.length; urlIndex < length; urlIndex++) {
    promises.push(new PelagosClient().obtainTile(urls[urlIndex], token));
  }

  return promises;
};


export const getCleanVectorArrays = rawTileData => rawTileData.filter(vectorArray => vectorArray !== null);

/**
 * As data will come in multiple arrays (1 per API query/year basically), they need to be merged here
 *
 * @param cleanVectorArrays an array of objects containing a Float32Array for each vessel param (lat, lon, weight...)
 * @param columns the keys to pick on the vectorArrays (lat, lon, weight, etc)
 * @returns an object containing a Float32Array for each API_RETURNED_KEY (lat, lon, weight, etc)
 */
export const groupData = (cleanVectorArrays, columns) => {
  const data = {};

  const totalVectorArraysLength = sumBy(cleanVectorArrays, a => a.longitude.length);

  const filteredColumns = columns.filter((column) => {
    if (cleanVectorArrays[0] && cleanVectorArrays[0][column] === undefined) {
      console.warn(`column ${column} is present in layerHeader.colsByName but not in tile data`);
      return false;
    }
    return true;
  });

  filteredColumns.forEach((key) => {
    data[key] = new Float32Array(totalVectorArraysLength);
  });

  let currentArray;
  let cumulatedOffsets = 0;

  const appendValues = (key) => {
    data[key].set(currentArray[key], cumulatedOffsets);
  };

  for (let index = 0, length = cleanVectorArrays.length; index < length; index++) {
    currentArray = cleanVectorArrays[index];
    filteredColumns.forEach(appendValues);
    cumulatedOffsets += currentArray.longitude.length;
  }
  return data;
};

/**
 * Add projected lat/long values transformed as tile-relative x/y coordinates
 * @param vectorArray typed arrays, including latitude and longitude
 * @param map a reference to the original Google Map
 */
export const addWorldCoordinates = (vectorArray, map) => {
  const data = vectorArray;
  const proj = map.getProjection();
  data.worldX = new Float32Array(data.latitude.length);
  data.worldY = new Float32Array(data.longitude.length);
  for (let index = 0, length = data.latitude.length; index < length; index++) {
    const worldPoint = proj.fromLatLngToPoint(new google.maps.LatLng(data.latitude[index], data.longitude[index]));
    data.worldX[index] = worldPoint.x;
    data.worldY[index] = worldPoint.y;
  }
  return data;
};

const _getZoomFactorRadiusRenderingMode = zoom => ((zoom < VESSELS_HEATMAP_STYLE_ZOOM_THRESHOLD) ? 0.3 : 0.15);
const _getZoomFactorRadius = zoom => (zoom - 1) ** 2.5;
const _getRadius = (sigma, zoomFactorRadiusRenderingMode, zoomFactorRadius) => {
  let radius = zoomFactorRadiusRenderingMode * Math.max(0.8, 2 + Math.log(sigma * zoomFactorRadius));
  radius = Math.max(VESSELS_MINIMUM_RADIUS_FACTOR, radius);
  return radius;
};


/**
 * Converts Vector Array data to Playback format and stores it locally
 *
 * @param zoom the current zoom, used in radius calculations
 * @param vectorArray the source data before indexing by day
 * @param columns the columns present on the dataset, determined by tileset headers
 * @param prevPlaybackData an optional previously loaded tilePlaybackData array (when adding time range)
 */
export const getTilePlaybackData = (zoom, vectorArray, columns, prevPlaybackData, tileCoordinates) => {
  const tilePlaybackData = (prevPlaybackData === undefined) ? [] : prevPlaybackData;

  const zoomFactorRadius = _getZoomFactorRadius(zoom);
  const zoomFactorRadiusRenderingMode = _getZoomFactorRadiusRenderingMode(zoom);

  const zoomFactorOpacity = ((zoom - 1) ** 3.5) / 1000;

  // columns specified by header columns, remove a set of mandatory columns, remove unneeded columns
  let extraColumns = [].concat(columns);
  pull(extraColumns, 'x', 'y', 'weight', 'sigma', 'radius', 'opacity');  // those are mandatory thus manually added
  pull(extraColumns, 'latitude', 'longitude', 'datetime'); // we only need projected coordinates, ie x/y
  extraColumns = uniq(extraColumns);

  let countTest = 0;
  const testBounds = polygon([[[-67.1044921875,-53.1204052831],[-59.501953125,-53.1204052831],[-59.501953125,-37.1603165467],[-67.1044921875,-37.1603165467],[-67.1044921875,-53.1204052831]]])
  if (tileCoordinates.zoom === 3 && tileCoordinates.x === 2 && tileCoordinates.y === 5) {
    console.log('Argentina')
    debugger
  }

  for (let index = 0, length = vectorArray.latitude.length; index < length; index++) {
    const datetime = vectorArray.datetime[index];

    const timeIndex = getOffsetedTimeAtPrecision(datetime);
    const worldX = vectorArray.worldX[index];
    const worldY = vectorArray.worldY[index];
    const weight = vectorArray.weight[index];
    const sigma = vectorArray.sigma[index];
    const radius = _getRadius(sigma, zoomFactorRadiusRenderingMode, zoomFactorRadius);
    let opacity = 3 + Math.log(weight * zoomFactorOpacity);
    // TODO quick hack to avoid negative values, check why that happens
    opacity = Math.max(0, opacity);
    opacity = 3 + Math.log(opacity);
    opacity = 0.1 + (0.2 * opacity);
    opacity = Math.min(1, Math.max(VESSELS_MINIMUM_OPACITY, opacity));

    const pt = point([vectorArray.longitude[index], vectorArray.latitude[index]]);
    if (inside(pt, testBounds)) {
      countTest++;
    }

    if (!tilePlaybackData[timeIndex]) {
      const frame = {
        worldX: [worldX],
        worldY: [worldY],
        radius: [radius],
        opacity: [opacity]
      };
      extraColumns.forEach((column) => {
        frame[column] = [vectorArray[column][index]];
      });
      tilePlaybackData[timeIndex] = frame;
      continue;
    }
    const frame = tilePlaybackData[timeIndex];
    frame.worldX.push(worldX);
    frame.worldY.push(worldY);
    frame.radius.push(radius);
    frame.opacity.push(opacity);
    extraColumns.forEach((column) => {
      frame[column].push(vectorArray[column][index]);
    });
  }

  if (countTest > 0 || (tileCoordinates.z === 3 && tileCoordinates.x === 2 && tileCoordinates.y === 5)) {
    console.log(tileCoordinates);
    console.log(countTest)
  }
  return tilePlaybackData;
};


export const addTracksPointsRenderingData = (data) => {
  data.hasFishing = [];

  for (let index = 0, length = data.weight.length; index < length; index++) {
    data.hasFishing[index] = data.weight[index] > 0;
  }
  return data;
};


/**
 * A simplified version of getTilePlaybackData for tracks
 * Converts Vector Array data to Playback format (organized by days) and stores it locally
 * @param vectorArray the source data before indexing by day
 */
export const getTracksPlaybackData = (vectorArray) => {
  const playbackData = [];

  for (let index = 0, length = vectorArray.series.length; index < length; index++) {
    const datetime = vectorArray.datetime[index];
    const timeIndex = getOffsetedTimeAtPrecision(datetime);

    if (!playbackData[timeIndex]) {
      const frame = {
        worldX: [vectorArray.worldX[index]],
        worldY: [vectorArray.worldY[index]],
        series: [vectorArray.series[index]],
        hasFishing: [vectorArray.hasFishing[index]]
      };
      playbackData[timeIndex] = frame;
      continue;
    }
    const frame = playbackData[timeIndex];
    frame.worldX.push(vectorArray.worldX[index]);
    frame.worldY.push(vectorArray.worldY[index]);
    frame.series.push(vectorArray.series[index]);
    frame.hasFishing.push(vectorArray.hasFishing[index]);
  }
  return playbackData;
};

export const vesselSatisfiesFilters = (frame, index, filterValues) => {
  const satisfiesFilters = Object.keys(filterValues).every((field) => {
    if (frame[field] === undefined) {
      // this field is not available on this layer. This can happen in an edge case described
      // here: https://github.com/Vizzuality/GlobalFishingWatch/issues/661#issuecomment-334496469
      return false;
    }
    return frame[field][index] === filterValues[field];
  });
  return satisfiesFilters;
};

const vesselSatisfiesAllFilters = (frame, index, filters) => {
  const satisfiesAllFilters = filters.every(filter => vesselSatisfiesFilters(frame, index, filter.filterValues));
  return satisfiesAllFilters;
};

export const selectVesselsAt = (tileData, currentZoom, worldX, worldY, startIndex, endIndex, currentFilters) => {
  const vessels = [];

  // convert px tolerance/radius to world units
  const scale = 2 ** currentZoom;
  const vesselClickToleranceWorld = VESSEL_CLICK_TOLERANCE_PX / scale;

  for (let f = startIndex; f < endIndex; f++) {
    const frame = tileData[f];
    if (frame === undefined) continue;
    for (let i = 0; i < frame.worldX.length; i++) {
      const wx = frame.worldX[i];
      const wy = frame.worldY[i];

      if ((!currentFilters.length || vesselSatisfiesAllFilters(frame, i, currentFilters)) &&
          wx >= worldX - vesselClickToleranceWorld && wx <= worldX + vesselClickToleranceWorld &&
          wy >= worldY - vesselClickToleranceWorld && wy <= worldY + vesselClickToleranceWorld) {
        const vessel = {
          series: frame.series[i],
          seriesgroup: frame.seriesgroup[i]
        };

        if (frame.category !== undefined) {
          vessel.category = frame.category[i];
        }
        vessels.push(vessel);
      }
    }
  }
  return vessels;
};

/*
export const getHistogram = (tiles, propName = 'weight') => {
  let data = tiles
    .filter(tile => tile.ready)
    .map(tile => tile.data
      .map(frame => frame[propName]));
  data = flattenDeep(data);
  if (data.length) {
    const bins = d3.histogram().thresholds(d3.thresholdScott)(data);
    const x = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([0, 50]);
    console.table(bins.filter(bin => bin.length).map((bin) => {
      const binMin = d3.min(bin).toLocaleString({ maximumFractionDigits: 2 });
      const binMax = d3.max(bin).toLocaleString({ maximumFractionDigits: 2 });
      return {
        range: [binMin, binMax].join('﹣'),
        bars: Array(Math.round(x(bin.length))).join('█'),
        num: bin.length
      };
    }));
  }
};
*/
