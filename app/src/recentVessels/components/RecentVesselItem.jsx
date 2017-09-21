import PropTypes from 'prop-types';
/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import ResultListStyles from 'styles/search/result-list.scss';
import IconStyles from 'styles/icons.scss';
import PinIcon from '-!babel-loader!svg-react-loader!assets/icons/pin.svg?name=PinIcon';
import classnames from 'classnames';
import RecentVesselStyles from 'styles/recentVessels/recent-vessels.scss';
import moment from 'moment';

class RecentVesselItem extends Component {

  onClick() {
    this.props.drawVessel(this.props.vesselInfo);
    this.props.closeRecentVesselModal();
  }

  highlightWord(strReplace, str) {
    if (strReplace === undefined || strReplace.length < 1) {
      return str;
    }
    const regX = new RegExp(strReplace, 'i');
    const highlight = `<span class="${ResultListStyles.highlight}">${strReplace.toUpperCase()}</span>`;

    return str.replace(regX, highlight);
  }

  render() {
    const title = this.props.vesselInfo.label || `${this.props.vesselInfo.vesselname}, ${this.props.vesselInfo.mmsi}`;

    let timestamp = 'no date';
    if (this.props.vesselInfo.timestamp !== undefined) {
      timestamp = moment(this.props.vesselInfo.timestamp).format('DD/MM/YYYY HH:MM');
    }
    const highlightName = this.highlightWord(this.props.searchTerm, title);

    return (
      <li
        className={classnames(ResultListStyles.resultItem, ResultListStyles.modalResult)}
        onClick={(event) => {
          this.onClick(event);
        }}
      >
        {this.props.pinned &&
        <PinIcon
          className={classnames(IconStyles.icon, IconStyles.pinIcon, RecentVesselStyles.pinned)}
        />}
        <span
          dangerouslySetInnerHTML={{ __html: highlightName }}
          className={ResultListStyles.mainResultLabel}
        />
        {timestamp &&
        <span className={ResultListStyles.subResultLabel} >
          {timestamp}
        </span >}
      </li >
    );
  }
}

RecentVesselItem.propTypes = {
  closeRecentVesselModal: PropTypes.func.isRequired,
  pinned: PropTypes.bool,
  drawVessel: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  vesselInfo: PropTypes.object
};

export default RecentVesselItem;
