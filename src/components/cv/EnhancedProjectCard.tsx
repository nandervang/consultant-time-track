import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  FolderOpen, 
  Calendar, 
  Star, 
  Users, 
  Clock,
  Edit,
  Trash2,
  Award,
  TrendingUp,
  Building,
  ExternalLink,
  Github,
  Eye,
  EyeOff,
  Target,
  Zap
} from 'lucide-react'
import { EnhancedProject } from '../../hooks/useEnhancedCV'
import { format } from 'date-fns'

interface EnhancedProjectCardProps {
  project: EnhancedProject
  onEdit: (project: EnhancedProject) => void
  onDelete: (id: string) => void
  onToggleFeatured: (id: string) => void
  onAddAchievement: (projectId: string) => void
}

export function EnhancedProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onToggleFeatured,
  onAddAchievement 
}: EnhancedProjectCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
  }

  const getProjectTypeColor = (type?: string) => {
    switch (type) {
      case 'Development': return 'bg-blue-100 text-blue-800'
      case 'Consulting': return 'bg-purple-100 text-purple-800'
      case 'Research': return 'bg-green-100 text-green-800'
      case 'Training': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Ongoing': return 'bg-blue-100 text-blue-800'
      case 'Paused': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (months?: number) => {
    if (!months) return null
    if (months < 1) return 'Less than 1 month'
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${project.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">{project.project_name}</CardTitle>
              {project.is_featured && (
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              )}
              {project.confidential && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <Eye className="h-3 w-3 mr-1" />
                  Confidential
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              {project.client_company && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{project.client_company}</span>
                  {project.client_industry && (
                    <Badge variant="outline" className="text-xs">
                      {project.client_industry}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
                  </span>
                </div>
                
                {project.duration_months && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(project.duration_months)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(project.project_status)}>
                  {project.project_status}
                </Badge>
                
                {project.project_type && (
                  <Badge className={getProjectTypeColor(project.project_type)}>
                    {project.project_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFeatured(project.id)}
              className={project.is_featured ? 'text-yellow-500' : 'text-gray-400'}
            >
              <Star className={`h-4 w-4 ${project.is_featured ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project.id)}
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
          {project.team_size && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-medium">{project.team_size}</div>
              <div className="text-xs text-gray-500">Team Size</div>
            </div>
          )}
          
          {project.budget_range && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-medium">{project.budget_range}</div>
              <div className="text-xs text-gray-500">Budget</div>
            </div>
          )}
          
          {project.achievement_count && project.achievement_count > 0 && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-sm font-medium">{project.achievement_count}</div>
              <div className="text-xs text-gray-500">Achievements</div>
            </div>
          )}
          
          {project.technology_names && project.technology_names.length > 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-medium">{project.technology_names.length}</div>
              <div className="text-xs text-gray-500">Technologies</div>
            </div>
          )}
        </div>

        {/* Description and Role */}
        <div className="space-y-3 mb-4">
          {project.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Project Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {expanded 
                  ? project.description 
                  : `${project.description.substring(0, 200)}${project.description.length > 200 ? '...' : ''}`
                }
              </p>
              {project.description.length > 200 && (
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

          {project.my_role && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">My Role</h4>
              <p className="text-sm text-gray-600">{project.my_role}</p>
            </div>
          )}
        </div>

        {/* Technologies */}
        {project.technology_names && project.technology_names.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Technologies Used</h4>
            <div className="flex flex-wrap gap-1">
              {project.technology_names.map((tech, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Technologies (if no technology_names) */}
        {(!project.technology_names || project.technology_names.length === 0) && 
         project.technologies_used && project.technologies_used.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Technologies Used</h4>
            <div className="flex flex-wrap gap-1">
              {project.technologies_used.map((tech, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Methodologies */}
        {project.methodologies_used && project.methodologies_used.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Methodologies</h4>
            <div className="flex flex-wrap gap-1">
              {project.methodologies_used.map((methodology, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                  {methodology}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        {project.challenges_overcome && project.challenges_overcome.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Challenges Overcome</h4>
            <ul className="space-y-1">
              {project.challenges_overcome.map((challenge, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Zap className="h-3 w-3 mt-1 text-orange-500 flex-shrink-0" />
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Achievements */}
        {project.achievements_titles && project.achievements_titles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Key Achievements</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAchievement(project.id)}
              >
                <Award className="h-4 w-4 mr-1" />
                Add Achievement
              </Button>
            </div>
            <ul className="space-y-1">
              {project.achievements_titles.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legacy Achievements (if no achievements_titles) */}
        {(!project.achievements_titles || project.achievements_titles.length === 0) && 
         project.achievements && project.achievements.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Achievements</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAchievement(project.id)}
              >
                <Award className="h-4 w-4 mr-1" />
                Add Achievement
              </Button>
            </div>
            <ul className="space-y-1">
              {project.achievements.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links */}
        {(project.project_url || project.repository_url) && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
            <div className="flex gap-2">
              {project.project_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Project
                  </a>
                </Button>
              )}
              {project.repository_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-1" />
                    Repository
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action to add achievement if none exist */}
        {(!project.achievements_titles || project.achievements_titles.length === 0) &&
         (!project.achievements || project.achievements.length === 0) && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={() => onAddAchievement(project.id)}
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
