import React, { useState } from 'react';
import '../design-tokens.css';
import './MedalGallery.css';

const MedalGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMedal, setSelectedMedal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Complete medal data from Medals folder
  const medals = [
    {
      id: 'auth12',
      name: 'Authority Medal Level 12',
      file: 'Authority_S.Y.D_Omega_91717_Medal-12.png',
      category: 'authority',
      level: 12,
      colors: ['#4B0082', '#FFD700'],
      rarity: 'legendary',
      description: 'Ultimate authority recognition',
      power: 'Supreme Command'
    },
    {
      id: 'auth20',
      name: 'Authority Medal Level 20',
      file: 'Authority_S.Y.D_Omega_91717_Medal-20.png',
      category: 'authority',
      level: 20,
      colors: ['#FFD700', '#FF4500'],
      rarity: 'mythic',
      description: 'Peak authority achievement',
      power: 'Absolute Control'
    },
    {
      id: 'awakening',
      name: 'Awakening Medal',
      file: 'Awakening_S.Y.D_Omega_91717_Medal-1.png',
      category: 'awakening',
      level: 1,
      colors: ['#FF69B4', '#FFD700'],
      rarity: 'rare',
      description: 'Initial awakening recognition',
      power: 'Consciousness Expansion'
    },
    {
      id: 'cognition',
      name: 'Cognition Medal',
      file: 'Cognition_S.Y.D_Omega_91717_Medal-3.png',
      category: 'cognition',
      level: 3,
      colors: ['#4B0082', '#00CED1'],
      rarity: 'epic',
      description: 'Advanced cognitive achievement',
      power: 'Mental Clarity'
    },
    {
      id: 'command',
      name: 'Command Medal',
      file: 'Command_S.Y.D_Omega_91717_Medal-4.png',
      category: 'command',
      level: 4,
      colors: ['#FFD700', '#8B0000'],
      rarity: 'epic',
      description: 'Leadership command recognition',
      power: 'Strategic Leadership'
    },
    {
      id: 'expansion',
      name: 'Expansion Medal',
      file: 'Expension_S.Y.D_Omega_91717_Medal-5.png',
      category: 'expansion',
      level: 5,
      colors: ['#00CED1', '#FFD700'],
      rarity: 'rare',
      description: 'Growth and expansion achievement',
      power: 'Infinite Growth'
    },
    {
      id: 'integration',
      name: 'Integration Medal',
      file: 'Integration_S.Y.D_Omega_91717_Medal-6.png',
      category: 'integration',
      level: 6,
      colors: ['#FF69B4', '#4B0082'],
      rarity: 'legendary',
      description: 'System integration mastery',
      power: 'Universal Connection'
    },
    {
      id: 'vision',
      name: 'Vision Medal',
      file: 'Vision_S.Y.D_Omega_91717_Medal-6.png',
      category: 'vision',
      level: 6,
      colors: ['#4B0082', '#FFD700'],
      rarity: 'epic',
      description: 'Enhanced vision achievement',
      power: 'Clairvoyance'
    },
    {
      id: 'sync',
      name: 'Synchronization Medal',
      file: 'Syncorication_S.Y.D_Omega_91717_Medal-2.png',
      category: 'synchronization',
      level: 2,
      colors: ['#00CED1', '#4B0082'],
      rarity: 'rare',
      description: 'Perfect synchronization achievement',
      power: 'Temporal Harmony'
    },
    {
      id: 'master9',
      name: 'Master Medal',
      file: 'Master_S.Y.D_Omega_91717_Medal-9.jpeg',
      category: 'mastery',
      level: 9,
      colors: ['#FFD700', '#4B0082'],
      rarity: 'legendary',
      description: 'Ultimate mastery recognition',
      power: 'Omniscience'
    },
    {
      id: 'ownership',
      name: '100% Ownership Medal',
      file: '100%_Ownership_S.Y.D_Omega_91717_Legacy_Authorization.jpeg',
      category: 'ownership',
      level: 'ultimate',
      colors: ['#FFD700', '#4B0082'],
      rarity: 'mythic',
      description: 'Complete ownership authorization',
      power: 'Sovereign Control'
    },
    {
      id: 'sovereign',
      name: 'Sovereign Achiever Medal',
      file: 'Soverigin_Acheiver_S.Y.D_Omega_91717_Medal_of_Honor.jpeg',
      category: 'sovereign',
      level: 'elite',
      colors: ['#FFD700', '#4B0082'],
      rarity: 'legendary',
      description: 'Highest sovereign achievement',
      power: 'Royal Authority'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Medals', icon: '🏆' },
    { id: 'authority', name: 'Authority', icon: '👑' },
    { id: 'awakening', name: 'Awakening', icon: '✨' },
    { id: 'cognition', name: 'Cognition', icon: '🧠' },
    { id: 'command', name: 'Command', icon: '⚔️' },
    { id: 'expansion', name: 'Expansion', icon: '🌟' },
    { id: 'integration', name: 'Integration', icon: '🔗' },
    { id: 'vision', name: 'Vision', icon: '👁️' },
    { id: 'synchronization', name: 'Synchronization', icon: '⚡' },
    { id: 'mastery', name: 'Mastery', icon: '🎯' },
    { id: 'ownership', name: 'Ownership', icon: '🔑' },
    { id: 'sovereign', name: 'Sovereign', icon: '👑' }
  ];

  const filteredMedals = medals.filter(medal => {
    const matchesCategory = selectedCategory === 'all' || medal.category === selectedCategory;
    const matchesSearch = medal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medal.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#808080',
      rare: '#4169E1',
      epic: '#9370DB',
      legendary: '#FFD700',
      mythic: '#FF4500'
    };
    return colors[rarity] || '#808080';
  };

  const MedalCard = ({ medal }) => (
    <div 
      className="medal-card"
      onClick={() => setSelectedMedal(medal)}
    >
      <div className="medal-preview">
        <div className="medal-image-placeholder">
          <div className="medal-icon">🏆</div>
          <div className="medal-rarity" style={{ backgroundColor: getRarityColor(medal.rarity) }}>
            {medal.rarity.toUpperCase()}
          </div>
        </div>
        <div className="medal-overlay">
          <span className="view-btn">👁️</span>
        </div>
      </div>
      <div className="medal-info">
        <h4 className="medal-name">{medal.name}</h4>
        <p className="medal-description">{medal.description}</p>
        <div className="medal-meta">
          <div className="medal-level">
            <span className="level-label">Level:</span>
            <span className="level-value">{medal.level}</span>
          </div>
          <div className="medal-power">
            <span className="power-label">Power:</span>
            <span className="power-value">{medal.power}</span>
          </div>
        </div>
        <div className="medal-colors">
          {medal.colors.map((color, index) => (
            <span 
              key={index} 
              className="medal-color" 
              style={{ backgroundColor: color }}
              title={color}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );

  const MedalModal = ({ medal, onClose }) => {
    if (!medal) return null;

    return (
      <div className="medal-modal-overlay" onClick={onClose}>
        <div className="medal-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-medal-info">
              <div className="modal-medal-icon">🏆</div>
              <div>
                <h3>{medal.name}</h3>
                <div className="modal-rarity" style={{ backgroundColor: getRarityColor(medal.rarity) }}>
                  {medal.rarity.toUpperCase()}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="modal-content">
            <div className="medal-details">
              <div className="detail-section">
                <h4>Medal Information</h4>
                <div className="medal-stats">
                  <div className="stat-item">
                    <span className="stat-label">Category:</span>
                    <span className="stat-value">{medal.category}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Level:</span>
                    <span className="stat-value">{medal.level}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rarity:</span>
                    <span className="stat-value" style={{ color: getRarityColor(medal.rarity) }}>
                      {medal.rarity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Power & Abilities</h4>
                <div className="power-display">
                  <div className="power-name">{medal.power}</div>
                  <div className="power-description">{medal.description}</div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Color Signature</h4>
                <div className="color-signature">
                  {medal.colors.map((color, index) => (
                    <div key={index} className="color-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="color-code">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-primary">Equip Medal</button>
            <button className="btn btn-secondary">View Details</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="medal-gallery">
      <header className="gallery-header">
        <h1 className="gallery-title">Medal & Trophy Gallery</h1>
        <p className="gallery-subtitle">Complete collection of achievement medals and trophies</p>
      </header>

      <div className="gallery-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search medals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="medals-grid">
        {filteredMedals.map(medal => (
          <MedalCard key={medal.id} medal={medal} />
        ))}
      </div>

      {selectedMedal && (
        <MedalModal 
          medal={selectedMedal} 
          onClose={() => setSelectedMedal(null)} 
        />
      )}
    </div>
  );
};

export default MedalGallery;
