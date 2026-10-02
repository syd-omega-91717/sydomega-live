import React, { useState } from 'react';
import '../design-tokens.css';
import './ZodiacGallery.css';

const ZodiacGallery = () => {
  const [selectedZodiac, setSelectedZodiac] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Complete zodiac data from both folders
  const zodiacSigns = [
    {
      id: 'aries',
      name: 'Aries',
      symbol: '♈',
      element: 'Fire',
      dates: 'Mar 21 - Apr 19',
      colors: ['#FF6B35', '#FF4500'],
      power: 'Leadership Power',
      ruler: 'Mars',
      traits: ['Courageous', 'Determined', 'Confident', 'Enthusiastic', 'Optimistic', 'Passionate'],
      files: [
        'horoscope_sign_Aries.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (8).jpeg'
      ]
    },
    {
      id: 'taurus',
      name: 'Taurus',
      symbol: '♉',
      element: 'Earth',
      dates: 'Apr 20 - May 20',
      colors: ['#8B4513', '#DEB887'],
      power: 'Stability Boost',
      ruler: 'Venus',
      traits: ['Reliable', 'Patient', 'Practical', 'Devoted', 'Responsible', 'Stable'],
      files: [
        'horoscope_sign_Tauros.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (9).jpeg'
      ]
    },
    {
      id: 'gemini',
      name: 'Gemini',
      symbol: '♊',
      element: 'Air',
      dates: 'May 21 - Jun 20',
      colors: ['#FFD700', '#FFA500'],
      power: 'Dual Advantage',
      ruler: 'Mercury',
      traits: ['Gentle', 'Affectionate', 'Curious', 'Adaptable', 'Quick learner', 'Outgoing'],
      files: [
        'horoscope_sign_Gemenis.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (10).jpeg'
      ]
    },
    {
      id: 'cancer',
      name: 'Cancer',
      symbol: '♋',
      element: 'Water',
      dates: 'Jun 21 - Jul 22',
      colors: ['#4682B4', '#87CEEB'],
      power: 'Protection Shield',
      ruler: 'Moon',
      traits: ['Tenacious', 'Loyal', 'Sympathetic', 'Persuasive', 'Emotional', 'Intuitive'],
      files: [
        'horoscope_sign_Cancer.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (11).jpeg'
      ]
    },
    {
      id: 'leo',
      name: 'Leo',
      symbol: '♌',
      element: 'Fire',
      dates: 'Jul 23 - Aug 22',
      colors: ['#FFD700', '#FFA500'],
      power: 'Royal Authority',
      ruler: 'Sun',
      traits: ['Creative', 'Passionate', 'Generous', 'Warm-hearted', 'Cheerful', 'Humorous'],
      files: [
        'horoscope_sign_Lion.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (12).jpeg'
      ]
    },
    {
      id: 'virgo',
      name: 'Virgo',
      symbol: '♍',
      element: 'Earth',
      dates: 'Aug 23 - Sep 22',
      colors: ['#8B4513', '#F0E68C'],
      power: 'Precision Strike',
      ruler: 'Mercury',
      traits: ['Loyal', 'Analytical', 'Kind', 'Hardworking', 'Practical', 'Shy'],
      files: [
        'horoscope_sign_Virgo.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (13).jpeg'
      ]
    },
    {
      id: 'libra',
      name: 'Libra',
      symbol: '♎',
      element: 'Air',
      dates: 'Sep 23 - Oct 22',
      colors: ['#FFD700', '#FF69B4'],
      power: 'Balance Harmony',
      ruler: 'Venus',
      traits: ['Cooperative', 'Diplomatic', 'Fair-minded', 'Social', 'Gracious', 'Peaceful'],
      files: [
        'horoscope_sign_Libra.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (14).jpeg'
      ]
    },
    {
      id: 'scorpio',
      name: 'Scorpio',
      symbol: '♏',
      element: 'Water',
      dates: 'Oct 23 - Nov 21',
      colors: ['#8B0000', '#DC143C'],
      power: 'Transformation Power',
      ruler: 'Pluto',
      traits: ['Resourceful', 'Brave', 'Passionate', 'Stubborn', 'True friend', 'Intuitive'],
      files: [
        'horoscope_sign_scorpion.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (15).jpeg'
      ]
    },
    {
      id: 'sagittarius',
      name: 'Sagittarius',
      symbol: '♐',
      element: 'Fire',
      dates: 'Nov 22 - Dec 21',
      colors: ['#9370DB', '#4B0082'],
      power: 'Wisdom Vision',
      ruler: 'Jupiter',
      traits: ['Generous', 'Idealistic', 'Great sense of humor', 'Adventurous', 'Open-minded', 'Curious'],
      files: [
        'horoscope_sign_Sagittarius.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.53 PM (16).jpeg'
      ]
    },
    {
      id: 'capricorn',
      name: 'Capricorn',
      symbol: '♑',
      element: 'Earth',
      dates: 'Dec 22 - Jan 19',
      colors: ['#696969', '#2F4F4F'],
      power: 'Ambition Drive',
      ruler: 'Saturn',
      traits: ['Responsible', 'Disciplined', 'Self-control', 'Good managers', 'Ambitious', 'Persistent'],
      files: [
        'horoscope_sign_Capricorn.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.54 PM (1).jpeg'
      ]
    },
    {
      id: 'aquarius',
      name: 'Aquarius',
      symbol: '♒',
      element: 'Air',
      dates: 'Jan 20 - Feb 18',
      colors: ['#00CED1', '#4682B4'],
      power: 'Innovation Wave',
      ruler: 'Uranus',
      traits: ['Progressive', 'Original', 'Independent', 'Humanitarian', 'Intellectual', 'Inventive'],
      files: [
        'horoscope_sign_Aquarius.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.54 PM (2).jpeg'
      ]
    },
    {
      id: 'pisces',
      name: 'Pisces',
      symbol: '♓',
      element: 'Water',
      dates: 'Feb 19 - Mar 20',
      colors: ['#4682B4', '#87CEEB'],
      power: 'Intuitive Flow',
      ruler: 'Neptune',
      traits: ['Compassionate', 'Artistic', 'Intuitive', 'Gentle', 'Wise', 'Musical'],
      files: [
        'horoscope_sign_Pisces.png.jpeg',
        'WhatsApp Image 2026-01-04 at 4.50.54 PM.jpeg'
      ]
    }
  ];

  const elements = ['all', 'Fire', 'Earth', 'Air', 'Water'];

  const filteredZodiacs = activeFilter === 'all' 
    ? zodiacSigns 
    : zodiacSigns.filter(zodiac => zodiac.element === activeFilter);

  const ZodiacCard = ({ zodiac }) => (
    <div 
      className="zodiac-card"
      onClick={() => setSelectedZodiac(zodiac)}
    >
      <div className="zodiac-header">
        <div className="zodiac-symbol">{zodiac.symbol}</div>
        <div className="zodiac-element">
          <span className="element-icon">{zodiac.element}</span>
        </div>
      </div>
      
      <div className="zodiac-content">
        <h3 className="zodiac-name">{zodiac.name}</h3>
        <p className="zodiac-dates">{zodiac.dates}</p>
        <div className="zodiac-power">
          <span className="power-label">Power:</span>
          <span className="power-value">{zodiac.power}</span>
        </div>
        
        <div className="zodiac-colors">
          {zodiac.colors.map((color, index) => (
            <span 
              key={index} 
              className="zodiac-color" 
              style={{ backgroundColor: color }}
              title={color}
            ></span>
          ))}
        </div>
      </div>
      
      <div className="zodiac-footer">
        <span className="zodiac-ruler">Ruler: {zodiac.ruler}</span>
        <div className="zodiac-actions">
          <button className="action-btn">👁️</button>
          <button className="action-btn">⬇️</button>
        </div>
      </div>
    </div>
  );

  const ZodiacModal = ({ zodiac, onClose }) => {
    if (!zodiac) return null;

    return (
      <div className="zodiac-modal-overlay" onClick={onClose}>
        <div className="zodiac-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-zodiac-info">
              <span className="modal-symbol">{zodiac.symbol}</span>
              <div>
                <h2>{zodiac.name}</h2>
                <p>{zodiac.dates}</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="modal-content">
            <div className="zodiac-details">
              <div className="detail-section">
                <h3>Element & Power</h3>
                <div className="element-display">
                  <span className="element-badge" style={{ 
                    background: `linear-gradient(135deg, ${zodiac.colors[0]}, ${zodiac.colors[1]})` 
                  }}>
                    {zodiac.element}
                  </span>
                  <span className="power-display">{zodiac.power}</span>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Personality Traits</h3>
                <div className="traits-grid">
                  {zodiac.traits.map((trait, index) => (
                    <span key={index} className="trait-badge">{trait}</span>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Cosmic Information</h3>
                <div className="cosmic-info">
                  <div className="info-item">
                    <span className="info-label">Ruling Planet:</span>
                    <span className="info-value">{zodiac.ruler}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Element:</span>
                    <span className="info-value">{zodiac.element}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Symbol:</span>
                    <span className="info-value">{zodiac.symbol}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Available Designs</h3>
                <div className="design-previews">
                  {zodiac.files.map((file, index) => (
                    <div key={index} className="design-preview">
                      <div className="preview-placeholder">
                        <span>🎨</span>
                      </div>
                      <span className="file-name">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-primary">Download All Designs</button>
            <button className="btn btn-secondary">Activate Power</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="zodiac-gallery">
      <header className="gallery-header">
        <h1 className="gallery-title">Zodiac Powers Gallery</h1>
        <p className="gallery-subtitle">Complete collection of zodiac signs with cosmic powers and abilities</p>
      </header>

      <div className="gallery-controls">
        <div className="element-filters">
          {elements.map(element => (
            <button
              key={element}
              className={`element-btn ${activeFilter === element ? 'active' : ''}`}
              onClick={() => setActiveFilter(element)}
            >
              {element === 'all' ? '🌟 All' : getElementIcon(element) + ' ' + element}
            </button>
          ))}
        </div>
      </div>

      <div className="zodiac-grid">
        {filteredZodiacs.map(zodiac => (
          <ZodiacCard key={zodiac.id} zodiac={zodiac} />
        ))}
      </div>

      {selectedZodiac && (
        <ZodiacModal 
          zodiac={selectedZodiac} 
          onClose={() => setSelectedZodiac(null)} 
        />
      )}
    </div>
  );

  function getElementIcon(element) {
    const icons = {
      'Fire': '*',
      'Earth': '*',
      'Air': '*',
      'Water': '*'
    };
    return icons[element] || '*';
  }
};

export default ZodiacGallery;
