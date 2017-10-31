import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import 'styles/components/shared/checkbox.scss';

function Checkbox({ id, callback, label, labelClassNames, defaultChecked, checked, classNames, disabled, children }) {
  return (
    <div className={classnames(['c-checkbox', classNames])}>
      <div className="checkbox">
        <input type="checkbox" id={id} onChange={callback} defaultChecked={defaultChecked} checked={checked === true} disabled={disabled} />
        <label htmlFor={id} />
      </div>
      <div className={classnames(['label', { checkedLabel: checked }, labelClassNames])}>
        {label}
        {children}
      </div>
    </div>
  );
}

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  callback: PropTypes.func.isRequired,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  label: PropTypes.string,
  labelClassNames: PropTypes.string,
  classNames: PropTypes.string,
  children: React.PropTypes.node
};

export default Checkbox;
