import { connect } from 'react-redux';
import RecentVesselItem from 'recentVessels/components/RecentVesselItem';
import { addVessel, clearVesselInfo } from 'actions/vesselInfo';
import { toggleLayerVisibility } from 'layers/layersActions';
import { setRecentVesselsModalVisibility } from 'recentVessels/recentVesselsActions';
import { trackRecentVesselAdded } from 'analytics/analyticsActions';

const mapDispatchToProps = dispatch => ({
  drawVessel: (vesselDetails) => {
    dispatch(trackRecentVesselAdded());
    dispatch(toggleLayerVisibility(vesselDetails.tilesetId, true));
    dispatch(clearVesselInfo());
    dispatch(addVessel(vesselDetails.tilesetId, vesselDetails.seriesgroup, null, true, true));
  },
  closeRecentVesselModal: () => {
    dispatch(setRecentVesselsModalVisibility(false));
  }
});

export default connect(null, mapDispatchToProps)(RecentVesselItem);
