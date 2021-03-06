import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import logo from 'assets/logos/gfw_logo.svg';
import menuicon from 'assets/icons/menu.svg';
import MenuMobile from 'siteNav/containers/MenuMobile';
import BaseStyles from 'styles/_base.scss';
import HeaderStyles from 'styles/components/shared/header.scss';
import iconStyles from 'styles/icons.scss';
import ShareIcon from '-!babel-loader!svg-react-loader!assets/icons/share.svg?name=ShareIcon';

class Header extends Component {

  constructor(props) {
    super(props);
    this.login = this.props.login.bind(this);
    this.logout = this.props.logout.bind(this);
    this.state = {
      mobileMenuVisible: false
    };
    this.closeMobileMenu = this.closeMobileMenu.bind(this);
  }

  closeMobileMenu() {
    this.setState({ mobileMenuVisible: false });
  }

  render() {
    const isEmbedded = this.props.isEmbedded;
    const logoUrl = isEmbedded ? `${MAP_URL}?workspace=${this.props.urlWorkspaceId}` : SITE_URL;

    const target = isEmbedded ? '_blank' : '';

    return (
      <div>
        <div className={HeaderStyles.preview} />
        {(!this.props.isEmbedded && COMPLETE_MAP_RENDER) &&
        <MenuMobile
          visible={this.state.mobileMenuVisible}
          onClose={this.closeMobileMenu}
          onOpenSupportModal={this.props.setSupportModalVisibility}
        />
        }
        <nav
          className={
            classnames('c-header', { [HeaderStyles.header]: true, [HeaderStyles._map]: true })
          }
        >
          <div
            className={
              classnames({ [BaseStyles.wrap]: true, [BaseStyles._map]: true })
            }
          >
            <div className={HeaderStyles.containNav} >
              {(!isEmbedded && COMPLETE_MAP_RENDER) &&
              <img
                onClick={() => this.setState({ mobileMenuVisible: true })}
                className={HeaderStyles.iconMenuMobile}
                src={menuicon}
                alt="Menu toggle icon"
              />
              }
              {COMPLETE_MAP_RENDER &&
              <a
                target={target}
                href={logoUrl}
                className={classnames(HeaderStyles.appLogo, { [HeaderStyles._isEmbedded]: isEmbedded })}
              >
                <img
                  src={logo}
                  alt="Global Fishing Watch"
                />
              </a>
              }
              {this.props.canShareWorkspaces &&
                <ShareIcon
                  className={classnames(iconStyles.icon, iconStyles.iconShare, HeaderStyles.iconShare)}
                  onClick={this.props.openShareModal}
                />
              }
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

Header.propTypes = {
  logout: PropTypes.func,
  login: PropTypes.func,
  loggedUser: PropTypes.object,
  openShareModal: PropTypes.func,
  setSupportModalVisibility: PropTypes.func,
  setVisibleMenu: PropTypes.func,
  isEmbedded: PropTypes.bool,
  urlWorkspaceId: PropTypes.string,
  canShareWorkspaces: PropTypes.bool
};

export default Header;
