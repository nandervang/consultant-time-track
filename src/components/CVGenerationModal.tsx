import React, { useState } from 'react';
import { cvAPI } from '../services/cv-generation-api';
import { transformConsultantToAndervangCV } from '../utils/cv-data-transformer';

interface CVGenerationModalProps {
  consultant: any;
  isOpen: boolean;
  onClose: () => void;
}

const CVGenerationModal: React.FC<CVGenerationModalProps> = ({ consultant, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress('Preparing CV data...');

    try {
      const cvData = transformConsultantToAndervangCV(consultant);
      
      // Enhanced progress messaging for serverless
      setProgress('Starting CV generation (serverless functions may take 15-45 seconds)...');
      
      const result = await cvAPI.generateCV(cvData);
      
      if (result.success) {
        setGenerationResult(result.data);
        setProgress('');
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('CV Generation Error:', err);
      
      // Improved error messages for serverless issues
      let errorMessage = err.message;
      
      if (err.message.includes('timeout') || err.message.includes('cold start')) {
        errorMessage = 'Generation timed out due to serverless cold start. This is normal for the first request. Please try again - it will be much faster the second time.';
      } else if (err.message.includes('Function invocation')) {
        errorMessage = 'Serverless function timeout. Please try again with a smaller CV or contact support if this persists.';
      } else if (err.message.includes('HTTP 5')) {
        errorMessage = 'Server error during generation. Please try again in a moment.';
      }
      
      setError(errorMessage);
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generera CV - {consultant.firstName} {consultant.lastName}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {!isGenerating && !generationResult && !error && (
            <div>
              <p>Klicka på knappen nedan för att generera ett professionellt CV baserat på Andervang Consulting-mallen.</p>
              <div className="notice">
                <small>⚡ Första genereringen kan ta 30-45 sekunder på grund av serverless cold start</small>
              </div>
            </div>
          )}
          
          {isGenerating && (
            <div className="generation-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p>{progress}</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <h3>⚠️ Fel vid generering</h3>
              <p>{error}</p>
            </div>
          )}
          
          {generationResult && (
            <div className="success-message">
              <h3>✅ CV genererat!</h3>
              <p>Ditt CV har genererats framgångsrikt.</p>
              <a href={generationResult.url} download={generationResult.filename} className="download-button">
                Ladda ner CV
              </a>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {!isGenerating && !generationResult && (
            <button onClick={handleGenerate} className="generate-button">
              Generera CV
            </button>
          )}
          <button onClick={onClose} className="cancel-button">
            {generationResult ? 'Stäng' : 'Avbryt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVGenerationModal;
