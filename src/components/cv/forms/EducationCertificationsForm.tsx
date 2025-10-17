import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, GraduationCap, Award, BookOpen } from 'lucide-react';
import { CVEducationItem, CVCertificationItem, CVCourseItem } from '@/types/cvGeneration';

interface EducationCertificationsFormProps {
  educationData: CVEducationItem[];
  certificationsData: CVCertificationItem[];
  coursesData: CVCourseItem[];
  onEducationChange: (data: CVEducationItem[]) => void;
  onCertificationsChange: (data: CVCertificationItem[]) => void;
  onCoursesChange: (data: CVCourseItem[]) => void;
}

export function EducationCertificationsForm({ 
  educationData, 
  certificationsData, 
  coursesData,
  onEducationChange, 
  onCertificationsChange,
  onCoursesChange 
}: EducationCertificationsFormProps) {
  const [activeSubTab, setActiveSubTab] = useState('education');

  // Ensure arrays are always defined with fallbacks
  const safeEducationData = educationData || [];
  const safeCertificationsData = certificationsData || [];
  const safeCoursesData = coursesData || [];

  // Education handlers
  const addEducation = () => {
    const newEducation: CVEducationItem = {
      institution: '',
      degree: '',
      field: '',
      period: '',
      gpa: ''
    };
    onEducationChange([...safeEducationData, newEducation]);
  };

  const removeEducation = (index: number) => {
    const updated = safeEducationData.filter((_, i) => i !== index);
    onEducationChange(updated);
  };

  const updateEducation = (index: number, field: keyof CVEducationItem, value: string | string[]) => {
    const updated = safeEducationData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onEducationChange(updated);
  };

  // Certification handlers
  const addCertification = () => {
    const newCertification: CVCertificationItem = {
      name: '',
      issuer: '',
      date: '',
      credentialId: ''
    };
    onCertificationsChange([...safeCertificationsData, newCertification]);
  };

  const removeCertification = (index: number) => {
    const updated = safeCertificationsData.filter((_, i) => i !== index);
    onCertificationsChange(updated);
  };

  const updateCertification = (index: number, field: keyof CVCertificationItem, value: string) => {
    const updated = safeCertificationsData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onCertificationsChange(updated);
  };

  // Course handlers
  const addCourse = () => {
    const newCourse: CVCourseItem = {
      name: '',
      provider: '',
      completionDate: '',
      duration: '',
      credentialId: '',
      url: ''
    };
    onCoursesChange([...safeCoursesData, newCourse]);
  };

  const removeCourse = (index: number) => {
    const updated = safeCoursesData.filter((_, i) => i !== index);
    onCoursesChange(updated);
  };

  const updateCourse = (index: number, field: keyof CVCourseItem, value: string) => {
    const updated = safeCoursesData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onCoursesChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Education</h2>
        <p className="text-muted-foreground">
          Add your educational background, professional certifications, and courses
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="education" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="certifications" className="gap-2">
            <Award className="h-4 w-4" />
            Certifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="education" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Education</h3>
              <p className="text-sm text-muted-foreground">Your academic qualifications</p>
            </div>
            <Button onClick={addEducation} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Education
            </Button>
          </div>

          {safeEducationData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No education added</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start by adding your educational background
                </p>
                <Button onClick={addEducation} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Education
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {safeEducationData.map((education, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`institution-${index}`}>Institution *</Label>
                        <Input
                          id={`institution-${index}`}
                          placeholder="University name"
                          value={education.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`degree-${index}`}>Degree *</Label>
                        <Input
                          id={`degree-${index}`}
                          placeholder="e.g., Bachelor of Science"
                          value={education.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`field-${index}`}>Field of Study</Label>
                        <Input
                          id={`field-${index}`}
                          placeholder="e.g., Computer Science"
                          value={education.field}
                          onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`period-${index}`}>Period</Label>
                        <Input
                          id={`period-${index}`}
                          placeholder="e.g., 2018-2022"
                          value={education.period}
                          onChange={(e) => updateEducation(index, 'period', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`gpa-${index}`}>GPA (Optional)</Label>
                        <Input
                          id={`gpa-${index}`}
                          placeholder="e.g., 3.8/4.0"
                          value={education.gpa || ''}
                          onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`location-${index}`}>Location</Label>
                        <Input
                          id={`location-${index}`}
                          placeholder="e.g., Stockholm, Sweden"
                          value={education.location || ''}
                          onChange={(e) => updateEducation(index, 'location', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`honors-${index}`}>Academic Honors</Label>
                        <Input
                          id={`honors-${index}`}
                          placeholder="e.g., Magna Cum Laude, Dean's List (comma-separated)"
                          value={(education.honors || []).join(', ')}
                          onChange={(e) => updateEducation(index, 'honors', e.target.value.split(', ').filter(h => h.trim()))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Courses</h3>
              <p className="text-sm text-muted-foreground">Online courses and training programs</p>
            </div>
            <Button onClick={addCourse} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>

          {safeCoursesData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No courses added</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start by adding your first course or training program
                </p>
                <Button onClick={addCourse} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {safeCoursesData.map((course, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCourse(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`course-name-${index}`}>Course Name *</Label>
                        <Input
                          id={`course-name-${index}`}
                          placeholder="e.g., Advanced React Development"
                          value={course.name}
                          onChange={(e) => updateCourse(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-provider-${index}`}>Provider *</Label>
                        <Input
                          id={`course-provider-${index}`}
                          placeholder="e.g., Udemy, Coursera, LinkedIn Learning"
                          value={course.provider}
                          onChange={(e) => updateCourse(index, 'provider', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`course-completion-${index}`}>Completion Date</Label>
                        <Input
                          id={`course-completion-${index}`}
                          type="month"
                          value={course.completionDate}
                          onChange={(e) => updateCourse(index, 'completionDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-duration-${index}`}>Duration</Label>
                        <Input
                          id={`course-duration-${index}`}
                          placeholder="e.g., 40 hours, 6 weeks"
                          value={course.duration || ''}
                          onChange={(e) => updateCourse(index, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-status-${index}`}>Status</Label>
                        <select
                          id={`course-status-${index}`}
                          title="Course Status"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={course.status || 'completed'}
                          onChange={(e) => updateCourse(index, 'status', e.target.value)}
                        >
                          <option value="completed">Completed</option>
                          <option value="in-progress">In Progress</option>
                          <option value="audit">Audit</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`course-credential-${index}`}>Credential ID</Label>
                        <Input
                          id={`course-credential-${index}`}
                          placeholder="Certificate ID (optional)"
                          value={course.credentialId || ''}
                          onChange={(e) => updateCourse(index, 'credentialId', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-grade-${index}`}>Grade/Score</Label>
                        <Input
                          id={`course-grade-${index}`}
                          placeholder="e.g., A+, 95%, Pass"
                          value={course.grade || ''}
                          onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-url-${index}`}>Certificate URL</Label>
                        <Input
                          id={`course-url-${index}`}
                          type="url"
                          placeholder="https://..."
                          value={course.url || ''}
                          onChange={(e) => updateCourse(index, 'url', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Certifications</h3>
              <p className="text-sm text-muted-foreground">Professional certifications and licenses</p>
            </div>
            <Button onClick={addCertification} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Certification
            </Button>
          </div>

          {safeCertificationsData.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No certifications added</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start by adding your first professional certification
                </p>
                <Button onClick={addCertification} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Certification
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {safeCertificationsData.map((certification, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certification {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`cert-name-${index}`}>Certification Name *</Label>
                        <Input
                          id={`cert-name-${index}`}
                          placeholder="e.g., AWS Certified Solutions Architect"
                          value={certification.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`cert-issuer-${index}`}>Issuing Organization *</Label>
                        <Input
                          id={`cert-issuer-${index}`}
                          placeholder="e.g., Amazon Web Services"
                          value={certification.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`cert-date-${index}`}>Issue Date</Label>
                        <Input
                          id={`cert-date-${index}`}
                          type="month"
                          value={certification.date}
                          onChange={(e) => updateCertification(index, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`cert-expiration-${index}`}>Expiration Date</Label>
                        <Input
                          id={`cert-expiration-${index}`}
                          type="month"
                          placeholder="Leave empty if no expiration"
                          value={certification.expirationDate || ''}
                          onChange={(e) => updateCertification(index, 'expirationDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`cert-credential-${index}`}>Credential ID</Label>
                        <Input
                          id={`cert-credential-${index}`}
                          placeholder="Certification ID (optional)"
                          value={certification.credentialId || ''}
                          onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`cert-url-${index}`}>Credential URL</Label>
                        <Input
                          id={`cert-url-${index}`}
                          placeholder="https://..."
                          value={certification.url || ''}
                          onChange={(e) => updateCertification(index, 'url', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}