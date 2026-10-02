import React, { useState, useEffect } from 'react';
import '../design-tokens.css';
import './AssetManager.css';

const AssetManager = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Asset categories configuration
  const categories = [
    { id: 'all', name: 'All Assets', icon: '🎯', count: 0 },
    { id: 'brandIdentity', name: 'Brand Identity', icon: '🏆', count: 14 },
    { id: 'certificates', name: 'Certificates', icon: '📜', count: 23 },
    { id: 'horoscope', name: 'Horoscope Signs', icon: '⭐', count: 12 },
    { id: 'medals', name: 'Medals & Badges', icon: '🎖️', count: 38 },
    { id: 'logos', name: 'Logos & Phases', icon: '🔷', count: 31 },
    { id: 'phases', name: 'User Phases', icon: '📈', count: 32 },
    { id: 'achiever', name: 'Sovereign Achiever', icon: '👑', count: 9 },
    { id: 'stickers', name: 'Stickers', icon: '🎨', count: 12 },
    { id: 'trophies', name: 'Trophies', icon: '🏆', count: 20 },
    { id: 'crypto', name: 'Crypto Coin', icon: '₿', count: 1 },
    { id: 'zodiac', name: 'Zodiac Collection', icon: '♈', count: 22 }
  ];

  // Sample asset data (in real app, this would come from API)
  const sampleAssets = [
    {
      id: 1,
      category: 'brandIdentity',
      name: 'Gold Brand Identity',
      file: 'Brand_Identity_Style_S.Y.D_Omega_91717_Gold.jpg',
      colors: ['#FFD700', '#B8860B'],
      usage: 'logo',
      description: 'Primary gold brand identity'
    },
    {
      id: 2,
      category: 'certificates',
      name: 'Sovereign Master Certificate',
      file: 'Certificate_of_Appreciation_Soverign_Master_S.Y.D_Omega_91717.jpeg',
      colors: ['#FFD700', '#4B0082'],
      usage: 'achievement',
      description: 'Sovereign Master appreciation certificate'
    },
    {
      id: 3,
      category: 'horoscope',
      name: 'Aries Zodiac Sign',
      file: 'horoscope_sign_Aries.png.jpeg',
      colors: ['#FF6B35', '#FF4500'],
      usage: 'zodiac',
      description: 'Aries zodiac sign - The Ram'
    },
    {
      id: 4,
      category: 'medals',
      name: 'Authority Medal Level 12',
      file: 'Authority_S.Y.D_Omega_91717_Medal-12.png',
      colors: ['#4B0082', '#FFD700'],
      usage: 'medal',
      description: 'Authority medal level 12'
    },
    {
      id: 5,
      category: 'phases',
      name: 'Architect Phase 4.1',
      file: 'Architect_Omega_91717_phase_4.1.1.jpg',
      colors: ['#4B0082', '#FFD700'],
      usage: 'phase',
      description: 'Architect phase 4.1'
    }
  ];

  useEffect(() => {
    // Simulate loading assets
    setTimeout(() => {
      setAssets(sampleAssets);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const AssetCard = ({ asset }) => (
    <div className="asset-card">
      <div className="asset-preview">
        <div className="asset-image-placeholder">
          <span className="asset-icon">🖼️</span>
        </div>
        <div className="asset-overlay">
          <button className="preview-btn">👁️ Preview</button>
          <button className="download-btn">⬇️ Download</button>
        </div>
      </div>
      <div className="asset-info">
        <h4 className="asset-name">{asset.name}</h4>
        <p className="asset-description">{asset.description}</p>
        <div className="asset-meta">
          <div className="asset-colors">
            {asset.colors.map((color, index) => (
              <span 
                key={index} 
                className="color-dot" 
                style={{ backgroundColor: color }}
                title={color}
              ></span>
            ))}
          </div>
          <span className="asset-usage">{asset.usage}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="asset-manager loading">
        <div className="loading-spinner">
          <div className="omega-loader">Ω</div>
          <p>Loading Asset Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="asset-manager">
      <header className="asset-header">
        <h1 className="asset-title">S.Y.D Omega 91717 Asset Library</h1>
        <p className="asset-subtitle">Complete collection of brand assets, certificates, medals, and more</p>
      </header>

      <div className="asset-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search assets..."
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
              <span className="category-count">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No assets found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default AssetManager;
