import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import {
  getTilePelagosPromises,
  getCleanVectorArrays,
  groupData,
  addWorldCoordinates,
  getTilePlaybackData,
  selectVesselsAt
} from 'util/heatmapTileData';
import { LOADERS } from 'config';
import { LAYER_TYPES } from 'constants';
import { clearVesselInfo, addVessel, hideVesselsInfoPanel } from 'actions/vesselInfo';
import { trackMapClicked } from 'analytics/analyticsActions';
import { addLoader, removeLoader, zoomIntoVesselCenter } from 'actions/map';
import { point, inside, polygon } from '@turf/turf';
import tilebelt from '@mapbox/tilebelt';


export const ADD_HEATMAP_LAYER = 'ADD_HEATMAP_LAYER';
export const ADD_REFERENCE_TILE = 'ADD_REFERENCE_TILE';
export const HIGHLIGHT_VESSELS = 'HIGHLIGHT_VESSELS';
export const INIT_HEATMAP_LAYERS = 'INIT_HEATMAP_LAYERS';
export const REMOVE_HEATMAP_LAYER = 'REMOVE_HEATMAP_LAYER';
export const REMOVE_REFERENCE_TILE = 'REMOVE_REFERENCE_TILE';
export const UPDATE_HEATMAP_LAYER_TEMPORAL_EXTENTS_LOADED_INDICES = 'UPDATE_HEATMAP_LAYER_TEMPORAL_EXTENTS_LOADED_INDICES';
export const UPDATE_HEATMAP_TILES = 'UPDATE_HEATMAP_TILES';

/**
 * getTemporalExtentsVisibleIndices - Compares timebar outer extent with temporal extents present on the layer header
 * @param  {array} currentOuterExtent Current timebar outer extent
 * @param  {array} temporalExtents    Temporal extents present on the layer's header (an array of extent arrays)
 * @return {array}                    Indices of the layer's temporal extents that should be visible
 */
function getTemporalExtentsVisibleIndices(currentOuterExtent, temporalExtents) {
  const currentExtentStart = currentOuterExtent[0].getTime();
  const currentExtentEnd = currentOuterExtent[1].getTime();
  const indices = [];
  temporalExtents.forEach((temporalExtent, index) => {
    const temporalExtentStart = temporalExtent[0];
    const temporalExtentEnd = temporalExtent[1];
    if (temporalExtentEnd >= currentExtentStart && temporalExtentStart <= currentExtentEnd) {
      indices.push(index);
    }
  });
  return indices;
}


/**
 * initHeatmapLayers - Creates the base reducer state, extracting heatmap layers from all layers
 */
export function initHeatmapLayers() {
  return (dispatch, getState) => {
    const currentOuterExtent = getState().filters.timelineOuterExtent;
    const workspaceLayers = getState().layers.workspaceLayers;
    const heatmapLayers = {};

    workspaceLayers.forEach((workspaceLayer) => {
      if (workspaceLayer.type === LAYER_TYPES.Heatmap && workspaceLayer.added === true) {
        heatmapLayers[workspaceLayer.id] = {
          url: workspaceLayer.url,
          tiles: [],
          tilesetId: workspaceLayer.tilesetId,
          // initially attach which of the temporal extents indices are visible with initial outerExtent
          visibleTemporalExtentsIndices: getTemporalExtentsVisibleIndices(currentOuterExtent, workspaceLayer.header.temporalExtents)
        };
      }
    });

    dispatch({
      type: INIT_HEATMAP_LAYERS,
      payload: heatmapLayers
    });
  };
}


/**
 * loadLayerTile - loads an heatmap tile.
 *
 * @param  {object} tileCoordinates        tile coordinates from reference tile
 * @param  {string} layerUrl             the base layer url
 * @param  {string} token                the user's token
 * @param  {array} temporalExtents       all of the layer's header temporal extents
 * @param  {array} temporalExtentsIndices which of the temporal extents from  temporalExtents should be loaded
 * @return {Promise}                     a Promise that will be resolved when tile is loaded
 */
function loadLayerTile(tileCoordinates, layerUrl, token, temporalExtents, temporalExtentsLess, temporalExtentsIndices) {
  // const tileCoordinates = referenceTile.tileCoordinates;
  const pelagosPromises = getTilePelagosPromises(layerUrl, token, temporalExtents, {
    tileCoordinates,
    temporalExtentsIndices,
    temporalExtentsLess
  });
  const allLayerPromises = Promise.all(pelagosPromises);

  const layerTilePromise = new Promise((resolve) => {
    allLayerPromises.then((rawTileData) => {
      resolve(rawTileData);
    });
  });

  return layerTilePromise;
}

/**
 * parseLayerTile - parses an heatmap tile to a playback-ready format.
 *
 * @param  {object} tileCoordinates      tile coordinates from reference tile
 * @param  {array} columns               names of the columns present in the raw tiles that need to be included in the final playback data
 * @param  {object} map                  a reference to the Google Map object. This is required to access projection data.
 * @param  {Object} rawTileData
 * @param  {array} prevPlaybackData      (optional) in case some time extent was already loaded for this tile, append to this data
 * @return {Object}                      playback-ready merged data
 */
function parseLayerTile(tileCoordinates, columns, map, rawTileData, prevPlaybackData) {
  // console.time('test')
  const cleanVectorArrays = getCleanVectorArrays(rawTileData);
  const groupedData = groupData(cleanVectorArrays, columns);
  console.log([tileCoordinates.zoom,tileCoordinates.x, tileCoordinates.y].join(','))
  if (tileCoordinates.zoom === 3 && tileCoordinates.x === 2 && tileCoordinates.y === 5) {
    console.log('load Argentina tile')
    console.log(Object.keys(groupedData).length)
  }
  if (Object.keys(groupedData).length === 0) {
    return [];
  }
  const vectorArray = (columns.indexOf('latitude') > -1) ? addWorldCoordinates(groupedData, map) : groupedData;
  const data = getTilePlaybackData(
    tileCoordinates.zoom,
    vectorArray,
    columns,
    prevPlaybackData,
    tileCoordinates
  );
  return data;
  // console.timeEnd('test');
}

/**
 * getTiles - loads a bunch of heatmap tiles
 * @param  {array} layerIds                 list of layer Ids that need to be loaded for this/these tiles
 * @param  {array} referenceTiles           list of reference tiles (tile data regardless of layer) that need to be loaded
 * @param  {object} newTemporalExtentsToLoad (optional) a dict (layerId is the key) of temporal extents indices that should be
 * appended to existing data
 */
function getTiles(layerIds, referenceTiles, newTemporalExtentsToLoad) {
  return (dispatch, getState) => {
    const loaderId = LOADERS.HEATMAP_TILES + new Date().getTime();
    dispatch(addLoader(loaderId));
    const layers = getState().heatmap.heatmapLayers;
    const token = getState().user.token;
    const map = getState().map.googleMaps;
    const allPromises = [];

    layerIds.forEach((layerId) => {
      const workspaceLayers = getState().layers.workspaceLayers;
      const workspaceLayer = workspaceLayers.find(layer => layer.id === layerId);
      const layerHeader = workspaceLayer.header;
      if (!layerHeader) {
        console.warn('no header has been set on this heatmap layer');
      }
      referenceTiles.forEach((referenceTile) => {
        // check if tile does not already exist first
        let tile = layers[layerId].tiles.find(t => t.uid === referenceTile.uid);
        if (!tile) {
          tile = {
            uid: referenceTile.uid,
            canvas: referenceTile.canvas,
            temporalExtentsIndicesLoaded: []
          };
          layers[layerId].tiles.push(tile);
        }

        const queriedTemporalExtentsIndices = (newTemporalExtentsToLoad === undefined)
          ? layers[layerId].visibleTemporalExtentsIndices
          : newTemporalExtentsToLoad[layerId];

        const temporalExtentsIndicesToLoad = difference(queriedTemporalExtentsIndices, tile.temporalExtentsIndicesLoaded);

        const tilePromise = loadLayerTile(
          referenceTile.tileCoordinates,
          // TODO use URL from header
          layers[layerId].url,
          token,
          layerHeader.temporalExtents,
          layerHeader.temporalExtentsLess,
          temporalExtentsIndicesToLoad
        );

        allPromises.push(tilePromise);

        tilePromise.then((rawTileData) => {
          tile.temporalExtentsIndicesLoaded = uniq(tile.temporalExtentsIndicesLoaded.concat(temporalExtentsIndicesToLoad));

          if (referenceTile.tileCoordinates.zoom === 3 && referenceTile.tileCoordinates.x === 2 && referenceTile.tileCoordinates.y === 5) {
            console.log('Argentina')
            let countTest = 0;
            // const testBounds = polygon([[[-67.1044921875,-53.1204052831],[-59.501953125,-53.1204052831],[-59.501953125,-37.1603165467],[-67.1044921875,-37.1603165467],[-67.1044921875,-53.1204052831]]]);
            const tileBounds = tilebelt.tileToGeoJSON([2, 5, 3]);
            const tileBoundsPoly = polygon(tileBounds.coordinates);
            const lats = Array.prototype.slice.call(rawTileData[0].latitude);
            const lons = Array.prototype.slice.call(rawTileData[0].longitude);
            lats.forEach((lat, i) => {
              const pt = point([lons[i], lat]);
              if (inside(pt, tileBoundsPoly)) {
                countTest++;
              }
            })
            console.log(countTest)
            debugger
          }
          tile.data = parseLayerTile(
            referenceTile.tileCoordinates,
            Object.keys(layerHeader.colsByName),
            map,
            rawTileData,
            tile.data
          );
          dispatch({
            type: UPDATE_HEATMAP_TILES, payload: layers
          });
        });
      });
    });

    Promise.all(allPromises).then(() => {
      dispatch(removeLoader(loaderId));
    });
  };
}


/**
 * getTile - This action is emitted when a new tile is queried from panning or zooming the map
 * This will load a tile for all currently visible heatmap layers
 *
 * @param  {number} uid             the reference tile uid
 * @param  {object} tileCoordinates the reference tiles coordinates
 * @param  {object} canvas          the tiles DOM canvas
 */
export function getTile(uid, tileCoordinates, canvas) {
  return (dispatch, getState) => {
    const referenceTile = {
      uid,
      tileCoordinates,
      canvas
    };

    dispatch({
      type: ADD_REFERENCE_TILE,
      payload: referenceTile
    });

    const visibleHeatmapLayers = getState().layers.workspaceLayers.filter(workspaceLayer =>
      workspaceLayer.type === LAYER_TYPES.Heatmap && workspaceLayer.added === true && workspaceLayer.visible === true)
      .map(layer => layer.id);

    dispatch(getTiles(visibleHeatmapLayers, [referenceTile]));
  };
}


/**
 * releaseTile - This action is emitted when an existing tile is removed from panning or zooming the map
 * @param  {type} uid the reference tile uid
 */
export function releaseTile(uid) {
  return (dispatch, getState) => {
    dispatch({
      type: REMOVE_REFERENCE_TILE,
      payload: uid
    });

    const layers = getState().heatmap.heatmapLayers;
    Object.keys(layers).forEach((layerId) => {
      const layer = layers[layerId];
      const tiles = layer.tiles;
      const releasedTileIndex = tiles.findIndex(tile => tile.uid === uid);
      if (releasedTileIndex === -1) {
        return;
      }
      tiles.splice(releasedTileIndex, 1);
    });
    dispatch({
      type: UPDATE_HEATMAP_TILES, payload: layers
    });
  };
}


export function loadAllTilesForLayer(layerId) {
  return (dispatch, getState) => {
    //                current layer, all reference tiles
    dispatch(getTiles([layerId], getState().heatmap.referenceTiles));
  };
}


export function addHeatmapLayerFromLibrary(layerId, url) {
  return (dispatch) => {
    dispatch({
      type: ADD_HEATMAP_LAYER,
      payload: {
        layerId,
        url
      }
    });

    dispatch(loadAllTilesForLayer(layerId));
  };
}

export function removeHeatmapLayerFromLibrary(id) {
  return (dispatch) => {
    dispatch({
      type: REMOVE_HEATMAP_LAYER,
      payload: {
        id
      }
    });
  };
}

/**
 * loadTilesExtraTimeRange - when outer time extent changes, checks if more tiles needs to be loaded
 * by comparing the outer time range with the temporalExtent already loaded on each layer
 */
export function loadTilesExtraTimeRange() {
  return (dispatch, getState) => {
    const currentOuterExtent = getState().filters.timelineOuterExtent;
    const heatmapLayers = getState().heatmap.heatmapLayers;
    const layersToUpdate = {};
    Object.keys(heatmapLayers).forEach((layerId) => {
      const workspaceLayer = getState().layers.workspaceLayers.find(layer => layer.id === layerId);
      const heatmapLayer = heatmapLayers[layerId];
      const oldVisibleTemporalExtents = heatmapLayer.visibleTemporalExtentsIndices;
      const newVisibleTemporalExtents = getTemporalExtentsVisibleIndices(currentOuterExtent, workspaceLayer.header.temporalExtents);
      const diff = difference(newVisibleTemporalExtents, oldVisibleTemporalExtents);
      if (diff.length) {
        // add new loaded indices to heatmap layer if applicable
        layersToUpdate[layerId] = diff;
        dispatch({
          type: UPDATE_HEATMAP_LAYER_TEMPORAL_EXTENTS_LOADED_INDICES,
          payload: {
            layerId,
            diff
          }
        });
      }
    });

    // getTiles with indices diff
    if (Object.keys(layersToUpdate).length) {
      dispatch(getTiles(Object.keys(layersToUpdate), getState().heatmap.referenceTiles, layersToUpdate));
    }
  };
}

/**
 * Gets all the categories for all the filters of a Heatmap layer
 * @param {object} state - the application state
 * @param {string} layerId - the id of a heatmap layer
 * @return {array} categories
 */
const _getCurrentFiltersForLayer = (state, layerId) => {
  if (layerId === undefined) return undefined;
  return state.filterGroups.layerFilters[layerId];
};

/**
 * Returns clusters or vessels data from a tileQuery
 * @param {object} state - the application state
 * @param {string} tileQuery - the id of a heatmap layer
 * @return {object} { isEmpty, isCluster, isMouseCluster, foundVessels, layerId, tilesetId }
 */
const _queryHeatmap = (state, tileQuery) => {
  const layers = state.heatmap.heatmapLayers;
  const timelineExtent = state.filters.timelineInnerExtentIndexes;
  const startIndex = timelineExtent[0];
  const endIndex = timelineExtent[1];
  const layersVessels = [];

  Object.keys(layers).forEach((layerId) => {
    const workspaceLayer = state.layers.workspaceLayers.find(l => l.id === layerId);
    if (workspaceLayer.added === true && workspaceLayer.visible === true) {
      const layer = layers[layerId];
      const queriedTile = layer.tiles.find(tile => tile.uid === tileQuery.uid);
      const currentFilters = _getCurrentFiltersForLayer(state, layerId);
      if (queriedTile !== undefined && queriedTile.data !== undefined) {
        layersVessels.push({
          layerId,
          tilesetId: layer.tilesetId,
          vessels: selectVesselsAt(queriedTile.data, state.map.zoom, tileQuery.worldX,
            tileQuery.worldY, startIndex, endIndex, currentFilters)
        });
      }
    }
  });

  const layersVesselsResult = layersVessels.filter(layerVessels => layerVessels.vessels.length > 0);

  // it's a cluster because of aggregation on the server side
  let isCluster;
  // its a cluster because or multiple vessels under mouse
  let isMouseCluster;
  let isEmpty;
  let layerId;
  let tilesetId;
  let foundVessels;

  if (layersVesselsResult.length === 0) {
    isEmpty = true;
  } else if (layersVesselsResult.length > 1) {
    // if there are points over multiple layers, consider this a cluster
    isCluster = true;
  } else {
    // we can get multiple points with similar series and seriesgroup, in which case
    // we should treat that as a successful vessel query, not a cluster
    layerId = layersVesselsResult[0].layerId;
    tilesetId = layersVesselsResult[0].tilesetId;
    const vessels = layersVesselsResult[0].vessels;

    if (vessels.length === 0) {
      isEmpty = true;
    } else {
      // look up for any non-negative seriesgroup (not clusters on the server side)
      const nonClusteredVessels = vessels.filter(v => v.seriesgroup > 0);

      if (nonClusteredVessels.length) {
        foundVessels = uniqBy(nonClusteredVessels, v => v.series).map(v => ({
          series: v.series,
          seriesgroup: v.seriesgroup
        }));
        isMouseCluster = foundVessels.length > 1;
      } else {
        isCluster = true;
      }
    }
  }

  return { isEmpty, isCluster, isMouseCluster, foundVessels, layerId, tilesetId };
};

export function highlightVesselFromHeatmap(tileQuery, latLng) {
  return (dispatch, getState) => {
    const state = getState();
    const { layerId, isEmpty, isCluster, isMouseCluster, foundVessels } = _queryHeatmap(state, tileQuery);

    dispatch({
      type: HIGHLIGHT_VESSELS,
      payload: {
        layerId,
        isEmpty,
        clickableCluster: isCluster === true || isMouseCluster === true,
        highlightableCluster: isCluster !== true,
        foundVessels,
        latLng
      }
    });
  };
}

export function clearHighlightedVessels() {
  return {
    type: HIGHLIGHT_VESSELS,
    payload: {
      isEmpty: true,
      clickableCluster: false
    }
  };
}

export function getVesselFromHeatmap(tileQuery, latLng) {
  return (dispatch, getState) => {
    const state = getState();

    if (state.user.userPermissions !== null && state.user.userPermissions.indexOf('selectVessel') === -1) {
      return;
    }

    const { isEmpty, isCluster, isMouseCluster, tilesetId, foundVessels } = _queryHeatmap(state, tileQuery);

    dispatch(clearVesselInfo());

    if (isEmpty === true) {
      // nothing to see here
    } else if (isCluster === true || isMouseCluster === true) {
      dispatch(trackMapClicked(latLng.lat(), latLng.lng(), 'cluster'));
      dispatch(hideVesselsInfoPanel());
      dispatch(zoomIntoVesselCenter(latLng));
      dispatch({
        type: HIGHLIGHT_VESSELS,
        payload: { isEmpty: true }
      });
    } else {
      dispatch(trackMapClicked(latLng.lat(), latLng.lng(), 'vessel'));
      const selectedSeries = foundVessels[0].series;
      const selectedSeriesgroup = foundVessels[0].seriesgroup;

      dispatch(addVessel(tilesetId, selectedSeriesgroup, selectedSeries));
    }
  };
}
