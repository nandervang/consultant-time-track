import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, BookOpen } from 'lucide-react';
import { CVCourseItem } from '@/types/cvGeneration';

interface CoursesFormProps {
  data: CVCourseItem[];
  onChange: (data: CVCourseItem[]) => void;
}

export function CoursesForm({ data, onChange }: CoursesFormProps) {
  const addCourse = () => {
    const newCourse: CVCourseItem = {
      name: '',
      provider: '',
      completionDate: '',
      duration: '',
      credentialId: '',
      url: '',
      status: 'completed',
      grade: ''
    };
    onChange([...data, newCourse]);
  };

  const removeCourse = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateCourse = (index: number, field: keyof CVCourseItem, value: string) => {
    const updated = data.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">
            Add online courses, training programs, and professional development
          </p>
        </div>
        <Button onClick={addCourse} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {data.length === 0 ? (
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
          {data.map((course, index) => (
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
                    <Label htmlFor={`course-credential-${index}`}>Credential ID</Label>
                    <Input
                      id={`course-credential-${index}`}
                      placeholder="Certificate ID (optional)"
                      value={course.credentialId || ''}
                      onChange={(e) => updateCourse(index, 'credentialId', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`course-status-${index}`}>Status</Label>
                    <Select
                      value={course.status || 'completed'}
                      onValueChange={(value) => updateCourse(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="audit">Audit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`course-grade-${index}`}>Grade (optional)</Label>
                    <Input
                      id={`course-grade-${index}`}
                      placeholder="e.g., A, Pass, 95%"
                      value={course.grade || ''}
                      onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                    />
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}