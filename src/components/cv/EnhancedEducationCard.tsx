import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  GraduationCap, 
  Calendar, 
  Star, 
  Globe,
  Edit,
  Trash2,
  Award,
  BookOpen,
  Clock,
  MapPin,
  ExternalLink,
  FileText,
  Users
} from 'lucide-react'
import { EnhancedEducation } from '../../hooks/useEnhancedEducation'
import { format } from 'date-fns'

interface EnhancedEducationCardProps {
  education: EnhancedEducation
  onEdit: (education: EnhancedEducation) => void
  onDelete: (id: string) => void
  onToggleFeatured: (id: string) => void
}

export function EnhancedEducationCard({ 
  education, 
  onEdit, 
  onDelete, 
  onToggleFeatured 
}: EnhancedEducationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
  }

  const getEducationLevelColor = (level?: string) => {
    switch (level) {
      case 'PhD': return 'bg-purple-100 text-purple-800'
      case 'Master': return 'bg-blue-100 text-blue-800'
      case 'Bachelor': return 'bg-green-100 text-green-800'
      case 'Certificate': return 'bg-orange-100 text-orange-800'
      case 'Diploma': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEducationTypeIcon = (type?: string) => {
    switch (type) {
      case 'University': return '🎓'
      case 'Course': return '📚'
      case 'Bootcamp': return '💻'
      case 'Online': return '🌐'
      case 'Workshop': return '🛠️'
      case 'Conference': return '🎪'
      default: return '📖'
    }
  }

  const calculateDuration = () => {
    if (!education.duration_months) return null
    
    const months = education.duration_months
    if (months < 12) {
      return `${Math.round(months)} month${Math.round(months) !== 1 ? 's' : ''}`
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = Math.round(months % 12)
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${education.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">{education.degree}</CardTitle>
              {education.is_featured && (
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              )}
              {education.is_current && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Current
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg">{getEducationTypeIcon(education.education_type)}</span>
                <span className="font-medium">{education.institution_name}</span>
                {education.institution_country && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {education.institution_country}
                  </Badge>
                )}
              </div>
              
              {education.field_of_study && (
                <p className="text-sm text-gray-600">
                  Field of Study: <span className="font-medium">{education.field_of_study}</span>
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {education.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(education.start_date)} - {education.end_date && !education.is_current ? formatDate(education.end_date) : 'Present'}
                    </span>
                  </div>
                )}
                
                {calculateDuration() && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{calculateDuration()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {education.education_level && (
                  <Badge className={getEducationLevelColor(education.education_level)}>
                    {education.education_level}
                  </Badge>
                )}
                
                {education.education_type && (
                  <Badge variant="outline">
                    {education.education_type}
                  </Badge>
                )}

                {education.status && (
                  <Badge variant="secondary">
                    {education.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFeatured(education.id)}
              className={education.is_featured ? 'text-yellow-500' : 'text-gray-400'}
            >
              <Star className={`h-4 w-4 ${education.is_featured ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(education)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(education.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {education.grade && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Award className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-medium">{education.grade}</div>
              <div className="text-xs text-gray-500">Grade</div>
            </div>
          )}
          
          {education.credits && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <BookOpen className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-medium">{education.credits}</div>
              <div className="text-xs text-gray-500">Credits</div>
            </div>
          )}
          
          {education.skills_acquired && education.skills_acquired.length > 0 && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-sm font-medium">{education.skills_acquired.length}</div>
              <div className="text-xs text-gray-500">Skills</div>
            </div>
          )}
          
          {education.courses_completed && education.courses_completed.length > 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-medium">{education.courses_completed.length}</div>
              <div className="text-xs text-gray-500">Courses</div>
            </div>
          )}
        </div>

        {/* Description */}
        {education.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {expanded 
                ? education.description 
                : `${education.description.substring(0, 200)}${education.description.length > 200 ? '...' : ''}`
              }
            </p>
            {education.description.length > 200 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        )}

        {/* Thesis Information */}
        {education.thesis_title && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Thesis</h4>
            <div className="space-y-1">
              <p className="text-sm font-medium">{education.thesis_title}</p>
              {education.thesis_description && (
                <p className="text-sm text-gray-600">{education.thesis_description}</p>
              )}
              {education.advisor_name && (
                <p className="text-xs text-gray-500">Advisor: {education.advisor_name}</p>
              )}
            </div>
          </div>
        )}

        {/* Skills Acquired */}
        {education.skills_acquired && education.skills_acquired.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Acquired</h4>
            <div className="flex flex-wrap gap-1">
              {education.skills_acquired.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Courses Completed */}
        {education.courses_completed && education.courses_completed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notable Courses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {education.courses_completed.map((course, index) => (
                <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <BookOpen className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                  <span>{course}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honors and Awards */}
        {education.honors_awards && education.honors_awards.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Honors & Awards</h4>
            <ul className="space-y-1">
              {education.honors_awards.map((honor, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Award className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                  <span>{honor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Institution Website */}
        {education.institution_website && (
          <div className="flex justify-start">
            <Button variant="outline" size="sm" asChild>
              <a href={education.institution_website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-1" />
                Institution Website
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
