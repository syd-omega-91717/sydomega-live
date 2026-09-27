import React, { useState } from 'react';
import '../design-tokens.css';
import './ZodiacCard.css';

const ZodiacCard = ({ zodiac, isActive, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onSelect(zodiac.id);
  };

  return (
    <div
      className={`zodiac-card ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="zodiac-visual">
        <div className="zodiac-icon">{zodiac.icon}</div>
        <div className="zodiac-glow"></div>
      </div>
      
      <div className="zodiac-content">
        <h3 className="zodiac-name">{zodiac.name}</h3>
        <p className="zodiac-power">{zodiac.power}</p>
        <div className="zodiac-stats">
          <div className="stat">
            <span className="stat-label">Power</span>
            <div className="stat-bar">
              <div 
                className="stat-fill" 
                style={{ width: `${zodiac.powerLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="activation-indicator">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
      )}
    </div>
  );
};

export default ZodiacCard;
