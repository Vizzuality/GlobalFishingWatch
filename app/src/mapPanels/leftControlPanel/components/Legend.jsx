import React from 'react';
import LegendStyles from 'styles/components/legend.scss';

function Legend() {
  return (
    <div className={LegendStyles.legend} >
      <ul>
        <li className={LegendStyles.legendText}>
          <span>
            Less Fishing
          </span>
          <span>
            More Fishing
          </span>
        </li>
        <li className={LegendStyles.legendOvals}>
          <span className={LegendStyles.lessFishingOval} />
          <span className={LegendStyles.line} />
          <span className={LegendStyles.moreFishingOval} />
        </li>
      </ul>
    </div >
  );
}

export default Legend;
