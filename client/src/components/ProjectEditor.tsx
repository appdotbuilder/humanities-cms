import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Image,
  Plus,
  X,
  ExternalLink,
  Github,
  Calendar
} from 'lucide-react';

import type { 
  Project, 
  CreateProjectInput, 
  UpdateProjectInput,
  Media,
  SeoMetadata,
  SocialSharingSettings
} from '../../../server/src/schema';

import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaPicker } from '@/components/MediaPicker';
import { SeoEditor } from '@/components/SeoEditor';
import { SocialSharingEditor } from '@/components/SocialSharingEditor';

interface ProjectEditorProps {
  project?: Project | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProjectEditor({ project, onClose, onSave }: ProjectEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [newTechnology, setNewTechnology] = useState('');
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    slug: '',
    description: '',
    content: null,
    featured_image_id: null,
    project_url: null,
    github_url: null,
    technologies: [],
    status: 'draft',
    start_date: null,
    end_date: null,
    sort_order: 0
  });

  const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
  const [seoData, setSeoData] = useState<SeoMetadata | null>(null);
  const [socialSettings, setSocialSettings] = useState<SocialSharingSettings | null>(null);

  // Load existing data
  const loadData = useCallback(async () => {
    if (project) {
      setFormData({
        title: project.title,
        slug: project.slug,
        description: project.description,
        content: project.content,
        featured_image_id: project.featured_image_id,
        project_url: project.project_url,
        github_url: project.github_url,
        technologies: project.technologies,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        sort_order: project.sort_order
      });

      // Load featured image
      if (project.featured_image_id) {
        try {
          const image = await trpc.getMediaById.query({ id: project.featured_image_id });
          setFeaturedImage(image);
        } catch (error) {
          console.error('Failed to load featured image:', error);
        }
      }

      // Load SEO data
      try {
        const seo = await trpc.getSeoMetadata.query({
          contentType: 'project',
          contentId: project.id
        });
        setSeoData(seo);
      } catch (error) {
        console.log('No SEO data found');
      }

      // Load social sharing settings
      try {
        const social = await trpc.getSocialSharingSettings.query({
          contentType: 'project',
          contentId: project.id
        });
        setSocialSettings(social);
      } catch (error) {
        console.log('No social settings found');
      }
    }
  }, [project]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev: CreateProjectInput) => ({
      ...prev,
      title,
      slug: !project ? generateSlug(title) : prev.slug // Only auto-generate for new projects
    }));
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData((prev: CreateProjectInput) => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }));
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setFormData((prev: CreateProjectInput) => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let savedProject: Project;
      
      if (project) {
        // Update existing project
        const updateData: UpdateProjectInput = {
          id: project.id,
          ...formData
        };
        savedProject = await trpc.updateProject.mutate(updateData);
      } else {
        // Create new project
        savedProject = await trpc.createProject.mutate(formData);
      }

      // Update SEO metadata if changed
      if (seoData && savedProject) {
        if (seoData.id) {
          await trpc.updateSeoMetadata.mutate({
            id: seoData.id,
            meta_title: seoData.meta_title,
            meta_description: seoData.meta_description,
            social_image_id: seoData.social_image_id,
            og_title: seoData.og_title,
            og_description: seoData.og_description,
            twitter_title: seoData.twitter_title,
            twitter_description: seoData.twitter_description,
            canonical_url: seoData.canonical_url,
            robots: seoData.robots
          });
        } else {
          await trpc.createSeoMetadata.mutate({
            content_type: 'project',
            content_id: savedProject.id,
            meta_title: seoData.meta_title,
            meta_description: seoData.meta_description,
            social_image_id: seoData.social_image_id,
            og_title: seoData.og_title,
            og_description: seoData.og_description,
            twitter_title: seoData.twitter_title,
            twitter_description: seoData.twitter_description,
            canonical_url: seoData.canonical_url,
            robots: seoData.robots
          });
        }
      }

      // Update social sharing settings if changed
      if (socialSettings && savedProject) {
        if (socialSettings.id) {
          await trpc.updateSocialSharingSettings.mutate({
            id: socialSettings.id,
            enable_twitter: socialSettings.enable_twitter,
            enable_facebook: socialSettings.enable_facebook,
            enable_linkedin: socialSettings.enable_linkedin,
            enable_copy_link: socialSettings.enable_copy_link,
            custom_message: socialSettings.custom_message
          });
        } else {
          await trpc.createSocialSharingSettings.mutate({
            content_type: 'project',
            content_id: savedProject.id,
            enable_twitter: socialSettings.enable_twitter,
            enable_facebook: socialSettings.enable_facebook,
            enable_linkedin: socialSettings.enable_linkedin,
            enable_copy_link: socialSettings.enable_copy_link,
            custom_message: socialSettings.custom_message
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelect = (media: Media) => {
    setFormData((prev: CreateProjectInput) => ({
      ...prev,
      featured_image_id: media.id
    }));
    setFeaturedImage(media);
    setShowMediaPicker(false);
  };

  const removeFeaturedImage = () => {
    setFormData((prev: CreateProjectInput) => ({
      ...prev,
      featured_image_id: null
    }));
    setFeaturedImage(null);
  };

  if (showMediaPicker) {
    return (
      <MediaPicker
        onSelect={handleMediaSelect}
        onClose={() => setShowMediaPicker(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onClose} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">
                {project ? 'Edit Project' : 'New Project'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                {formData.status}
              </Badge>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="social">Social Sharing</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Enter project title"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-500 mr-2">/projects/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProjectInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="project-slug"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateProjectInput) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the project"
                    className="mt-2"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be displayed in project listings and previews
                  </p>
                </div>

                {/* Featured Image */}
                <div>
                  <Label>Featured Image</Label>
                  <div className="mt-2">
                    {featuredImage ? (
                      <div className="relative inline-block">
                        <img
                          src={`/uploads/${featuredImage.filename}`}
                          alt={featuredImage.alt_text || featuredImage.original_name}
                          className="w-48 h-32 object-cover rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeFeaturedImage}
                          className="absolute -top-2 -right-2"
                        >
                          ×
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">{featuredImage.original_name}</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowMediaPicker(true)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Select Featured Image
                      </Button>
                    )}
                  </div>
                </div>

                {/* Detailed Content */}
                <div>
                  <Label>Detailed Content (Optional)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Use this for in-depth project description, features, technical details, etc.
                  </p>
                  <RichTextEditor
                    content={formData.content || ''}
                    onChange={(content: string) =>
                      setFormData((prev: CreateProjectInput) => ({ ...prev, content: content || null }))
                    }
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Project Details</h3>
                
                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') =>
                      setFormData((prev: CreateProjectInput) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project URL */}
                <div>
                  <Label htmlFor="project_url">Project URL</Label>
                  <div className="flex items-center mt-2">
                    <Input
                      id="project_url"
                      value={formData.project_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProjectInput) => ({ ...prev, project_url: e.target.value || null }))
                      }
                      placeholder="https://example.com"
                    />
                    {formData.project_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => window.open(formData.project_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* GitHub URL */}
                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <div className="flex items-center mt-2">
                    <Input
                      id="github_url"
                      value={formData.github_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProjectInput) => ({ ...prev, github_url: e.target.value || null }))
                      }
                      placeholder="https://github.com/username/repository"
                    />
                    {formData.github_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => window.open(formData.github_url!, '_blank')}
                      >
                        <Github className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <Label>Technologies Used</Label>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.technologies.map((tech: string) => (
                        <Badge key={tech} variant="secondary" className="flex items-center">
                          {tech}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTechnology(tech)}
                            className="ml-1 p-0 h-auto"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newTechnology}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTechnology(e.target.value)}
                        placeholder="Add technology (e.g. React, TypeScript)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTechnology();
                          }
                        }}
                      />
                      <Button onClick={handleAddTechnology} disabled={!newTechnology.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={
                        formData.start_date
                          ? new Date(formData.start_date.getTime() - formData.start_date.getTimezoneOffset() * 60000)
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProjectInput) => ({
                          ...prev,
                          start_date: e.target.value ? new Date(e.target.value) : null
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={
                        formData.end_date
                          ? new Date(formData.end_date.getTime() - formData.end_date.getTimezoneOffset() * 60000)
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProjectInput) => ({
                          ...prev,
                          end_date: e.target.value ? new Date(e.target.value) : null
                        }))
                      }
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if project is ongoing
                    </p>
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <Label htmlFor="sort_order">Display Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProjectInput) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="0"
                    className="mt-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first in project listings
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <SeoEditor
              contentType="project"
              contentId={project?.id || 0}
              seoData={seoData}
              onChange={setSeoData}
              title={formData.title}
              excerpt={formData.description}
            />
          </TabsContent>

          {/* Social Sharing Tab */}
          <TabsContent value="social">
            <SocialSharingEditor
              contentType="project"
              contentId={project?.id || 0}
              settings={socialSettings}
              onChange={setSocialSettings}
              title={formData.title}
              excerpt={formData.description}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}