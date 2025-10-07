import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, GraduationCap } from 'lucide-react';
import { CVEducationItem } from '@/types/cvGeneration';

interface EducationFormProps {
  data: CVEducationItem[];
  onChange: (data: CVEducationItem[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const addEducation = () => {
    const newEducation: CVEducationItem = {
      institution: '',
      degree: '',
      field: '',
      period: '',
      gpa: ''
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateEducation = (index: number, field: keyof CVEducationItem, value: string) => {
    const updated = data.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Education</h2>
          <p className="text-muted-foreground">
            Add your educational background including degrees, certifications, and relevant coursework
          </p>
        </div>
      </div>

      {/* Add new education button */}
      <Card className="border-dashed border-2">
        <CardContent className="flex items-center justify-center py-8">
          <Button onClick={addEducation} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Education Entry
          </Button>
        </CardContent>
      </Card>

      {/* Education entries */}
      <div className="space-y-6">
        {data.map((education, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {education.degree || education.institution || `Education Entry ${index + 1}`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`institution-${index}`}>Institution *</Label>
                  <Input
                    id={`institution-${index}`}
                    value={education.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    placeholder="e.g., Blekinge Tekniska Högskola"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`period-${index}`}>Period *</Label>
                  <Input
                    id={`period-${index}`}
                    value={education.period}
                    onChange={(e) => updateEducation(index, 'period', e.target.value)}
                    placeholder="e.g., 2008 - 2011"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`degree-${index}`}>Degree/Program *</Label>
                <Input
                  id={`degree-${index}`}
                  value={education.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="e.g., Interaktion och Design (MDA) interaktionsdesign (Kandidatexamen)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`field-${index}`}>Field of Study</Label>
                <Input
                  id={`field-${index}`}
                  value={education.field}
                  onChange={(e) => updateEducation(index, 'field', e.target.value)}
                  placeholder="e.g., Computer Science, Design, Engineering"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`gpa-${index}`}>GPA/Grade (Optional)</Label>
                <Input
                  id={`gpa-${index}`}
                  value={education.gpa || ''}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  placeholder="e.g., 3.8/4.0, VG, A"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No education entries yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your educational background to showcase your academic achievements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}