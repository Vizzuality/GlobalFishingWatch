/* eslint react/sort-comp:0 */
/* eslint-disable max-len  */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import delay from 'lodash/delay';
import template from 'lodash/template';
import templateSettings from 'lodash/templateSettings';
import { MIN_ZOOM_LEVEL } from 'config';
import ControlPanel from 'mapPanels/rightControlPanel/containers/ControlPanel';
import Timebar from 'timebar/containers/Timebar';
import Leyend from 'mapPanels/leftControlPanel/components/Legend';
import MiniGlobe from 'mapPanels/leftControlPanel/components/MiniGlobe';
import MobileLeftExpand from 'mapPanels/leftControlPanel/components/MobileLeftExpand';
import ReportPanel from 'report/containers/ReportPanel';
import MapLayers from 'containers/Layers/MapLayers';
import DrawingManager from 'containers/Map/DrawingManager';
import Areas from 'areasOfInterest/containers/Areas';
import MapFooter from 'siteNav/components/MapFooter';
import LeftControlPanel from 'mapPanels/leftControlPanel/containers/LeftControlPanel';
import mapStyles from 'styles/components/map.scss';
import mapPanelsStyles from 'styles/components/map-panels.scss';
import Attributions from 'siteNav/components/Attributions';

class MapContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onZoomChanged = this.onZoomChanged.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onMapContainerClick = this.onMapContainerClick.bind(this);
  }

  /**
   * Zoom change handler
   */
  onZoomChanged() {
    if (this.map.getZoom() !== this.props.zoom) {
      this.props.setZoom(this.map.getZoom());
    }
    const center = this.map.getCenter();
    this.props.setCenter([center.lat(), center.lng()], this._getCenterWorld(center));
  }

  componentDidMount() {
    const mapDefaultOptions = {
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: false,
      zoom: this.props.zoom,
      center: { lat: this.props.centerLat, lng: this.props.centerLong },
      mapTypeId: google.maps.MapTypeId.HYBRID,
      maxZoom: this.props.maxZoom,
      minZoom: MIN_ZOOM_LEVEL
    };
    // Create the map and initialize on the first idle event
    this.map = new google.maps.Map(document.getElementById('map'), mapDefaultOptions);
    // do not use a bound function here as @#$%^ GMaps does not know how to unsubscribe from events attached to them
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.onMapInit();
    });
    window.addEventListener('resize', this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  onWindowResize() {
    const vpSize = this.getViewportSize();
    if (vpSize) {
      this.setState(vpSize);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.map) {
      return;
    }
    this.updateBasemap(nextProps);
    if (this.props.maxZoom !== nextProps.maxZoom) {
      this.map.set('maxZoom', nextProps.maxZoom);
    }
    if (this.props.zoom !== nextProps.zoom) {
      // do not update the map zoom if it is already matching state
      // (it means the map has been zoomed internally, ie mousewheel)
      if (this.map.getZoom() !== nextProps.zoom) {
        // the delay guarantees that tiles updates coming from the state are flushed to MapLayer's GLContainer
        // before starting the zoom animation
        // the goal is to avoid having the heatmap 'frozen' while zooming
        delay(() => {
          this.map.setZoom(nextProps.zoom);

          // update the center with zoom - useful when zooming to a cluster
          if (nextProps.centerLat || nextProps.centerLong) {
            this.map.setCenter({ lat: nextProps.centerLat, lng: nextProps.centerLong });
          }
        }, 51);
      }
    } else if (
      (nextProps.centerLat || nextProps.centerLong) &&
      (this.props.centerLat !== nextProps.centerLat || this.props.centerLong !== nextProps.centerLong)
    ) {
      this.map.setCenter({ lat: nextProps.centerLat, lng: nextProps.centerLong });
    }

    if (nextProps.trackBounds) {
      if (!this.props.trackBounds || !nextProps.trackBounds.equals(this.props.trackBounds)) {
        this.map.fitBounds(nextProps.trackBounds);
      }
    }
  }

  updateBasemap(nextProps) {
    if (!nextProps.activeBasemap || nextProps.activeBasemap === this.props.activeBasemap) return;
    this.map.setMapTypeId(nextProps.activeBasemap);
  }

  onMouseMove(point) {
    this.map.setOptions({ draggableCursor: 'default' });
    this.props.setMouseLatLong(point.latLng.lat().toFixed(4), point.latLng.lng().toFixed(4));
  }

  onDragEnd() {
    const center = this.map.getCenter();
    let wrappedLongitude = center.lng();
    if (wrappedLongitude > 180 || wrappedLongitude < -180) {
      wrappedLongitude -= Math.floor((wrappedLongitude + 180) / 360) * 360;
    }

    this.props.setCenter([Math.max(Math.min(center.lat(), 85), -85), wrappedLongitude], this._getCenterWorld(center));
  }

  _getCenterWorld(center) {
    return this.map.getProjection().fromLatLngToPoint(center);
  }

  /**
   * Handles map idle event (once loading is done)
   * Used here to do the initial load of the layers
   */
  onMapInit() {
    if (!this.mapContainerRef) {
      console.warn('GMaps fired init but React container is not ready');
      return;
    }
    google.maps.event.addListener(this.map, 'dragend', this.onDragEnd);
    google.maps.event.addListener(this.map, 'zoom_changed', this.onZoomChanged);
    google.maps.event.addListener(this.map, 'mousemove', this.onMouseMove);
    this.props.initMap(this.map);
    this.props.loadInitialState();
    this.defineBasemaps(this.props.basemaps);
    // pass map and viewport dimensions down to MapLayers
    const stateUpdate = this.getViewportSize();
    stateUpdate.map = this.map;
    this.setState(stateUpdate);
  }

  getViewportSize() {
    if (!this.mapContainerRef) {
      console.warn('map container is not ready');
      return null;
    }
    const rect = this.mapContainerRef.getBoundingClientRect();
    return {
      viewportWidth: rect.width,
      viewportHeight: rect.height
    };
  }

  defineBasemaps(basemaps) {
    templateSettings.interpolate = /{([\s\S]+?)}/g;
    basemaps.filter(b => b.type === 'Basemap').forEach((basemap) => {
      const urlTemplate = template(basemap.url);
      this.map.mapTypes.set(basemap.title, new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => urlTemplate({ x: coord.x, y: coord.y, z: zoom }),
        tileSize: new google.maps.Size(256, 256),
        name: basemap.title,
        maxZoom: 18
      }));
    });
  }

  onMapContainerClick(event) {
    if (event.target.className.match('js-polygon-report') === null) {
      this.props.clearReportPolygon();
    }
  }

  render() {
    const { activeSubmenu, isEmbedded, openSupportFormModal,
      onExternalLink, isDrawing, showMapCursorPointer, showMapCursorZoom } = this.props;
    return (<div className="fullHeightContainer" >
      {!isEmbedded &&
      <div
        className={classnames(
          mapPanelsStyles.mapPanels,
          {
            [mapPanelsStyles._noFooter]: !COMPLETE_MAP_RENDER
          }
        )}
      >
        <ControlPanel isEmbedded={isEmbedded} />
        <ReportPanel />
      </div >
      }
      <div
        className={classnames(
          mapStyles.mapContainer,
          { [mapStyles._noFooter]: !COMPLETE_MAP_RENDER },
          { _mapPointer: showMapCursorPointer },
          { _mapZoom: showMapCursorZoom }
        )}
        ref={(mapContainerRef) => {
          this.mapContainerRef = mapContainerRef;
        }}
      >
        <div
          id="map"
          className={mapStyles.map}
          style={{ height: '100%' }}
          onClick={this.onMapContainerClick}
        />

        {isDrawing && <DrawingManager />}
        <Areas />
        <LeftControlPanel isEmbedded={isEmbedded} />
        {!activeSubmenu && <Attributions isEmbedded={isEmbedded} />}
      </div >
      <MapLayers
        map={this.map}
        viewportWidth={this.state.viewportWidth}
        viewportHeight={this.state.viewportHeight}
      />
      <MobileLeftExpand>
        <MiniGlobe
          center={{ lat: this.props.centerLat, lng: this.props.centerLong }}
          zoom={this.props.zoom}
          viewportWidth={this.state.viewportWidth}
          viewportHeight={this.state.viewportHeight}
        />
        <Leyend />
      </MobileLeftExpand>
      <div className={classnames(mapStyles.timebarContainer, { [mapStyles._noFooter]: !COMPLETE_MAP_RENDER })} >
        <Timebar />
      </div >
      {COMPLETE_MAP_RENDER &&
      <MapFooter
        onOpenSupportFormModal={openSupportFormModal}
        isEmbedded={isEmbedded}
        onExternalLink={onExternalLink}
      />
      }
    </div >);
  }
}

MapContainer.propTypes = {
  activeBasemap: PropTypes.string.isRequired,
  areas: PropTypes.array.isRequired,
  basemaps: PropTypes.array.isRequired,
  centerLat: PropTypes.number,
  centerLong: PropTypes.number,
  clearReportPolygon: PropTypes.func,
  isDrawing: PropTypes.bool.isRequired,
  initMap: PropTypes.func,
  isEmbedded: PropTypes.bool,
  loadInitialState: PropTypes.func,
  maxZoom: PropTypes.number,
  onExternalLink: PropTypes.func,
  openSupportFormModal: PropTypes.func,
  setCenter: PropTypes.func,
  setMouseLatLong: PropTypes.func,
  setZoom: PropTypes.func,
  showMapCursorPointer: PropTypes.bool,
  showMapCursorZoom: PropTypes.bool,
  token: PropTypes.string,
  trackBounds: PropTypes.object,
  userPermissions: PropTypes.array,
  zoom: PropTypes.number,
  activeSubmenu: PropTypes.string
};

export default MapContainer;
