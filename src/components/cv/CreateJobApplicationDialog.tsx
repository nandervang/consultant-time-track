import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useCVProfiles } from '@/hooks/useCVProfiles';
import { APPLICATION_STATUSES } from '@/types/cv';
import { Loader2 } from 'lucide-react';

interface CreateJobApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCvProfileId?: string;
}

export function CreateJobApplicationDialog({ 
  open, 
  onOpenChange, 
  defaultCvProfileId 
}: CreateJobApplicationDialogProps) {
  const { createApplication } = useJobApplications();
  const { profiles } = useCVProfiles();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cv_profile_id: defaultCvProfileId || '',
    company_name: '',
    job_title: '',
    job_url: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'applied' as const,
    cover_letter: '',
    job_highlights: '',
    custom_summary: '',
    interview_notes: '',
    follow_up_date: '',
    salary_range: '',
    location: '',
    remote_option: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cv_profile_id || !formData.company_name || !formData.job_title) {
      return;
    }

    setIsLoading(true);
    try {
      await createApplication({
        ...formData,
        follow_up_date: formData.follow_up_date || undefined,
      });
      
      // Reset form
      setFormData({
        cv_profile_id: defaultCvProfileId || '',
        company_name: '',
        job_title: '',
        job_url: '',
        application_date: new Date().toISOString().split('T')[0],
        status: 'applied' as const,
        cover_letter: '',
        job_highlights: '',
        custom_summary: '',
        interview_notes: '',
        follow_up_date: '',
        salary_range: '',
        location: '',
        remote_option: false,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Job Application</DialogTitle>
          <DialogDescription>
            Track a new job application and its details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CV Profile Selection */}
          <div className="space-y-2">
            <Label htmlFor="cv_profile_id">CV Profile *</Label>
            <select
              id="cv_profile_id"
              value={formData.cv_profile_id}
              onChange={(e) => updateField('cv_profile_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select CV profile"
              required
            >
              <option value="">Select a CV profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.title} {profile.target_role && `(${profile.target_role})`}
                </option>
              ))}
            </select>
          </div>

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => updateField('job_title', e.target.value)}
                placeholder="e.g. Senior Developer"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_url">Job Posting URL</Label>
            <Input
              id="job_url"
              type="url"
              value={formData.job_url}
              onChange={(e) => updateField('job_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Application Details */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="application_date">Application Date *</Label>
              <Input
                id="application_date"
                type="date"
                value={formData.application_date}
                onChange={(e) => updateField('application_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Application status"
              >
                {Object.entries(APPLICATION_STATUSES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => updateField('follow_up_date', e.target.value)}
              />
            </div>
          </div>

          {/* Location and Salary */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="e.g. Stockholm, Sweden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_range">Salary Range</Label>
              <Input
                id="salary_range"
                value={formData.salary_range}
                onChange={(e) => updateField('salary_range', e.target.value)}
                placeholder="e.g. 800,000 - 1,000,000 SEK"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote_option"
              checked={formData.remote_option}
              onCheckedChange={(checked) => updateField('remote_option', checked)}
            />
            <Label htmlFor="remote_option">Remote work option available</Label>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job_highlights">Job Highlights</Label>
              <Textarea
                id="job_highlights"
                value={formData.job_highlights}
                onChange={(e) => updateField('job_highlights', e.target.value)}
                placeholder="Key points about this job opportunity..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_summary">Custom Summary</Label>
              <Textarea
                id="custom_summary"
                value={formData.custom_summary}
                onChange={(e) => updateField('custom_summary', e.target.value)}
                placeholder="How you tailored your application for this role..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_letter">Cover Letter Notes</Label>
              <Textarea
                id="cover_letter"
                value={formData.cover_letter}
                onChange={(e) => updateField('cover_letter', e.target.value)}
                placeholder="Notes about your cover letter or key points mentioned..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview_notes">Interview Notes</Label>
              <Textarea
                id="interview_notes"
                value={formData.interview_notes}
                onChange={(e) => updateField('interview_notes', e.target.value)}
                placeholder="Interview details, questions asked, feedback received..."
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
