import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Award } from 'lucide-react';
import { CVCertificationItem } from '@/types/cvGeneration';

interface CertificationsFormProps {
  data: CVCertificationItem[];
  onChange: (data: CVCertificationItem[]) => void;
}

export function CertificationsForm({ data, onChange }: CertificationsFormProps) {
  const addCertification = () => {
    const newCertification: CVCertificationItem = {
      name: '',
      issuer: '',
      date: '',
      credentialId: '',
      url: '',
      expirationDate: ''
    };
    onChange([...data, newCertification]);
  };

  const removeCertification = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateCertification = (index: number, field: keyof CVCertificationItem, value: string) => {
    const updated = data.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Certifications & Licenses</h2>
          <p className="text-muted-foreground">
            Add professional certifications, licenses, and industry credentials
          </p>
        </div>
      </div>

      {/* Add new certification button */}
      <Card className="border-dashed border-2">
        <CardContent className="flex items-center justify-center py-8">
          <Button onClick={addCertification} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </CardContent>
      </Card>

      {/* Certification entries */}
      <div className="space-y-6">
        {data.map((certification, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {certification.name || `Certification ${index + 1}`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCertification(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`cert-name-${index}`}>Certification Name *</Label>
                <Input
                  id={`cert-name-${index}`}
                  value={certification.name}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  placeholder="e.g., AWS Certified Solutions Architect, PMP, Microsoft Azure Architect"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cert-issuer-${index}`}>Issuing Organization *</Label>
                  <Input
                    id={`cert-issuer-${index}`}
                    value={certification.issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                    placeholder="e.g., Amazon Web Services, PMI, Microsoft"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`cert-date-${index}`}>Issue Date *</Label>
                  <Input
                    id={`cert-date-${index}`}
                    value={certification.date}
                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    placeholder="e.g., March 2023, 2023-03"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cert-credential-${index}`}>Credential ID (Optional)</Label>
                <Input
                  id={`cert-credential-${index}`}
                  value={certification.credentialId || ''}
                  onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                  placeholder="e.g., AWS-ASA-1234567, 12345-ABC-789"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cert-url-${index}`}>Certificate URL (Optional)</Label>
                  <Input
                    id={`cert-url-${index}`}
                    type="url"
                    value={certification.url || ''}
                    onChange={(e) => updateCertification(index, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cert-expiration-${index}`}>Expiration Date (Optional)</Label>
                  <Input
                    id={`cert-expiration-${index}`}
                    value={certification.expirationDate || ''}
                    onChange={(e) => updateCertification(index, 'expirationDate', e.target.value)}
                    placeholder="e.g., March 2025, Never expires"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your professional certifications and industry credentials to strengthen your profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}