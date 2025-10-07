import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Languages } from 'lucide-react';
import { CVLanguageItem } from '@/types/cvGeneration';

interface LanguagesFormProps {
  data: CVLanguageItem[];
  onChange: (data: CVLanguageItem[]) => void;
}

const proficiencyLevels = [
  { value: 'A1 - Beginner', label: 'A1 - Beginner' },
  { value: 'A2 - Elementary', label: 'A2 - Elementary' },
  { value: 'B1 - Intermediate', label: 'B1 - Intermediate' },
  { value: 'B2 - Upper Intermediate', label: 'B2 - Upper Intermediate' },
  { value: 'C1 - Advanced', label: 'C1 - Advanced' },
  { value: 'C2 - Proficient', label: 'C2 - Proficient' },
  { value: 'Native', label: 'Native Speaker' }
];

export function LanguagesForm({ data, onChange }: LanguagesFormProps) {
  const addLanguage = () => {
    const newLanguage: CVLanguageItem = {
      language: '',
      proficiency: ''
    };
    onChange([...data, newLanguage]);
  };

  const removeLanguage = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateLanguage = (index: number, field: keyof CVLanguageItem, value: string) => {
    const updated = data.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Languages className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Languages</h2>
          <p className="text-muted-foreground">
            List your language skills with proficiency levels according to the Common European Framework
          </p>
        </div>
      </div>

      {/* Add new language button */}
      <Card className="border-dashed border-2">
        <CardContent className="flex items-center justify-center py-8">
          <Button onClick={addLanguage} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Language
          </Button>
        </CardContent>
      </Card>

      {/* Language entries */}
      <div className="space-y-4">
        {data.map((language, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {language.language || `Language ${index + 1}`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLanguage(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`language-${index}`}>Language *</Label>
                  <Input
                    id={`language-${index}`}
                    value={language.language}
                    onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                    placeholder="e.g., English, Swedish, German, Spanish"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`proficiency-${index}`}>Proficiency Level *</Label>
                  <Select
                    value={language.proficiency}
                    onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {proficiencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No languages added yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your language skills to showcase your international capabilities.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Common European Framework Reference */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">Common European Framework Reference Levels:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>A1-A2:</strong> Basic user (beginner to elementary)</div>
            <div><strong>B1-B2:</strong> Independent user (intermediate to upper intermediate)</div>
            <div><strong>C1-C2:</strong> Proficient user (advanced to mastery)</div>
            <div><strong>Native:</strong> Native speaker level</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}