import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Palette, FileText, Eye, User } from 'lucide-react';
import { CVTemplateSettings } from '@/types/cvGeneration';

interface TemplateSettingsFormProps {
  data: CVTemplateSettings;
  onChange: (data: CVTemplateSettings) => void;
  profilePhoto?: string;
}

const templates = [
  { value: 'frank-digital', label: 'Frank Digital Professional' },
  { value: 'modern', label: 'Modern Clean' },
  { value: 'classic', label: 'Classic Traditional' },
  { value: 'creative', label: 'Creative Design' }
];

const themes = [
  { value: 'blue', label: 'Professional Blue' },
  { value: 'gray', label: 'Modern Gray' },
  { value: 'green', label: 'Fresh Green' },
  { value: 'purple', label: 'Creative Purple' }
];

const fontSizes = [
  { value: 'small', label: 'Small (10pt)' },
  { value: 'medium', label: 'Medium (11pt)' },
  { value: 'large', label: 'Large (12pt)' }
];

const marginSizes = [
  { value: 'narrow', label: 'Narrow (0.5")' },
  { value: 'normal', label: 'Normal (1")' },
  { value: 'wide', label: 'Wide (1.5")' }
];

export function TemplateSettingsForm({ data, onChange, profilePhoto }: TemplateSettingsFormProps) {
  const updateSetting = (field: keyof CVTemplateSettings, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Template Settings</h2>
          <p className="text-muted-foreground">
            Customize the appearance and formatting of your CV
          </p>
        </div>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template & Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">CV Template</Label>
              <Select
                value={data.template}
                onValueChange={(value) => updateSetting('template', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={data.language}
                onValueChange={(value) => updateSetting('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sv">Swedish</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="no">Norwegian</SelectItem>
                  <SelectItem value="da">Danish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Color Theme</Label>
              <Select
                value={data.theme}
                onValueChange={(value) => updateSetting('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorScheme">Custom Color</Label>
              <Input
                id="colorScheme"
                type="color"
                value={data.colorScheme}
                onChange={(e) => updateSetting('colorScheme', e.target.value)}
                className="h-10 w-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formatting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Formatting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={data.fontSize}
                onValueChange={(value) => updateSetting('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="margins">Page Margins</Label>
              <Select
                value={data.margins}
                onValueChange={(value) => updateSetting('margins', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select margins" />
                </SelectTrigger>
                <SelectContent>
                  {marginSizes.map((margin) => (
                    <SelectItem key={margin.value} value={margin.value}>
                      {margin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showPhoto">Include Profile Photo</Label>
              <p className="text-sm text-muted-foreground">
                Show your profile photo on the CV
              </p>
            </div>
            <div className="flex items-center gap-3">
              {data.showPhoto && profilePhoto && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profilePhoto} alt="Profile preview" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <Switch
                id="showPhoto"
                checked={data.showPhoto}
                onCheckedChange={(checked) => updateSetting('showPhoto', checked)}
              />
            </div>
          </div>

          {data.showPhoto && !profilePhoto && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ No profile photo uploaded. Go to the Personal Info tab to add a photo.
              </p>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showReferences">Include References Section</Label>
              <p className="text-sm text-muted-foreground">
                Add a references section to your CV
              </p>
            </div>
            <Switch
              id="showReferences"
              checked={data.showReferences}
              onCheckedChange={(checked) => updateSetting('showReferences', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Preview Changes</h4>
              <p className="text-sm text-muted-foreground">
                Your changes will be reflected when you generate the CV. Use the preview function to see how your CV will look with these settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}