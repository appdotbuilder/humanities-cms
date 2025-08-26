import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Plus, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { RichTextEditor } from './RichTextEditor';

// Import types  
import type { 
  Project,
  CreateProjectInput,
  UpdateProjectInput
} from '../../../server/src/schema';

interface ProjectEditorProps {
  project?: Project | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProjectEditor({ project, onClose, onSave }: ProjectEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTech, setNewTech] = useState('');
  const [formData, setFormData] = useState({
    title: project?.title || '',
    slug: project?.slug || '',
    description: project?.description || '',
    content: project?.content || '',
    project_url: project?.project_url || '',
    github_url: project?.github_url || '',
    technologies: project?.technologies || [],
    status: project?.status || 'draft' as const,
    start_date: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    end_date: project?.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
    sort_order: project?.sort_order || 0
  });

  // Auto-generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: project ? prev.slug : generateSlug(title)
    }));
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (project) {
        // Update existing project
        const updateData: UpdateProjectInput = {
          id: project.id,
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          content: formData.content || null,
          project_url: formData.project_url || null,
          github_url: formData.github_url || null,
          technologies: formData.technologies,
          status: formData.status,
          start_date: formData.start_date ? new Date(formData.start_date) : null,
          end_date: formData.end_date ? new Date(formData.end_date) : null,
          sort_order: formData.sort_order
        };
        await trpc.updateProject.mutate(updateData);
      } else {
        // Create new project
        const createData: CreateProjectInput = {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          content: formData.content || null,
          featured_image_id: null,
          project_url: formData.project_url || null,
          github_url: formData.github_url || null,
          technologies: formData.technologies,
          status: formData.status,
          start_date: formData.start_date ? new Date(formData.start_date) : null,
          end_date: formData.end_date ? new Date(formData.end_date) : null,
          sort_order: formData.sort_order
        };
        await trpc.createProject.mutate(createData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {project ? 'Edit Project' : 'New Project'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              type="button"
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Project'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Project Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter your project title..."
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-sm font-medium">
                  URL Slug *
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-version"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the URL: /projects/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your project..."
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-sm font-medium">
                  Detailed Content
                </Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Write detailed project information here..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detailed project information, methodology, results, etc.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="project_url" className="text-sm font-medium">
                    Project URL
                  </Label>
                  <Input
                    id="project_url"
                    type="url"
                    value={formData.project_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="github_url" className="text-sm font-medium">
                    GitHub URL
                  </Label>
                  <Input
                    id="github_url"
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Technologies Used</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Add technology (e.g., React, Python, etc.)"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTechnology();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTechnology}
                      disabled={!newTech.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.technologies.map((tech, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}