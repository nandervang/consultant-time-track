import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Star, 
  Users, 
  DollarSign,
  Building,
  Clock,
  Edit,
  Trash2,
  Award,
  TrendingUp
} from 'lucide-react'
import { EnhancedExperience } from '../../hooks/useEnhancedCV'
import { format } from 'date-fns'

interface EnhancedExperienceCardProps {
  experience: EnhancedExperience
  onEdit: (experience: EnhancedExperience) => void
  onDelete: (id: string) => void
  onAddAchievement: (experienceId: string) => void
}

export function EnhancedExperienceCard({ 
  experience, 
  onEdit, 
  onDelete, 
  onAddAchievement 
}: EnhancedExperienceCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
  }

  const calculateDuration = () => {
    const start = new Date(experience.start_date)
    const end = experience.end_date ? new Date(experience.end_date) : new Date()
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
    }
  }

  const getEmploymentTypeColor = (type?: string) => {
    switch (type) {
      case 'Full-time': return 'bg-blue-100 text-blue-800'
      case 'Consulting': return 'bg-purple-100 text-purple-800'
      case 'Freelance': return 'bg-green-100 text-green-800'
      case 'Contract': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompanySizeIcon = (size?: string) => {
    switch (size) {
      case 'Startup': return '🚀'
      case 'SME': return '🏢'
      case 'Enterprise': return '🏛️'
      case 'Government': return '🏛️'
      default: return '🏢'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">{experience.role_title}</CardTitle>
              {experience.is_current && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Current
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span className="font-medium">{experience.company_name}</span>
                {experience.company_size && (
                  <>
                    <span className="text-lg">{getCompanySizeIcon(experience.company_size)}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {experience.company_size}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Present'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{calculateDuration()}</span>
                </div>
                
                {experience.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{experience.location}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {experience.employment_type && (
                  <Badge className={getEmploymentTypeColor(experience.employment_type)}>
                    {experience.employment_type}
                  </Badge>
                )}
                
                {experience.company_industry && (
                  <Badge variant="outline">
                    {experience.company_industry}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(experience)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(experience.id)}
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
          {experience.team_size && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-medium">{experience.team_size}</div>
              <div className="text-xs text-gray-500">Team Size</div>
            </div>
          )}
          
          {experience.budget_responsibility && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-medium">
                {experience.budget_responsibility.toLocaleString()} {experience.currency}
              </div>
              <div className="text-xs text-gray-500">Budget</div>
            </div>
          )}
          
          {experience.achievement_count && experience.achievement_count > 0 && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-sm font-medium">{experience.achievement_count}</div>
              <div className="text-xs text-gray-500">Achievements</div>
            </div>
          )}
          
          {experience.technology_names && experience.technology_names.length > 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-medium">{experience.technology_names.length}</div>
              <div className="text-xs text-gray-500">Technologies</div>
            </div>
          )}
        </div>

        {/* Description */}
        {experience.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {expanded 
                ? experience.description 
                : `${experience.description.substring(0, 200)}${experience.description.length > 200 ? '...' : ''}`
              }
            </p>
            {experience.description.length > 200 && (
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

        {/* Reporting Structure */}
        {experience.reporting_to && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reporting Structure</h4>
            <p className="text-sm text-gray-600">Reports to: {experience.reporting_to}</p>
          </div>
        )}

        {/* Technologies */}
        {experience.technology_names && experience.technology_names.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {experience.technology_names.map((tech, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Skills (if no technology_names) */}
        {(!experience.technology_names || experience.technology_names.length === 0) && 
         experience.skills_used && experience.skills_used.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Used</h4>
            <div className="flex flex-wrap gap-1">
              {experience.skills_used.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {experience.achievements_titles && experience.achievements_titles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Key Achievements</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAchievement(experience.id)}
              >
                <Award className="h-4 w-4 mr-1" />
                Add Achievement
              </Button>
            </div>
            <ul className="space-y-1">
              {experience.achievements_titles.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legacy Achievements (if no achievements_titles) */}
        {(!experience.achievements_titles || experience.achievements_titles.length === 0) && 
         experience.achievements && experience.achievements.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Achievements</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAchievement(experience.id)}
              >
                <Award className="h-4 w-4 mr-1" />
                Add Achievement
              </Button>
            </div>
            <ul className="space-y-1">
              {experience.achievements.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action to add achievement if none exist */}
        {(!experience.achievements_titles || experience.achievements_titles.length === 0) &&
         (!experience.achievements || experience.achievements.length === 0) && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={() => onAddAchievement(experience.id)}
            >
              <Award className="h-4 w-4 mr-2" />
              Add First Achievement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
