import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Award, 
  Calendar, 
  Star, 
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  TrendingUp,
  BookOpen,
  Target
} from 'lucide-react'
import { EnhancedCertification } from '../../hooks/useEnhancedEducation'
import { format } from 'date-fns'

interface EnhancedCertificationCardProps {
  certification: EnhancedCertification
  onEdit: (certification: EnhancedCertification) => void
  onDelete: (id: string) => void
  onToggleFeatured: (id: string) => void
}

export function EnhancedCertificationCard({ 
  certification, 
  onEdit, 
  onDelete, 
  onToggleFeatured 
}: EnhancedCertificationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
  }

  const getCertificationTypeColor = (type?: string) => {
    switch (type) {
      case 'Professional': return 'bg-blue-100 text-blue-800'
      case 'Technical': return 'bg-green-100 text-green-800'
      case 'Academic': return 'bg-purple-100 text-purple-800'
      case 'Vendor': return 'bg-orange-100 text-orange-800'
      case 'Industry': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'Expert': return 'bg-red-100 text-red-800'
      case 'Advanced': return 'bg-orange-100 text-orange-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Beginner': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Valid': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Permanent': return <Shield className="h-4 w-4 text-blue-500" />
      case 'Expiring Soon': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'Expired': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Valid': return 'bg-green-100 text-green-800'
      case 'Permanent': return 'bg-blue-100 text-blue-800'
      case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatExpiryInfo = () => {
    if (!certification.expiry_date) return 'No Expiration'
    
    if (certification.status === 'Expired') {
      return `Expired ${formatDate(certification.expiry_date)}`
    }
    
    if (certification.days_until_expiry !== undefined && certification.days_until_expiry !== null) {
      if (certification.days_until_expiry <= 30) {
        return `Expires in ${certification.days_until_expiry} days`
      } else if (certification.days_until_expiry <= 90) {
        return `Expires in ${Math.round(certification.days_until_expiry / 30)} months`
      }
    }
    
    return `Expires ${formatDate(certification.expiry_date)}`
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${certification.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">{certification.name}</CardTitle>
              {certification.is_featured && (
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              )}
            </div>
            
            <div className="space-y-2">
              {certification.issuing_organization && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{certification.issuing_organization}</span>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {certification.issue_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Issued {formatDate(certification.issue_date)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  {getStatusIcon(certification.status)}
                  <span>{formatExpiryInfo()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(certification.status)}>
                  {certification.status || 'Unknown'}
                </Badge>
                
                {certification.certification_type && (
                  <Badge className={getCertificationTypeColor(certification.certification_type)}>
                    {certification.certification_type}
                  </Badge>
                )}

                {certification.difficulty_level && (
                  <Badge className={getDifficultyColor(certification.difficulty_level)}>
                    {certification.difficulty_level}
                  </Badge>
                )}

                {certification.verification_status === 'Verified' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFeatured(certification.id)}
              className={certification.is_featured ? 'text-yellow-500' : 'text-gray-400'}
            >
              <Star className={`h-4 w-4 ${certification.is_featured ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(certification)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(certification.id)}
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
          {certification.exam_score && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-medium">{certification.exam_score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          )}
          
          {certification.study_hours && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-medium">{certification.study_hours}h</div>
              <div className="text-xs text-gray-500">Study Time</div>
            </div>
          )}
          
          {certification.continuing_education_units && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-sm font-medium">{certification.continuing_education_units}</div>
              <div className="text-xs text-gray-500">CEUs</div>
            </div>
          )}
          
          {certification.cost && (
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-medium">
                {certification.cost.toLocaleString()} {certification.currency}
              </div>
              <div className="text-xs text-gray-500">Cost</div>
            </div>
          )}
        </div>

        {/* Description */}
        {certification.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {expanded 
                ? certification.description 
                : `${certification.description.substring(0, 200)}${certification.description.length > 200 ? '...' : ''}`
              }
            </p>
            {certification.description.length > 200 && (
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

        {/* Skills Validated */}
        {certification.skills_validated && certification.skills_validated.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Validated</h4>
            <div className="flex flex-wrap gap-1">
              {certification.skills_validated.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {certification.prerequisites && certification.prerequisites.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prerequisites</h4>
            <ul className="space-y-1">
              {certification.prerequisites.map((prereq, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <BookOpen className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Credential Information */}
        {(certification.credential_id || certification.credential_url) && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Credential Information</h4>
            <div className="space-y-2">
              {certification.credential_id && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {certification.credential_id}
                </p>
              )}
              {certification.credential_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={certification.credential_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Credential
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Renewal Information */}
        {certification.renewal_required && (
          <div className="mb-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Renewal Required</p>
                <p className="text-xs text-yellow-600">This certification requires periodic renewal</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for expiring/expired certificates */}
        {(certification.status === 'Expiring Soon' || certification.status === 'Expired') && (
          <div className="mb-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              certification.status === 'Expired' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              {certification.status === 'Expired' ? 
                <XCircle className="h-5 w-5 text-red-600" /> : 
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              }
              <div>
                <p className={`text-sm font-medium ${
                  certification.status === 'Expired' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {certification.status === 'Expired' ? 'Certification Expired' : 'Expiring Soon'}
                </p>
                <p className={`text-xs ${
                  certification.status === 'Expired' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {certification.status === 'Expired' ? 
                    'This certification has expired and may need renewal' : 
                    'Consider renewing this certification soon'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
