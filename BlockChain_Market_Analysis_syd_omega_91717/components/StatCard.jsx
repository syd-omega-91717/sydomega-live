import React, { useState, useEffect, useRef } from 'react';
import '../design-tokens.css';
import './StatCard.css';

const StatCard = ({ icon, value, label, color = 'gold', prefix = '', suffix = '', animate = true }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && animate) {
      const targetValue = typeof value === 'number' ? value : parseInt(value.replace(/[^\d]/g, ''));
      const duration = 2000;
      const steps = 60;
      const increment = targetValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          current = targetValue;
          clearInterval(timer);
        }
        setDisplayValue(Math.floor(current));
      }, duration / steps);

      return () => clearInterval(timer);
    } else if (!animate) {
      setDisplayValue(typeof value === 'number' ? value : parseInt(value.replace(/[^\d]/g, '')));
    }
  }, [isVisible, value, animate]);

  const getColorClass = () => {
    const colorMap = {
      gold: 'stat-icon-gold',
      blue: 'stat-icon-blue',
      copper: 'stat-icon-copper',
      fire: 'stat-icon-fire',
      crystal: 'stat-icon-crystal'
    };
    return colorMap[color] || 'stat-icon-gold';
  };

  const formatDisplayValue = () => {
    if (typeof value === 'string' && !isNaN(value)) {
      return `${prefix}${displayValue.toLocaleString()}${suffix}`;
    }
    return typeof value === 'number' 
      ? `${prefix}${displayValue.toLocaleString()}${suffix}`
      : value;
  };

  return (
    <div 
      ref={cardRef}
      className={`stat-card ${isVisible ? 'visible' : ''}`}
    >
      <div className={`stat-icon ${getColorClass()}`}>
        <span className="icon-emoji">{icon}</span>
        <div className="icon-glow"></div>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{formatDisplayValue()}</h3>
        <p className="stat-label">{label}</p>
      </div>
      <div className="stat-decoration">
        <div className="decoration-line"></div>
        <div className="decoration-dot"></div>
      </div>
    </div>
  );
};

export default StatCard;
