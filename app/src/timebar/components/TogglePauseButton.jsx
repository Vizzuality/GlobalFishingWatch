import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import iconStyles from 'styles/icons.scss';
import PlayIcon from '-!babel-loader!svg-react-loader!assets/icons/play.svg?name=PlayIcon';
import PauseIcon from '-!babel-loader!svg-react-loader!assets/icons/pause.svg?name=PauseIcon';

class TogglePauseButton extends Component {
  render() {
    return (
      <button onClick={this.props.onToggle} >
        {this.props.paused &&
        <PlayIcon className={classnames(iconStyles.icon, iconStyles.playIcon)} />
        }
        {!this.props.paused &&
        <PauseIcon className={classnames(iconStyles.icon, iconStyles.pauseIcon)} />
        }
      </button >
    );
  }
}

TogglePauseButton.propTypes = {
  onToggle: PropTypes.func,
  paused: PropTypes.bool
};

export default TogglePauseButton;
