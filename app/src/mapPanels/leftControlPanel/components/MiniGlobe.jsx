import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MiniGlobeStyles from 'styles/components/miniGlobe.scss';
import { geoOrthographic, geoPath } from 'd3-geo'; // eslint-disable-line
import { feature } from 'topojson-client';
import classnames from 'classnames';
import { MINI_GLOBE_SETTINGS } from 'config';

const jsonData = require('assets/topoJson/ne_110m_land.json');

class MiniGlobe extends Component {

  constructor() {
    super();
    this.state = {
      projection: null,
      markerWidth: `${MINI_GLOBE_SETTINGS.defaultSize}px`,
      markerHeight: `${MINI_GLOBE_SETTINGS.defaultSize}px`
    };

    this.worldData = feature(jsonData, jsonData.objects.land).features;
  }

  componentDidMount() {
    this.setProjection();
    this.setMarkerSize(this.props.zoom, this.props.viewportWidth, this.props.viewportHeight);
  }

  componentDidUpdate(nextProps) {
    if (this.props.center !== nextProps.center) {
      this.recenter();
    }

    if (this.props.zoom !== nextProps.zoom ||
        this.props.viewportWidth !== nextProps.viewportWidth ||
        this.props.viewportHeight !== nextProps.viewportHeight
    ) {
      this.changeZoom();
    }
  }

  setMarkerSize(zoom, viewportWidth, viewportHeight) {
    if (zoom && viewportWidth && viewportHeight) {
      const zoomRelation = MINI_GLOBE_SETTINGS.zoomRatio ** zoom;
      const markerWidth = `${(viewportWidth * MINI_GLOBE_SETTINGS.viewportRatio) / zoomRelation}px`;
      const markerHeight = `${(viewportHeight * MINI_GLOBE_SETTINGS.viewportRatio) / zoomRelation}px`;

      this.setState({ markerWidth, markerHeight });
    }
  }

  setProjection() {
    const center = this.props.center;
    const projection = geoOrthographic()
      .scale(MINI_GLOBE_SETTINGS.scale)
      .clipAngle(90)
      .translate([MINI_GLOBE_SETTINGS.svgWidth / 2, MINI_GLOBE_SETTINGS.svgWidth / 2]);
    projection.rotate([-center.lng, -center.lat]);
    this.setState({ projection });
  }

  recenter() {
    if (this.state.projection) {
      const center = this.props.center;
      const updatedProjection = this.state.projection;
      this.state.projection.rotate([-center.lng, -center.lat]);
      this.setState({ projection: updatedProjection });
    }
  }

  changeZoom() {
    const { zoom, viewportWidth, viewportHeight } = this.props;
    if (zoom && viewportWidth && viewportHeight) {
      this.setMarkerSize(zoom, viewportWidth, viewportHeight);
    }
  }

  render() {
    const { zoom } = this.props;
    const { markerHeight, markerWidth } = this.state;
    const { isEmbedded } = this.props;
    const { svgWidth, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = MINI_GLOBE_SETTINGS;
    return (
      <div
        id="miniGlobe"
        className={classnames(
          MiniGlobeStyles.miniGlobe,
          { [MiniGlobeStyles._isEmbedded]: isEmbedded })}
      >
        <div className={MiniGlobeStyles.svgContainer} >
          { zoom > MINI_GLOBE_SETTINGS.minZoom &&
            <div className={MiniGlobeStyles.zoneMarker} style={{ width: markerWidth, height: markerHeight }} />
          }
          <svg
            width={svgWidth}
            height={svgWidth}
            viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
            className={MiniGlobeStyles.globeSvg}
          >
            <g className="geometries">
              {
                this.worldData.map((d, i) => (
                  <path
                    key={`path-${i}`}
                    d={geoPath().projection(this.state.projection)(d)}
                    className="land"
                  />
                ))
              }
            </g>
          </svg>
        </div>
        {/* <div className={MiniGlobeStyles.zone}>
          <span>
            Zone
          </span>
        </div> */}
      </div>
    );
  }
}

MiniGlobe.propTypes = {
  center: PropTypes.object.isRequired,
  viewportWidth: PropTypes.number,
  viewportHeight: PropTypes.number,
  isEmbedded: PropTypes.bool.isRequired,
  zoom: PropTypes.number.isRequired
};

export default MiniGlobe;
