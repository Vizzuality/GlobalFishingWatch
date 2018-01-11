import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import infoPanelStyles from 'styles/components/info-panel.scss';
import iconStyles from 'styles/icons.scss';
import ArrowLinkIcon from '-!babel-loader!svg-react-loader!assets/icons/arrow-link.svg?name=ArrowLinkIcon';


function EncountersVessel({ vessel }) {
  if (vessel.info === undefined) {
    return <div className={infoPanelStyles.encountersData}>loading...</div>;
  }
  return (
    <div className={infoPanelStyles.encountersData} >
      <div className={infoPanelStyles.rowInfo} >
        <span className={infoPanelStyles.key} >MMSI</span>
        <span className={infoPanelStyles.value} >{vessel.MMSI}</span>
      </div>
      <div className={infoPanelStyles.rowInfo} >
        <span className={infoPanelStyles.key} >Vessel</span>
        <a onClick={() => this.props.openVessel(vessel)} className={classnames(infoPanelStyles.value, infoPanelStyles.arrowLink)} >
          { vessel.title }
          <span className={infoPanelStyles.arrowSvg}>{<ArrowLinkIcon className={iconStyles.iconArrowLink} />}</span>
        </a>
      </div>
    </div>
  );
}

EncountersVessel.propTypes = {
  vessel: PropTypes.object
};

export default EncountersVessel;
