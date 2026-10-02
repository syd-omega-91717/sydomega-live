import React, { useState } from 'react';
import '../design-tokens.css';
import './CertificateGallery.css';

const CertificateGallery = () => {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Certificate data from the folders
  const appreciationCertificates = [
    {
      id: 'app1',
      stage: 1,
      name: 'Certificate of Appreciation - Stage 1',
      file: 'certificate_of_appreciation_stage_1.png.jpeg',
      colors: ['#FFD700', '#FFFFFF'],
      description: 'Initial appreciation certificate for beginning the journey'
    },
    {
      id: 'app2',
      stage: 2,
      name: 'Certificate of Appreciation - Stage 2',
      file: 'certificate_of_appreciation_stage_2.png.jpeg',
      colors: ['#FFD700', '#F0E68C'],
      description: 'Progressive achievement recognition'
    },
    {
      id: 'app3',
      stage: 3,
      name: 'Certificate of Appreciation - Stage 3',
      file: 'certificate_of_appreciation_stage_3.png.jpeg',
      colors: ['#FFD700', '#DAA520'],
      description: 'Advanced appreciation certificate'
    },
    {
      id: 'app4',
      stage: 4,
      name: 'Certificate of Appreciation - Stage 4',
      file: 'certificate_of_appreciation_stage_4.png.jpeg',
      colors: ['#FFD700', '#B8860B'],
      description: 'Excellence in achievement certificate'
    },
    {
      id: 'app5',
      stage: 5,
      name: 'Certificate of Appreciation - Stage 5',
      file: 'certificate_of_appreciation_stage_5.png.jpeg',
      colors: ['#FFD700', '#FF8C00'],
      description: 'Mastery appreciation certificate'
    },
    {
      id: 'app6',
      stage: 6,
      name: 'Certificate of Appreciation - Stage 6',
      file: 'certificate_of_appreciation_stage_6.png.jpeg',
      colors: ['#FFD700', '#FF6347'],
      description: 'Expert level appreciation certificate'
    },
    {
      id: 'app7',
      stage: 7,
      name: 'Certificate of Appreciation - Stage 7',
      file: 'certificate_of_appreciation_stage_7.png.jpeg',
      colors: ['#FFD700', '#FF4500'],
      description: 'Advanced expert appreciation certificate'
    },
    {
      id: 'app8',
      stage: 8,
      name: 'Certificate of Appreciation - Stage 8',
      file: 'certificate_of_appreciation_stage_8.png.jpeg',
      colors: ['#FFD700', '#DC143C'],
      description: 'Master appreciation certificate'
    },
    {
      id: 'app9',
      stage: 9,
      name: 'Certificate of Appreciation - Stage 9',
      file: 'certificate_of_appreciation_stage_9.png.jpeg',
      colors: ['#FFD700', '#8B0000'],
      description: 'Ultimate appreciation certificate - Zenith achievement'
    }
  ];

  const specializedCertificates = [
    {
      id: 'spec1',
      category: 'master',
      name: 'Sovereign Master Appreciation',
      file: 'Certificate_of_Appreciation_Soverign_Master_S.Y.D_Omega_91717.jpeg',
      colors: ['#FFD700', '#4B0082'],
      description: 'Highest level of sovereign achievement'
    },
    {
      id: 'spec2',
      category: 'astro',
      name: 'Astro Certification of Evolution',
      file: 'Certificate_of_Astro_Certification_of_Evolution_S.Y.D_Omega_91717.jpeg',
      colors: ['#9370DB', '#FF69B4'],
      description: 'Cosmic evolution certification'
    },
    {
      id: 'spec3',
      category: 'crypto',
      name: 'Crypto Achiever Certificate',
      file: 'Certificate_of_Crypto_Acheiver_S.Y.D_Omega_91717.jpeg',
      colors: ['#FF6347', '#FFD700'],
      description: 'Cryptocurrency achievement recognition'
    },
    {
      id: 'spec4',
      category: 'elite',
      name: 'Elite Sovereign Matrix',
      file: 'Certificate_of_Elite_Sovergian_Matrix_S.Y.D_Omega_91717.jpeg',
      colors: ['#00CED1', '#FFD700'],
      description: 'Elite matrix certification'
    },
    {
      id: 'spec5',
      category: 'ascension',
      name: 'Sovereign Ascension',
      file: 'Certificate_of_Soveregn_Ascension_S.Y.D_Omega_91717.jpeg',
      colors: ['#FF69B4', '#FFD700'],
      description: 'Spiritual ascension certificate'
    },
    {
      id: 'spec6',
      category: 'zenith',
      name: 'Ascension Zenith Stage 9',
      file: 'Certificate_of_Soveregn_Ascension_Zenith_Stage_9_S.Y.D_Omega_91717.jpeg',
      colors: ['#FFD700', '#FF4500'],
      description: 'Ultimate zenith ascension'
    }
  ];

  const allCertificates = [...appreciationCertificates, ...specializedCertificates];

  const filteredCertificates = selectedStage === 'all' 
    ? allCertificates 
    : allCertificates.filter(cert => cert.stage === parseInt(selectedStage));

  const CertificateCard = ({ certificate }) => (
    <div 
      className="certificate-card"
      onClick={() => setSelectedCertificate(certificate)}
    >
      <div className="certificate-preview">
        <div className="certificate-image-placeholder">
          <span className="certificate-icon">📜</span>
          <div className="certificate-stage">
            {certificate.stage ? `Stage ${certificate.stage}` : certificate.category}
          </div>
        </div>
        <div className="certificate-overlay">
          <span className="view-icon">👁️</span>
        </div>
      </div>
      <div className="certificate-info">
        <h4 className="certificate-name">{certificate.name}</h4>
        <p className="certificate-description">{certificate.description}</p>
        <div className="certificate-colors">
          {certificate.colors.map((color, index) => (
            <span 
              key={index} 
              className="color-swatch" 
              style={{ backgroundColor: color }}
              title={color}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );

  const CertificateModal = ({ certificate, onClose }) => {
    if (!certificate) return null;

    return (
      <div className="certificate-modal-overlay" onClick={onClose}>
        <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{certificate.name}</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="modal-content">
            <div className="certificate-full-preview">
              <div className="certificate-placeholder-large">
                <span className="certificate-icon-large">📜</span>
                <p>Full Certificate Preview</p>
                <small>{certificate.file}</small>
              </div>
            </div>
            <div className="certificate-details">
              <h4>Certificate Details</h4>
              <p><strong>Description:</strong> {certificate.description}</p>
              {certificate.stage && <p><strong>Stage:</strong> {certificate.stage}</p>}
              {certificate.category && <p><strong>Category:</strong> {certificate.category}</p>}
              <div className="color-palette">
                <strong>Color Palette:</strong>
                <div className="palette-colors">
                  {certificate.colors.map((color, index) => (
                    <div key={index} className="palette-color">
                      <div 
                        className="palette-swatch" 
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
            <button className="btn btn-primary">Download Certificate</button>
            <button className="btn btn-secondary">Share</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="certificate-gallery">
      <header className="gallery-header">
        <h1 className="gallery-title">Certificate Gallery</h1>
        <p className="gallery-subtitle">Complete collection of achievement certificates and recognitions</p>
      </header>

      <div className="gallery-controls">
        <div className="stage-filters">
          <button 
            className={`stage-btn ${selectedStage === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStage('all')}
          >
            All Certificates
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(stage => (
            <button
              key={stage}
              className={`stage-btn ${selectedStage === stage.toString() ? 'active' : ''}`}
              onClick={() => setSelectedStage(stage.toString())}
            >
              Stage {stage}
            </button>
          ))}
        </div>
      </div>

      <div className="certificates-grid">
        {filteredCertificates.map(certificate => (
          <CertificateCard key={certificate.id} certificate={certificate} />
        ))}
      </div>

      {selectedCertificate && (
        <CertificateModal 
          certificate={selectedCertificate} 
          onClose={() => setSelectedCertificate(null)} 
        />
      )}
    </div>
  );
};

export default CertificateGallery;
