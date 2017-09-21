import { connect } from 'react-redux';
import PinnedVessel from 'pinnedVessels/components/PinnedVessel';

import {
  showPinnedVesselDetails,
  toggleVesselPin,
  setPinnedVesselHue,
  setPinnedVesselTitle,
  togglePinnedVesselVisibility,
  toggleActiveVesselPin
} from 'actions/vesselInfo';
import { addVesselToRecentVesselList } from 'recentVessels/recentVesselsActions';

const mapStateToProps = state => ({
  pinnedVesselEditMode: state.vesselInfo.pinnedVesselEditMode,
  currentlyShownVessel: state.vesselInfo.currentlyShownVessel
});

const mapDispatchToProps = dispatch => ({
  onVesselClicked: (seriesgroup, label, tilesetId) => {
    dispatch(addVesselToRecentVesselList(seriesgroup, label, tilesetId));
    dispatch(showPinnedVesselDetails(tilesetId, seriesgroup));
  },
  onRemoveClicked: (seriesgroup) => {
    dispatch(toggleVesselPin(seriesgroup));
  },
  setPinnedVesselHue(seriesgroup, hue) {
    dispatch(setPinnedVesselHue(seriesgroup, hue));
  },
  setPinnedVesselTitle(seriesgroup, title) {
    dispatch(setPinnedVesselTitle(seriesgroup, title));
  },
  togglePinnedVesselVisibility(seriesgroup) {
    dispatch(togglePinnedVesselVisibility(seriesgroup));
  },
  onTogglePin: (seriesgroup) => {
    dispatch(toggleActiveVesselPin(seriesgroup));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(PinnedVessel);
