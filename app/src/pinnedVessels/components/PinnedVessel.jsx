import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import Toggle from 'components/Shared/Toggle';
import pinnedTracksStyles from 'styles/components/map/pinned-tracks.scss';
import IconStyles from 'styles/icons.scss';
import ButtonStyles from 'styles/components/button.scss';
import ExpandItemButton from 'components/Shared/ExpandItemButton';
import InfoIcon from '-!babel-loader!svg-react-loader!assets/icons/info.svg?name=InfoIcon';
import DeleteIcon from '-!babel-loader!svg-react-loader!assets/icons/delete.svg?name=DeleteIcon';
import PaintIcon from '-!babel-loader!svg-react-loader!assets/icons/paint.svg?name=PaintIcon';
import PinIcon from '-!babel-loader!svg-react-loader!assets/icons/pin.svg?name=PinIcon';
import ExpandItem from 'components/Shared/ExpandItem';
import ColorPicker from 'components/Shared/ColorPicker';
import { COLOR_HUES } from 'config';
import { getKeyByValue } from 'util/colors';

class PinnedVessel extends Component {
  constructor() {
    super();
    this.state = { expand: null };
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeHue = this.onChangeHue.bind(this);
    this.onChangeVisibility = this.onChangeVisibility.bind(this);
  }

  onChangeName(value) {
    this.props.setPinnedVesselTitle(this.props.vessel.seriesgroup, value);
  }

  onVesselLabelClick() {
    if (this.props.pinnedVesselEditMode === false) {
      this.props.onVesselClicked(this.props.vessel.seriesgroup, this.props.vessel.title, this.props.vessel.tilesetId);
    }
  }

  onChangeHue(color) {
    if (!this.props.vessel.visible) {
      this.props.togglePinnedVesselVisibility(this.props.vessel.seriesgroup);
    }
    this.props.setPinnedVesselHue(this.props.vessel.seriesgroup, COLOR_HUES[color]);
  }

  onChangeVisibility() {
    this.props.togglePinnedVesselVisibility(this.props.vessel.seriesgroup);
  }

  changeExpand(value) {
    if (value === this.state.expand) value = null;
    this.setState({ expand: value });
  }

  togglePin() {
    this.props.onTogglePin(this.props.vessel.seriesgroup);
    this.setState({ pinned: !this.state.pinned });
  }

  render() {
    let actions;
    if (this.props.vessel.title === undefined) return false;

    if (this.props.pinnedVesselEditMode === true) {
      actions = (
        <div className={pinnedTracksStyles.editionMenu} >
          <DeleteIcon
            className={classnames(IconStyles.icon, pinnedTracksStyles.deleteIcon)}
            onClick={() => {
              this.props.onRemoveClicked(this.props.vessel.seriesgroup);
            }}
          />
        </div>
      );
    } else {
      actions = (
        <ul className={pinnedTracksStyles.pinnedItemActionList} >
          <li
            className={pinnedTracksStyles.pinnedItemActionItem}
            onClick={() => this.togglePin()}
          >
            <button className={classnames(ButtonStyles.pinVesselIcon, { [ButtonStyles.pinned]: this.props.vessel.pinned })}>
              <PinIcon
                className={IconStyles.pinIcon}
              />
            </button>
          </li>
          <li
            className={pinnedTracksStyles.pinnedItemActionItem}
            onClick={() => this.changeExpand('COLOR')}
          >
            <ExpandItemButton active={this.state.expand === 'COLOR'} >
              <PaintIcon
                className={IconStyles.paintIcon}
              />
            </ExpandItemButton >
          </li>
          <li
            className={pinnedTracksStyles.pinnedItemActionItem}
            onClick={e => this.onVesselLabelClick(e)}
          >
            <button className={classnames(ButtonStyles.pinVesselIcon, { [ButtonStyles.pinned]: this.props.isInfoOpened })}>
              <InfoIcon className={IconStyles.infoIcon} />
            </button>
          </li>
        </ul>
      );
    }

    const color = getKeyByValue(COLOR_HUES, this.props.vessel.hue);
    return (
      <li
        className={pinnedTracksStyles.pinnedItem}
        key={this.props.vessel.seriesgroup}
      >
        <div className={pinnedTracksStyles.itemHeader}>
          <Toggle
            on={this.props.vessel.visible}
            hue={this.props.vessel.hue}
            onToggled={() => this.onChangeVisibility()}
          />
          <input
            className={classnames(pinnedTracksStyles.itemName, { [pinnedTracksStyles.itemRename]: this.props.pinnedVesselEditMode })}
            onChange={e => this.onChangeName(e.currentTarget.value)}
            readOnly={!this.props.pinnedVesselEditMode}
            value={this.props.vessel.title}
            ref={((elem) => {
              this.inputName = elem;
            })}
            onClick={e => this.onVesselLabelClick(e)}
          />
          {actions}
        </div>
        <ExpandItem active={this.state.expand === 'COLOR'} arrowPosition={0}>
          <ColorPicker
            color={color}
            onColorChange={this.onChangeHue}
            id={this.props.vessel.title}
          />
        </ExpandItem >
      </li>
    );
  }
}

PinnedVessel.propTypes = {
  pinnedVesselEditMode: PropTypes.bool,
  index: PropTypes.number,
  togglePinnedVesselVisibility: PropTypes.func,
  onPinnedVesselOptionsToggled: PropTypes.func,
  onRemoveClicked: PropTypes.func,
  setPinnedVesselTitle: PropTypes.func,
  onVesselClicked: PropTypes.func,
  setPinnedVesselHue: PropTypes.func,
  onTogglePin: PropTypes.func.isRequired,
  showBlending: PropTypes.bool,
  vessel: PropTypes.object,
  isInfoOpened: PropTypes.bool.isRequired
};

export default PinnedVessel;
