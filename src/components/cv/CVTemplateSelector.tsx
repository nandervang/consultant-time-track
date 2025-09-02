import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor, 
  FileText, 
  Palette, 
  Code, 
  GraduationCap,
  Building,
  Briefcase,
  Star,
  Crown,
  Eye,
  Download
} from 'lucide-react'
import { CVTemplate } from '@/hooks/useCVGeneration'

interface CVTemplateSelectorProps {
  templates: CVTemplate[]
  selectedTemplate: CVTemplate | null
  onSelectTemplate: (template: CVTemplate) => void
  onPreviewTemplate?: (template: CVTemplate) => void
  loading?: boolean
}

const TEMPLATE_TYPE_ICONS = {
  modern: Monitor,
  classic: FileText,
  creative: Palette,
  technical: Code,
  academic: GraduationCap
}

const INDUSTRY_ICONS = {
  tech: Code,
  consulting: Building,
  creative: Palette,
  academic: GraduationCap,
  general: Briefcase
}

const TEMPLATE_TYPE_DESCRIPTIONS = {
  modern: 'Clean, contemporary designs perfect for tech and startup roles',
  classic: 'Traditional, professional layouts for corporate and executive positions',
  creative: 'Vibrant, artistic designs for creative and design roles',
  technical: 'Code-focused layouts emphasizing technical skills and projects',
  academic: 'Research-oriented formats for academic and scientific positions'
}

export function CVTemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onPreviewTemplate,
  loading = false
}: CVTemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const templateTypes = [...new Set(templates.map(t => t.template_type))]
  const industries = [...new Set(templates.map(t => t.industry_focus))]

  const getFilteredTemplates = () => {
    if (activeTab === 'all') return templates
    if (templateTypes.includes(activeTab)) {
      return templates.filter(t => t.template_type === activeTab)
    }
    if (industries.includes(activeTab)) {
      return templates.filter(t => t.industry_focus === activeTab)
    }
    return templates
  }

  const TemplateCard = ({ template }: { template: CVTemplate }) => {
    const TypeIcon = TEMPLATE_TYPE_ICONS[template.template_type as keyof typeof TEMPLATE_TYPE_ICONS] || FileText
    const IndustryIcon = INDUSTRY_ICONS[template.industry_focus as keyof typeof INDUSTRY_ICONS] || Briefcase
    const isSelected = selectedTemplate?.id === template.id

    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
        }`}
        onClick={() => onSelectTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {template.is_premium && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
              {isSelected && (
                <Star className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Template Preview Placeholder */}
          <div className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            {template.preview_image_url ? (
              <img 
                src={template.preview_image_url} 
                alt={`${template.name} preview`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Preview not available</p>
              </div>
            )}
          </div>

          {/* Template Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {template.template_type}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <IndustryIcon className="h-3 w-3" />
              {template.industry_focus}
            </Badge>
            {template.is_premium && (
              <Badge variant="default" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>

          {/* Template Configuration Preview */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <strong>Sections:</strong> {template.sections_config.sections?.join(', ') || 'Standard'}
            </div>
            <div>
              <strong>Emphasis:</strong> {template.sections_config.emphasis || 'Balanced'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onPreviewTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreviewTemplate(template)
                }}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            )}
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelectTemplate(template)
              }}
              className="flex-1"
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {templateTypes.map(type => {
            const Icon = TEMPLATE_TYPE_ICONS[type as keyof typeof TEMPLATE_TYPE_ICONS] || FileText
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="capitalize">{type}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Template Type Description */}
          {templateTypes.includes(activeTab) && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  {TEMPLATE_TYPE_DESCRIPTIONS[activeTab as keyof typeof TEMPLATE_TYPE_DESCRIPTIONS]}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredTemplates().length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                <p className="text-gray-500">
                  No templates available for the selected filter.
                </p>
              </div>
            ) : (
              getFilteredTemplates().map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="h-5 w-5" />
              Selected Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">{selectedTemplate.name}</h4>
                <p className="text-sm text-blue-600">{selectedTemplate.description}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSelectTemplate(selectedTemplate)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Generate CV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CVTemplateSelector
