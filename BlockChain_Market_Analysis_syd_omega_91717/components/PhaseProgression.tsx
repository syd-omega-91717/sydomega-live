import React, { useState } from 'react';
import '../design-tokens.css';
import './PhaseProgression.css';

const PhaseProgression = () => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Complete phase data from Phases folder
  const phaseCategories = [
    {
      id: 'casual',
      name: 'Casual User',
      description: 'Entry level for new users',
      color: '#C0C0C0',
      phases: [
        { id: 'casual1', name: 'Phase 1.1', file: 'Casual_User_HOMOGENIC_Omega_91717_phase_1.1.1.jpg' },
        { id: 'casual2', name: 'Phase 2.1', file: 'Casual_User_HOMOGENIC_Omega_91717_phase_2.1.1.jpg' },
        { id: 'casual3', name: 'Phase 3.1', file: 'Casual_User_HOMOGENIC_Omega_91717_phase_3.1.1.jpg' },
        { id: 'casual4', name: 'Phase 4.1', file: 'Casual_User_HOMOGENIC_Omega_91717_phase_4.1.1.jpg' },
        { id: 'casual5', name: 'Phase 5.1', file: 'Casual_User_HOMOGENIC_Omega_91717_phase_5.1.1.jpg' }
      ]
    },
    {
      id: 'emerald',
      name: 'Emerald Sovereign',
      description: 'Advanced user with emerald status',
      color: '#50C878',
      phases: [
        { id: 'emerald1', name: 'Phase 1.1', file: 'Emirald_Sovergian_HOMOGENIC_OMEGA_91717_Phase_1.1.1.jpg' },
        { id: 'emerald2', name: 'Phase 2.1', file: 'Emirald_Sovergian_HOMOGENIC_OMEGA_91717_Phase_2.1.1.jpg' },
        { id: 'emerald3', name: 'Phase 3.1', file: 'Emirald_Sovergian_HOMOGENIC_OMEGA_91717_Phase_3.1.1.jpg' },
        { id: 'emerald4', name: 'Phase 4.1', file: 'Emirald_Sovergian_HOMOGENIC_OMEGA_91717_Phase_4.1.1.jpg' },
        { id: 'emerald5', name: 'Phase 5.1', file: 'Emirald_Sovergian_HOMOGENIC_OMEGA_91717_Phase_5.1.1.jpg' }
      ]
    },
    {
      id: 'premium',
      name: 'Premium Subscriber',
      description: 'Premium tier with exclusive benefits',
      color: '#FFD700',
      phases: [
        { id: 'premium1', name: 'Phase 1.1', file: 'Premium_Subscriber_HOMOGENIC_OMEGA_91717_Phase_1.1.1.jpg' },
        { id: 'premium2', name: 'Phase 2.1', file: 'Premium_Subscriber_HOMOGENIC_OMEGA_91717_Phase_2.1.1.jpg' },
        { id: 'premium3', name: 'Phase 3.1', file: 'Premium_Subscriber_HOMOGENIC_OMEGA_91717_Phase_3.1.1.jpg' },
        { id: 'premium4', name: 'Phase 4.1', file: 'Premium_Subscriber_HOMOGENIC_OMEGA_91717_Phase_4.1.1.jpg' },
        { id: 'premium5', name: 'Phase 5.1', file: 'Premium_Subscriber_HOMOGENIC_OMEGA_91717_Phase_5.1.1.jpg' }
      ]
    },
    {
      id: 'verified',
      name: 'Verified Member',
      description: 'Verified status with enhanced privileges',
      color: '#00CED1',
      phases: [
        { id: 'verified1', name: 'Phase 1.1', file: 'Verifed_Member_HOMOGENIC_OMEGA_91717_Phase_1.1.1.jpg' },
        { id: 'verified2', name: 'Phase 2.1', file: 'Verifed_Member_HOMOGENIC_OMEGA_91717_Phase_2.1.1.jpg' },
        { id: 'verified3', name: 'Phase 3.1', file: 'Verifed_Member_HOMOGENIC_OMEGA_91717_Phase_3.1.1.jpg' },
        { id: 'verified4', name: 'Phase 4.1', file: 'Verifed_Member_HOMOGENIC_OMEGA_91717_Phase_4.1.1.jpg' },
        { id: 'verified5', name: 'Phase 5.1', file: 'Verifed_Member_HOMOGENIC_OMEGA_91717_Phase_5.1.1.jpg' }
      ]
    },
    {
      id: 'specialized',
      name: 'Specialized Roles',
      description: 'Advanced specialized user roles',
      color: '#4B0082',
      phases: [
        { id: 'HOMOGENIC_HOMOGENIC_MASTER', name: 'HOMOGENIC_HOMOGENIC_MASTER Phase 4.1', file: 'HOMOGENIC_HOMOGENIC_MASTER_Omega_91717_phase_4.1.1.jpg' },
        { id: 'explorer', name: 'Explorer Phase 2.1', file: 'Explorer_Omega_91717_phase_2.1.1.jpg' },
        { id: 'initiate1', name: 'Initiate Phase 2.1', file: 'Initiaite_Omega_91717_phase_2.1.1.jpg' },
        { id: 'initiate2', name: 'Initiate Phase 9.1', file: 'Initiaite_Omega_91717_phase_9.1.1.jpg' },
        { id: 'lion', name: 'Lion Eye Phase 1.1', file: 'Lion_HOMOGENIC_Omega_91717_Eye_1.1.1.jpg' },
        { id: 'navigator', name: 'Navigator Phase 3.1', file: 'Navcater_Omega_91717_phase_3.1.1.jpg' },
        { id: 'commander1', name: 'Commander Phase 6.1', file: 'Commander_Omega_91717_phase_6.1.1.jpg' },
        { id: 'commander2', name: 'Commander Phase 8.4', file: 'Commander_Omega_91717_phase_8.1.4.jpg' },
        { id: 'strategist', name: 'Strategist Phase 5.1', file: 'Stratigest_Omega_91717_phase_5.1.1.jpg' }
      ]
    },
    {
      id: 'ultimate',
      name: 'Ultimate Phases',
      description: 'Highest achievement phases',
      color: '#FF4500',
      phases: [
        { id: 'singularity', name: 'Omega Singularity Phase 9.9', file: 'Omega_Singulaity_Omega_91717_phase_9.1.9.jpg' }
      ]
    }
  ];

  const allPhases = phaseCategories.flatMap(category => 
    category.phases.map(phase => ({
      ...phase,
      category: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      categoryDescription: category.description
    }))
  );

  const filteredPhases = activeCategory === 'all' 
    ? allPhases 
    : allPhases.filter(phase => phase.category === activeCategory);

  const PhaseCard = ({ phase }) => (
    <div 
      className="phase-card"
      onClick={() => setSelectedPhase(phase)}
      style={{ borderColor: phase.categoryColor }}
    >
      <div className="phase-header">
        <div className="phase-icon">*</div>
        <div className="phase-category" style={{ backgroundColor: phase.categoryColor }}>
          {phase.categoryName}
        </div>
      </div>
      
      <div className="phase-content">
        <h3 className="phase-name">{phase.name}</h3>
        <p className="phase-description">{phase.categoryDescription}</p>
        
        <div className="phase-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${parseInt(phase.name.split('.')[1]) * 20}%`,
                backgroundColor: phase.categoryColor 
              }}
            ></div>
          </div>
          <span className="progress-text">Level {phase.name.split('.')[1]}</span>
        </div>
      </div>
      
      <div className="phase-footer">
        <span className="phase-file">{phase.file}</span>
        <div className="phase-actions">
          <button className="action-btn">👁️</button>
          <button className="action-btn">⬇️</button>
        </div>
      </div>
    </div>
  );

  const PhaseModal = ({ phase, onClose }) => {
    if (!phase) return null;

    return (
      <div className="phase-modal-overlay" onClick={onClose}>
        <div className="phase-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-phase-info">
              <div className="modal-phase-icon">⭐</div>
              <div>
                <h2>{phase.name}</h2>
                <div className="modal-category" style={{ backgroundColor: phase.categoryColor }}>
                  {phase.categoryName}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="modal-content">
            <div className="phase-details">
              <div className="detail-section">
                <h3>Phase Information</h3>
                <div className="phase-stats">
                  <div className="stat-item">
                    <span className="stat-label">Category:</span>
                    <span className="stat-value">{phase.categoryName}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Level:</span>
                    <span className="stat-value">{phase.name.split('.')[1]}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value">{parseInt(phase.name.split('.')[1]) * 20}%</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Description</h3>
                <p className="phase-full-description">{phase.categoryDescription}</p>
              </div>
              
              <div className="detail-section">
                <h3>Phase File</h3>
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <span className="file-name">{phase.file}</span>
                    <span className="file-path">/Phases_HOMOGENIC_OMEGA_91717/{phase.file}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Benefits & Privileges</h3>
                <div className="benefits-list">
                  <div className="benefit-item">
                    <span className="benefit-icon">✨</span>
                    <span className="benefit-text">Enhanced platform access</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🎯</span>
                    <span className="benefit-text">Exclusive content unlock</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">👑</span>
                    <span className="benefit-text">Priority support</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">⚡</span>
                    <span className="benefit-text">Special abilities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-primary">Activate Phase</button>
            <button className="btn btn-secondary">View Requirements</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="phase-progression">
      <header className="progression-header">
        <h1 className="progression-title">User Phase Progression</h1>
        <p className="progression-subtitle">Complete journey through all user phases and advancement levels</p>
      </header>

      <div className="progression-controls">
        <div className="category-filters">
          <button
            className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Phases
          </button>
          {phaseCategories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              style={{ borderColor: category.color }}
            >
              <span className="category-dot" style={{ backgroundColor: category.color }}></span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="phases-grid">
        {filteredPhases.map(phase => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      {selectedPhase && (
        <PhaseModal 
          phase={selectedPhase} 
          onClose={() => setSelectedPhase(null)} 
        />
      )}
    </div>
  );
};

export default PhaseProgression;
