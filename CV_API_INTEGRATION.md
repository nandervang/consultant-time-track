# CV Generation API Integration

This document describes the CV Generation API integration added to the CV Editor system.

## Overview

The CV Generation API integration allows users to generate professional CVs in multiple formats (PDF, DOCX, HTML) using the external CV Generation API hosted on Netlify.

## Features

- ✅ **Multi-Format Generation**: Generate CVs in PDF, DOCX, and HTML formats
- ✅ **Andervang Consulting Template**: Uses the professional 'andervang-consulting' template with orange accent design
- ✅ **Data Transformation**: Automatically converts internal CV data structure to API payload format
- ✅ **Skills → Competencies Mapping**: Intelligent transformation of skill categories to proficiency-based competencies
- ✅ **Progress Indication**: Real-time progress tracking during generation
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Direct Download**: One-click download of generated CV files
- ✅ **No UI Changes**: All existing CV editor functionality remains unchanged

## Architecture

### New Files Created

1. **`src/types/cv-api-types.ts`** - API type definitions
   - Complete TypeScript interfaces for API payloads and responses
   - Defines `CVAPIPayload`, `CVAPIPersonalInfo`, `CVAPIEmployment`, `CVAPIProject`, etc.

2. **`src/utils/cv-data-transformer.ts`** - Data transformation logic
   - Converts internal CV data format to API payload format
   - Handles skills → competencies grouping
   - Date formatting helpers
   - Validation functions

3. **`src/services/cv-generation-api.ts`** - API client
   - Handles communication with CV Generation API
   - Health check endpoint
   - Single format generation
   - Multi-format generation
   - Download functionality
   - Timeout handling (45s for single, 67.5s for multi-format)

4. **`src/components/cv/CVGenerationDialog.tsx`** - Generation dialog UI
   - Format selection (PDF/DOCX/HTML)
   - Progress indicator
   - Results display with download buttons
   - Error handling

### Modified Files

1. **`src/components/cv/CVEditorModal.tsx`**
   - Added "Generate CV" button in header
   - Added state for generation dialog
   - Imported and integrated CVGenerationDialog component

2. **`.env.example`**
   - Already contains CV API configuration variables

## Data Transformation

### Skills to Competencies

The transformer intelligently groups skills by proficiency level:

**Input (Skills by Category):**
```typescript
skills: [
  { category: "Frontend Development", items: ["React", "TypeScript"] },
  { category: "Backend Development", items: ["Node.js", "Python"] }
]
```

**Output (Competencies by Proficiency):**
```typescript
competencies: [
  {
    category: "Expert inom området",
    skills: [
      { name: "React", level: "expert" },
      { name: "TypeScript", level: "expert" }
    ]
  }
]
```

### Personal Info Mapping

- `name` → `personalInfo.name`
- `title` → `personalInfo.title`
- `email` → `personalInfo.email`
- `phone` → `personalInfo.phone`
- `location` → `personalInfo.location`
- `profilePhoto` → `personalInfo.profileImage`

### Summary Transformation

- `introduction` → `summary.introduction`
- `keyStrengths[]` → `summary.highlights[]`

### Experience Mapping

- `experience[]` → `employment[]`
- Direct mapping with all fields (period, position, company, description, technologies, achievements)

### Projects Enhancement

Projects are enhanced with additional fields required by API:
- Added `period` field (default: "Projektperiod")
- Added `type` field (default: "Utvecklare")

## API Configuration

### Environment Variables

Add to your `.env.local` file:

```bash
# CV Generation API Configuration
REACT_APP_CV_API_URL=https://andervang-cv.netlify.app
REACT_APP_CV_API_KEY=your-api-key-here  # If required
```

Or for Vite projects:

```bash
VITE_CV_API_URL=https://andervang-cv.netlify.app
VITE_CV_API_KEY=your-api-key-here  # If required
```

The API client automatically falls back to the default URL if not configured.

### API Endpoints

1. **Health Check**
   - Endpoint: `/.netlify/functions/health`
   - Method: `GET`
   - Purpose: Verify API availability

2. **Single Format Generation**
   - Endpoint: `/.netlify/functions/generate-cv`
   - Method: `POST`
   - Timeout: 45 seconds
   - Body: `CVAPIPayload` with `format` field

3. **Multi-Format Generation**
   - Endpoint: `/.netlify/functions/generate-multi-cv`
   - Method: `POST`
   - Timeout: 67.5 seconds
   - Body: `CVAPIPayload` with `formats[]` array

## Usage

### For End Users

1. Open the CV Editor
2. Fill in your CV data or click "Load Sample Data"
3. Click the blue **"Generate CV"** button in the header
4. Select desired formats (PDF, DOCX, HTML)
5. Click **"Generate CV"**
6. Wait for generation to complete
7. Click **"Download"** for each successful format

### For Developers

#### Transform CV Data

```typescript
import { transformToAPIPayload } from '@/utils/cv-data-transformer';

const apiPayload = transformToAPIPayload(cvData, {
  format: 'pdf',
  template: 'andervang-consulting',
  company: 'Frank Digital AB'
});
```

#### Generate Single Format

```typescript
import { generateSingleFormatCV } from '@/services/cv-generation-api';

const response = await generateSingleFormatCV(apiPayload);
if (response.success) {
  console.log('File URL:', response.data.fileUrl);
}
```

#### Generate Multiple Formats

```typescript
import { generateMultipleFormats } from '@/services/cv-generation-api';

const { format, ...basePayload } = apiPayload;
const results = await generateMultipleFormats(basePayload, ['pdf', 'docx', 'html']);

Object.entries(results).forEach(([format, response]) => {
  if (response.success) {
    console.log(`${format}: ${response.data.fileUrl}`);
  }
});
```

#### Check API Health

```typescript
import { checkAPIHealth } from '@/services/cv-generation-api';

const isAvailable = await checkAPIHealth();
console.log('API available:', isAvailable);
```

## Error Handling

### Timeout Handling

- Single format: 45 seconds timeout
- Multi-format: 67.5 seconds timeout
- User-friendly error message: "CV generation timed out. Please try again."

### Network Errors

All network errors are caught and displayed to the user with clear messages.

### Validation Errors

Before sending to API, the payload is validated:
- Required fields: name, title, email
- Valid formats: pdf, docx, html
- Valid templates: andervang-consulting, modern, classic

## Template Styling

The 'andervang-consulting' template uses:
- **Primary Color**: #003D82 (Dark Blue)
- **Accent Color**: #FF6B35 (Orange)
- **Font Size**: small, medium, large
- **Spacing**: compact, normal, relaxed

Styling is automatically applied from `cvData.templateSettings`.

## Testing

### Manual Testing Steps

1. **Basic Generation**
   - Load sample data
   - Generate PDF
   - Verify download

2. **Multi-Format Generation**
   - Select all formats
   - Generate
   - Verify all downloads

3. **Error Handling**
   - Test with invalid data
   - Test with network offline
   - Verify error messages

4. **Timeout Handling**
   - Monitor generation time
   - Verify timeout message appears

### API Health Check

Run in browser console:
```javascript
import('@/services/cv-generation-api').then(api => {
  api.checkAPIHealth().then(health => console.log('Health:', health));
});
```

## Troubleshooting

### "CV Generation API is not available"

- Check `.env.local` has correct `REACT_APP_CV_API_URL`
- Verify API endpoint is accessible
- Check network connection

### "CV generation timed out"

- Serverless functions have time limits
- Try generating fewer formats at once
- Check API logs for performance issues

### "Some formats failed"

- Check individual error messages
- Some formats may have specific requirements
- Verify all required data is present

## Future Enhancements

Potential improvements:

1. **Template Selection**: Allow users to choose from multiple templates
2. **Custom Styling**: Let users customize colors and fonts
3. **Preview**: Show CV preview before generation
4. **Version History**: Track generated CV versions
5. **Batch Generation**: Generate CVs for multiple people
6. **API Key Support**: Add authentication if required
7. **Retry Logic**: Automatic retry on transient failures
8. **Caching**: Cache generated CVs for quick re-downloads

## Dependencies

- **React**: UI components
- **TypeScript**: Type safety
- **ShadCN UI**: Dialog, Button, Checkbox, Progress components
- **Lucide React**: Icons

## License

Part of the Consultant Time Track application.

## Support

For issues or questions about the CV Generation API integration:
1. Check this documentation
2. Review error messages in browser console
3. Check API logs on Netlify
4. Contact API maintainer

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
