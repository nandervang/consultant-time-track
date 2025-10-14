import React, { useState } from 'react';
import CVGenerationModal from './CVGenerationModal';

const ConsultantCard = ({ consultant, onEdit, onDelete }) => {
  const [showCVModal, setShowCVModal] = useState(false);

  return (
    <div className="consultant-card">
      <div className="consultant-info">
        <h2>{consultant.personalInfo.name}</h2>
        <p>{consultant.personalInfo.title}</p>
        <p>{consultant.personalInfo.email}</p>
        <p>{consultant.personalInfo.phone}</p>
        <p>{consultant.personalInfo.location}</p>
      </div>

      <div className="consultant-actions">
        <button onClick={onEdit} className="edit-button" title="Redigera konsult">
          ✏️ Redigera
        </button>
        <button onClick={onDelete} className="delete-button" title="Ta bort konsult">
          🗑️ Ta bort
        </button>
        <button 
          onClick={() => setShowCVModal(true)}
          className="cv-generate-button"
          title="Generera CV"
        >
          📄 Generera CV
        </button>
      </div>

      <CVGenerationModal
        consultant={consultant}
        isOpen={showCVModal}
        onClose={() => setShowCVModal(false)}
      />
    </div>
  );
};

export default ConsultantCard;