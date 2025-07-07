import React, { useEffect, useState } from 'react';
import './styles.css';

function Calibration({ onComplete }) {
  const [currentDot, setCurrentDot] = useState(0);

  const dotPositions = [
    { top: '10%', left: '10%' },
    { top: '10%', left: '50%' },
    { top: '10%', left: '90%' },
    { top: '50%', left: '10%' },
    { top: '50%', left: '50%' },
    { top: '50%', left: '90%' },
    { top: '90%', left: '10%' },
    { top: '90%', left: '50%' },
    { top: '90%', left: '90%' },
  ];

  const handleClick = () => {
    const webgazer = window.webgazer;
    webgazer.recordScreenPosition(dotPositions[currentDot].left, dotPositions[currentDot].top, 'click');

    if (currentDot < dotPositions.length - 1) {
      setCurrentDot(currentDot + 1);
    } else {
      onComplete(); // done
    }
  };

  return (
    <div className="calibration-container">
      <div
        className="calibration-dot"
        style={dotPositions[currentDot]}
        onClick={handleClick}
      />
    </div>
  );
}

export default Calibration;
