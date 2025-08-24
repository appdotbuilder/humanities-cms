import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Eye, Home } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types  
import type { 
  StaticPage,
  CreateStaticPageInput,
  UpdateStaticPageInput
} from '../../../server/src/schema';

interface StaticPageEditorProps {
  page?: StaticPage | null;
  onClose: () => void;
  onSave: () => void;
}

export function StaticPageEditor({ page, onClose, onSave }: StaticPageEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    status: page?.status || 'draft' as const,
    is_homepage: page?.is_homepage || false
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
      slug: page ? prev.slug : generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (page) {
        // Update existing page
        const updateData: UpdateStaticPageInput = {
          id: page.id,
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          status: formData.status,
          is_homepage: formData.is_homepage
        };
        await trpc.updateStaticPage.mutate(updateData);
      } else {
        // Create new page
        const createData: CreateStaticPageInput = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          featured_image_id: null,
          status: formData.status,
          is_homepage: formData.is_homepage
        };
        await trpc.createStaticPage.mutate(createData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save static page:', error);
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
              {page ? 'Edit Static Page' : 'New Static Page'}
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
              {isLoading ? 'Saving...' : 'Save Page'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Page Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter your page title..."
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
                  This will be the URL: /{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="content" className="text-sm font-medium">
                  Content *
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your page content here... You can use HTML tags for formatting."
                  rows={20}
                  className="mt-1 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use HTML tags for formatting. Rich text editor coming soon!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="is_homepage"
                      checked={formData.is_homepage}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_homepage: checked }))
                      }
                    />
                    <Label htmlFor="is_homepage" className="text-sm font-medium">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        Set as Homepage
                      </div>
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This page will be displayed on the main site homepage
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}