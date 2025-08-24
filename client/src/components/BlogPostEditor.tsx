import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types  
import type { 
  BlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput
} from '../../../server/src/schema';

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onClose: () => void;
  onSave: () => void;
}

export function BlogPostEditor({ post, onClose, onSave }: BlogPostEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    status: post?.status || 'draft' as const,
    published_at: post?.published_at ? new Date(post.published_at).toISOString().split('T')[0] : ''
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
      slug: post ? prev.slug : generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (post) {
        // Update existing post
        const updateData: UpdateBlogPostInput = {
          id: post.id,
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          status: formData.status,
          published_at: formData.published_at ? new Date(formData.published_at) : null
        };
        await trpc.updateBlogPost.mutate(updateData);
      } else {
        // Create new post
        const createData: CreateBlogPostInput = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          featured_image_id: null,
          status: formData.status,
          published_at: formData.published_at ? new Date(formData.published_at) : null
        };
        await trpc.createBlogPost.mutate(createData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save blog post:', error);
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
              {post ? 'Edit Blog Post' : 'New Blog Post'}
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
              {isLoading ? 'Saving...' : 'Save Post'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Post Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter your blog post title..."
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
                  This will be the URL: /blog/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-sm font-medium">
                  Excerpt (Optional)
                </Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of your post..."
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Short summary shown in blog listings and previews
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
                  placeholder="Write your blog post content here... You can use HTML tags for formatting."
                  rows={20}
                  className="mt-1 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use HTML tags for formatting. Rich text editor coming soon!
                </p>
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
                  <Label htmlFor="published_at" className="text-sm font-medium">
                    Publish Date
                  </Label>
                  <Input
                    id="published_at"
                    type="date"
                    value={formData.published_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
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