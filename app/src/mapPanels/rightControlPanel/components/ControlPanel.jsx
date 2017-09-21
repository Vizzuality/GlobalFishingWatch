import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import { CONTROL_PANEL_MENUS } from 'constants';
import MediaQuery from 'react-responsive';
import AreasPanel from 'areasOfInterest/containers/AreasPanel';
import MenuLink from 'mapPanels/rightControlPanel/components/MenuLink';
import SubMenu from 'mapPanels/rightControlPanel/containers/SubMenu';
import FilterPanel from 'filters/containers/FilterPanel';
import FilterGroupPanel from 'filters/containers/FilterGroupPanel';
import LayerPanel from 'layers/containers/LayerPanel';
import LayerManagement from 'layers/containers/LayerManagement';
import SearchPanel from 'search/containers/SearchPanel';
import VesselInfoPanel from 'containers/Map/VesselInfoPanel';
import ControlPanelStyles from 'styles/components/control_panel.scss';
import iconStyles from 'styles/icons.scss';
import SearchIcon from '-!babel-loader!svg-react-loader!assets/icons/search.svg?name=SearchIcon';
import ReportsIcon from '-!babel-loader!svg-react-loader!assets/icons/report-menu.svg?name=ReportsIcon';
import LayersIcon from '-!babel-loader!svg-react-loader!assets/icons/layers-menu.svg?name=LayersIcon';
import FiltersIcon from '-!babel-loader!svg-react-loader!assets/icons/filters-menu.svg?name=FiltersIcon';
import AOIIcon from '-!babel-loader!svg-react-loader!assets/icons/aoi-menu.svg?name=AOIIcon';
import PinnedVesselList from 'pinnedVessels/containers/PinnedVesselList';
import ControlPanelHeader from '../containers/ControlPanelHeader';

class ControlPanel extends Component {
  constructor() {
    super();
    this.onCloseAreasOfInterestSubMenu = this.onCloseAreasOfInterestSubMenu.bind(this);
    this.onCloseVesselsSubMenu = this.onCloseVesselsSubMenu.bind(this);
    this.onCloseLayersSubMenu = this.onCloseLayersSubMenu.bind(this);
  }

  componentDidUpdate() {
    if (this.props.isReportStarted === true) {
      this.controlPanelRef.scrollTop = this.controlPanelRef.clientHeight;
    }
  }

  onCloseVesselsSubMenu() {
    this.props.hideSearchResults();

    if (this.props.pinnedVesselEditMode === true) {
      this.props.disableSearchEditMode();
    }
  }

  onCloseLayersSubMenu() {
    if (this.props.layerPanelEditMode === true) {
      this.props.disableLayerPanelEditMode();
    }
  }

  onCloseAreasOfInterestSubMenu() {
    if (this.props.activeSubmenu === CONTROL_PANEL_MENUS.AREAS) {
      this.props.setRecentlyCreated(false);
      this.props.setDrawingMode(false);
    }
  }

  renderIcon(iconName) {
    const iconComponents = {
      vessels: SearchIcon,
      layers: LayersIcon,
      filters: FiltersIcon,
      aoi: AOIIcon,
      reports: ReportsIcon
    };
    const IconName = iconComponents[iconName];
    return <IconName className={classnames([iconStyles[`${iconName}Icon`]])} />;
  }

  renderVesselsSubMenu() {
    const { numPinnedVessels } = this.props;
    const searchHeader = (
      <div >
        <MediaQuery maxWidth={767} >
          {numPinnedVessels > 0 &&
          <div className={ControlPanelStyles.pinnedItemCount} >
            ({numPinnedVessels})
          </div >}
        </MediaQuery >
        <MediaQuery minWidth={768} >
          {numPinnedVessels > 0 &&
          <div className={ControlPanelStyles.pinnedItemCount} >
            {numPinnedVessels} pinned
          </div >}
        </MediaQuery >
      </div >);

    return (
      <div>
        <SubMenu
          title="Vessels"
          icon={this.renderIcon('vessels')}
          extraHeader={searchHeader}
          onBack={this.onCloseVesselsSubMenu}
        >
          {this.props.userPermissions !== null && this.props.userPermissions.indexOf('search') === -1 ?
            <div >
              <a
                className="loginRequiredLink"
                onClick={this.props.login}
              >Only registered users can use the search feature. Click here to log in.</a >
              <PinnedVesselList />
            </div > :
            <div >
              <SearchPanel />
              <PinnedVesselList />
            </div >
          }
        </SubMenu >
      </div>
    );
  }

  renderFiltersSubMenu() {
    return (
      <SubMenu
        title="Filters"
        icon={this.renderIcon('filters')}
      >
        {!ENABLE_FILTER_GROUPS && <FilterPanel />}
        {ENABLE_FILTER_GROUPS && <FilterGroupPanel />}
      </SubMenu >
    );
  }

  renderLayersSubMenu() {
    return (
      <SubMenu
        title="Layers"
        icon={this.renderIcon('layers')}
        onBack={this.onCloseLayersSubMenu}
      >
        <LayerPanel />
        <LayerManagement />
      </SubMenu >
    );
  }

  renderAreaOfInterestSubMenu() {
    let areaFooter = null;
    if (this.props.isDrawing) {
      areaFooter = (<div>
        <div>
          Click over the map and create your own area of interest
        </div >
      </div>);
    }

    return (
      <SubMenu
        title="Area of interest"
        icon={this.renderIcon('aoi')}
        onBack={this.onCloseAreasOfInterestSubMenu}
        footer={areaFooter}
      >
        <AreasPanel />
      </SubMenu >
    );
  }

  renderReportsSubMenu() {
    return (
      <SubMenu title="Reports" icon={this.renderIcon('reports')}>
        <h1>Coming soon...</h1>
      </SubMenu >
    );
  }

  renderMainMenuNav(desktop) {
    return (
      <div className={classnames[ControlPanelStyles.mapOptionsContainer]} >
        <div
          className={classnames(ControlPanelStyles.mapOptions, {
            [ControlPanelStyles._noFooter]: (!COMPLETE_MAP_RENDER && !desktop)
          })}
        >
          <ControlPanelHeader />
          <MenuLink
            title="Vessels"
            icon={this.renderIcon('vessels')}
            badge={this.props.numPinnedVessels}
            onClick={() => this.props.setSubmenu(CONTROL_PANEL_MENUS.VESSELS)}
          />
          <MenuLink
            title="Layers"
            icon={this.renderIcon('layers')}
            onClick={() => this.props.setSubmenu(CONTROL_PANEL_MENUS.LAYERS)}
          />
          <MenuLink
            title="Filters"
            icon={this.renderIcon('filters')}
            badge={this.props.numFilters}
            onClick={() => this.props.setSubmenu(CONTROL_PANEL_MENUS.FILTERS)}
          />
          {ENABLE_AREA_OF_INTEREST && <MenuLink
            title="Area of interest"
            icon={this.renderIcon('aoi')}
            onClick={() => this.props.setSubmenu('AREAS')}
          />}
        </div >
      </div >
    );
  }

  renderSubMenu(desktop) {
    switch (this.props.activeSubmenu) {
      case CONTROL_PANEL_MENUS.VESSELS:
        return this.renderVesselsSubMenu();
      case CONTROL_PANEL_MENUS.LAYERS:
        return this.renderLayersSubMenu();
      case CONTROL_PANEL_MENUS.FILTERS:
        return this.renderFiltersSubMenu();
      case CONTROL_PANEL_MENUS.AREAS:
        return this.renderAreaOfInterestSubMenu();
      case CONTROL_PANEL_MENUS.REPORTS:
        return this.renderReportsSubMenu();
      default:
        return this.renderMainMenuNav(desktop);
    }
  }

  render() {
    return (
      <MediaQuery minWidth={768} >
        {desktop => (
          <div
            className={classnames([ControlPanelStyles.controlPanel, ControlPanelStyles[status]])}
            ref={(controlPanel) => {
              this.controlPanelRef = controlPanel;
            }}
          >
            <div className={classnames([ControlPanelStyles.bgWrapper])} >
              {this.renderSubMenu(desktop)}
              <VesselInfoPanel />
            </div >
          </div >
        )}
      </MediaQuery >
    );
  }
}

ControlPanel.propTypes = {
  activeSubmenu: PropTypes.string,
  disableLayerPanelEditMode: PropTypes.func,
  disableSearchEditMode: PropTypes.func,
  hideSearchResults: PropTypes.func,
  isEmbedded: PropTypes.bool,
  isReportStarted: PropTypes.bool,
  layerPanelEditMode: PropTypes.bool,
  layers: PropTypes.array,
  login: PropTypes.func,
  pinnedVesselEditMode: PropTypes.bool,
  setDrawingMode: PropTypes.func,
  setRecentlyCreated: PropTypes.func.isRequired,
  setSubmenu: PropTypes.func.isRequired,
  userPermissions: PropTypes.array,
  vessels: PropTypes.array,
  numPinnedVessels: PropTypes.number.isRequired,
  numFilters: PropTypes.number.isRequired,
  isDrawing: PropTypes.bool
};

export default ControlPanel;
