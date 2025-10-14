import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CVClosing } from '@/types/cvGeneration';

interface ClosingFormProps {
  data: CVClosing;
  onChange: (data: CVClosing) => void;
}

export function ClosingForm({ data, onChange }: ClosingFormProps) {
  const updateField = (field: keyof CVClosing, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const updateContactField = (field: keyof CVClosing['contact'], value: string) => {
    onChange({
      ...data,
      contact: {
        ...data.contact,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Closing Section</h3>
        <p className="text-sm text-gray-600">
          Add a closing message and contact information for the Andervang Consulting template
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Closing Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="closing-text">Message Text</Label>
            <Textarea
              id="closing-text"
              value={data.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="Thank you message and call to action..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will appear at the end of your CV as a professional closing.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={data.contact.email}
                onChange={(e) => updateContactField('email', e.target.value)}
                placeholder="contact@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={data.contact.phone}
                onChange={(e) => updateContactField('phone', e.target.value)}
                placeholder="+46 70 123 45 67"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-location">Location</Label>
              <Input
                id="contact-location"
                value={data.contact.location}
                onChange={(e) => updateContactField('location', e.target.value)}
                placeholder="City, Country"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-company">Company</Label>
              <Input
                id="contact-company"
                value={data.contact.company}
                onChange={(e) => updateContactField('company', e.target.value)}
                placeholder="Company Name"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}