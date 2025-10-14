// CV Generation Dialog Component
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { CVGenerationData } from '@/types/cvGeneration';
import { transformToAPIPayload } from '@/utils/cv-data-transformer';
import { cvGenerationAPI } from '@/services/cv-generation-api';

interface CVGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVGenerationData;
}

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

interface FormatResult {
  format: 'pdf' | 'docx' | 'html';
  status: 'pending' | 'generating' | 'success' | 'error';
  fileUrl?: string;
  error?: string;
}

export function CVGenerationDialog({ isOpen, onClose, cvData }: CVGenerationDialogProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<'pdf' | 'docx' | 'html'>>(
    new Set(['pdf'])
  );
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FormatResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const formats: Array<{ value: 'pdf' | 'docx' | 'html'; label: string; icon: string }> = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'docx', label: 'Word (DOCX)', icon: '📝' },
    { value: 'html', label: 'HTML', icon: '🌐' }
  ];

  const toggleFormat = (format: 'pdf' | 'docx' | 'html') => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormats(newFormats);
  };

  const handleGenerate = async () => {
    if (selectedFormats.size === 0) {
      setErrorMessage('Please select at least one format');
      return;
    }

    setStatus('generating');
    setProgress(0);
    setErrorMessage('');
    setResults([]);

    try {
      // Transform CV data to API payload
      const basePayload = transformToAPIPayload(cvData, {
        template: 'andervang-consulting',
        company: 'Frank Digital AB'
      });

      // Remove format from base payload for multi-format generation
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { format, ...payloadWithoutFormat } = basePayload;

      const formatArray = Array.from(selectedFormats);
      
      // Initialize results
      const initialResults: FormatResult[] = formatArray.map(fmt => ({
        format: fmt,
        status: 'pending'
      }));
      setResults(initialResults);

      // If single format, use single endpoint
      if (formatArray.length === 1) {
        setProgress(30);
        const singlePayload = { ...basePayload, format: formatArray[0] };
        const response = await cvGenerationAPI.generateCV(singlePayload);
        
        setProgress(80);
        
        if (response.success) {
          setResults([{
            format: formatArray[0],
            status: 'success',
            fileUrl: response.data.fileUrl
          }]);
          setStatus('success');
          setProgress(100);
        } else {
          throw new Error('Generation failed');
        }
      } else {
        // Multi-format generation
        setProgress(30);
        const responses = await cvGenerationAPI.generateMultiFormatCV(
          payloadWithoutFormat,
          formatArray
        );
        
        setProgress(80);
        
        // Process results
        const finalResults: FormatResult[] = formatArray.map(fmt => {
          const response = responses[fmt];
          if (!response) {
            return { format: fmt, status: 'error', error: 'No response received' };
          }
          
          if (response.success) {
            return {
              format: fmt,
              status: 'success',
              fileUrl: response.data.fileUrl
            };
          } else {
            return {
              format: fmt,
              status: 'error',
              error: response.error.message || 'Generation failed'
            };
          }
        });
        
        setResults(finalResults);
        
        // Check if all succeeded
        const allSuccess = finalResults.every(r => r.status === 'success');
        setStatus(allSuccess ? 'success' : 'error');
        setProgress(100);
        
        if (!allSuccess) {
          const errors = finalResults
            .filter(r => r.status === 'error')
            .map(r => `${r.format.toUpperCase()}: ${r.error}`)
            .join(', ');
          setErrorMessage(`Some formats failed: ${errors}`);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      setProgress(0);
      
      // Mark all as error
      setResults(
        Array.from(selectedFormats).map(fmt => ({
          format: fmt,
          status: 'error',
          error: error instanceof Error ? error.message : 'Generation failed'
        }))
      );
    }
  };

  const handleDownload = async (result: FormatResult) => {
    if (!result.fileUrl) return;

    try {
      const filename = `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV.${result.format}`;
      await cvGenerationAPI.downloadCV(result.fileUrl, filename);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage(`Failed to download ${result.format.toUpperCase()} file`);
    }
  };

  const handleClose = () => {
    if (status !== 'generating') {
      setStatus('idle');
      setProgress(0);
      setResults([]);
      setErrorMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate CV
          </DialogTitle>
          <DialogDescription>
            Select the formats you want to generate and download your CV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          {status === 'idle' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Formats:</Label>
              <div className="space-y-2">
                {formats.map(format => (
                  <div key={format.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={format.value}
                      checked={selectedFormats.has(format.value)}
                      onCheckedChange={() => toggleFormat(format.value)}
                    />
                    <Label
                      htmlFor={format.value}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <span>{format.icon}</span>
                      <span>{format.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {status === 'generating' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating your CV...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {(status === 'success' || status === 'error') && results.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Results:</Label>
              <div className="space-y-2">
                {results.map(result => (
                  <div
                    key={result.format}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {result.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {result.status === 'generating' && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span className="text-sm font-medium">
                        {result.format.toUpperCase()}
                      </span>
                      {result.error && (
                        <span className="text-xs text-red-600">({result.error})</span>
                      )}
                    </div>
                    {result.status === 'success' && result.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(result)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={selectedFormats.size === 0}>
                Generate CV
              </Button>
            </>
          )}
          {status === 'generating' && (
            <Button disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </Button>
          )}
          {(status === 'success' || status === 'error') && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
