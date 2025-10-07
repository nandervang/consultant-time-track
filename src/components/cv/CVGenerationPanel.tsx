import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { CVGenerationData, CVVersion, CVGenerationResult } from '@/types/cvGeneration';
import { CVProfile } from '@/types/cv';
import { useCVTemplateManager } from '@/hooks/useCVTemplateManager';
import { useCVGenerator } from '@/hooks/useCVGenerator';
import { downloadFile, generateCVFilename, getMimeType } from '@/utils/fileDownload';

interface CVGenerationPanelProps {
  cvData: CVGenerationData;
  profile: CVProfile;
  currentVersion: CVVersion | null;
  className?: string;
}

export function CVGenerationPanel({ 
  cvData, 
  profile, 
  currentVersion,
  className = '' 
}: CVGenerationPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('frank-digital');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [generationResult, setGenerationResult] = useState<CVGenerationResult | null>(null);

  const { templates, loading: templatesLoading } = useCVTemplateManager();
  const { 
    isGenerating, 
    generationProgress, 
    error, 
    generateCV, 
    generateAllFormats,
    checkAPIHealth 
  } = useCVGenerator();

  const [apiHealthy, setApiHealthy] = useState<boolean | null>(true); // Default to healthy

  useEffect(() => {
    // Only check health if specifically needed, don't block UI
    const checkHealth = async () => {
      try {
        const isHealthy = await checkAPIHealth();
        setApiHealthy(isHealthy);
      } catch (error) {
        console.warn('API health check skipped:', error);
        setApiHealthy(true); // Assume healthy, will fail gracefully on actual use
      }
    };
    
    // Delayed health check to not block initial render
    const timeoutId = setTimeout(checkHealth, 1000);
    return () => clearTimeout(timeoutId);
  }, [checkAPIHealth]);

  const handleDownloadFile = (fileUrl: string, format: string, templateId?: string) => {
    const template = templates.find(t => t.id === templateId);
    const filename = generateCVFilename(
      { fullName: cvData.personalInfo.name }, 
      format, 
      template?.name
    );
    downloadFile({
      content: fileUrl,
      filename,
      mimeType: getMimeType(format)
    });
  };

  const handleGenerateCV = async () => {
    try {
      const result = await generateCV(
        cvData,
        selectedTemplate,
        selectedFormat,
        profile.id,
        currentVersion?.id
      );
      setGenerationResult(result);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleGenerateAllFormats = async () => {
    try {
      const result = await generateAllFormats(
        cvData,
        selectedTemplate,
        profile.id,
        currentVersion?.id
      );
      setGenerationResult(result);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const formats = [
    { value: 'pdf', label: 'PDF', description: 'Best for printing and sharing' },
    { value: 'html', label: 'HTML', description: 'Web-friendly format' },
    { value: 'docx', label: 'Word', description: 'Editable document format' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate CV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Health Status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">API Status:</span>
            {apiHealthy === null ? (
              <Badge variant="outline">Checking...</Badge>
            ) : apiHealthy ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                ) : (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                {formats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-muted-foreground">{format.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating CV...</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generation Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleGenerateCV} 
              disabled={isGenerating || !apiHealthy || !selectedTemplate}
              className="w-full"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate {selectedFormat.toUpperCase()}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGenerateAllFormats} 
              disabled={isGenerating || !apiHealthy || !selectedTemplate}
              className="w-full"
            >
              Generate All Formats
            </Button>
          </div>

          {/* Results */}
          {generationResult && (
            <div className="space-y-3 p-3 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Generation Complete!</span>
              </div>
              
              {generationResult.data?.fileUrl ? (
                // Single file result
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    Format: {generationResult.data.format?.toUpperCase() || selectedFormat.toUpperCase()}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => generationResult.data?.fileUrl && handleDownloadFile(
                      generationResult.data.fileUrl, 
                      generationResult.data.format || selectedFormat,
                      selectedTemplate
                    )}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download CV
                  </Button>
                </div>
              ) : generationResult.data?.results ? (
                // Multiple formats result
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    Generated {generationResult.data.summary?.successful || 0} of{' '}
                    {generationResult.data.summary?.total || 0} formats
                  </p>
                  <div className="space-y-1">
                    {Object.entries(generationResult.data.results).map(([format, result]: [string, { success: boolean; fileUrl?: string; error?: string }]) => (
                      <div key={format} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{format.toUpperCase()}</span>
                        {result.success ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => result.fileUrl && handleDownloadFile(
                              result.fileUrl, 
                              format,
                              selectedTemplate
                            )}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}