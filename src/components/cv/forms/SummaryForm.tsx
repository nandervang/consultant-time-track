import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { CVSummary } from '@/types/cvGeneration';
import { useState } from 'react';

interface SummaryFormProps {
  data: CVSummary;
  onChange: (data: CVSummary) => void;
}

export function SummaryForm({ data, onChange }: SummaryFormProps) {
  const [newStrength, setNewStrength] = useState('');

  const handleChange = (field: keyof CVSummary, value: string | string[]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      handleChange('keyStrengths', [...data.keyStrengths, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const removeStrength = (index: number) => {
    const updated = data.keyStrengths.filter((_, i) => i !== index);
    handleChange('keyStrengths', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="introduction">Professional Introduction</Label>
          <Textarea
            id="introduction"
            value={data.introduction}
            onChange={(e) => handleChange('introduction', e.target.value)}
            placeholder="Write a compelling professional introduction that highlights your experience and expertise..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objective">Career Objective</Label>
          <Textarea
            id="objective"
            value={data.careerObjective || ''}
            onChange={(e) => handleChange('careerObjective', e.target.value)}
            placeholder="Describe your career goals and what you're looking for in your next role..."
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <Label>Key Strengths</Label>
          <div className="flex flex-wrap gap-2">
            {data.keyStrengths.map((strength, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {strength}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeStrength(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="Add a key strength..."
              onKeyPress={(e) => e.key === 'Enter' && addStrength()}
            />
            <Button onClick={addStrength} disabled={!newStrength.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}