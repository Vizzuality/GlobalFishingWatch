import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AreasItem from 'areasOfInterest/containers/AreasItem';
import areasPanelStyles from 'styles/components/map/areas-panel.scss';

class AreasList extends Component {

  render() {
    return (
      <div className={areasPanelStyles.areasList} >
        {this.props.areas.map((area, index) => (
          <AreasItem
            area={area}
            key={index}
            index={index}
          />
        ))}
      </div >
    );
  }
}

AreasList.propTypes = {
  areas: PropTypes.array.isRequired
};

export default AreasList;
