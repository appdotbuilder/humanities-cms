import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Globe, 
  Share2,
  Image,
  Calendar
} from 'lucide-react';

import type { 
  BlogPost, 
  CreateBlogPostInput, 
  UpdateBlogPostInput,
  Media,
  SeoMetadata,
  SocialSharingSettings
} from '../../../server/src/schema';

import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaPicker } from '@/components/MediaPicker';
import { SeoEditor } from '@/components/SeoEditor';
import { SocialSharingEditor } from '@/components/SocialSharingEditor';

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onClose: () => void;
  onSave: () => void;
}

export function BlogPostEditor({ post, onClose, onSave }: BlogPostEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    featured_image_id: null,
    status: 'draft',
    published_at: null
  });

  const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
  const [seoData, setSeoData] = useState<SeoMetadata | null>(null);
  const [socialSettings, setSocialSettings] = useState<SocialSharingSettings | null>(null);

  // Load existing data
  const loadData = useCallback(async () => {
    if (post) {
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image_id: post.featured_image_id,
        status: post.status,
        published_at: post.published_at
      });

      // Load featured image
      if (post.featured_image_id) {
        try {
          const image = await trpc.getMediaById.query({ id: post.featured_image_id });
          setFeaturedImage(image);
        } catch (error) {
          console.error('Failed to load featured image:', error);
        }
      }

      // Load SEO data
      try {
        const seo = await trpc.getSeoMetadata.query({
          contentType: 'blog_post',
          contentId: post.id
        });
        setSeoData(seo);
      } catch (error) {
        console.log('No SEO data found');
      }

      // Load social sharing settings
      try {
        const social = await trpc.getSocialSharingSettings.query({
          contentType: 'blog_post',
          contentId: post.id
        });
        setSocialSettings(social);
      } catch (error) {
        console.log('No social settings found');
      }
    }
  }, [post]);

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
    setFormData((prev: CreateBlogPostInput) => ({
      ...prev,
      title,
      slug: !post ? generateSlug(title) : prev.slug // Only auto-generate for new posts
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let savedPost: BlogPost;
      
      if (post) {
        // Update existing post
        const updateData: UpdateBlogPostInput = {
          id: post.id,
          ...formData
        };
        savedPost = await trpc.updateBlogPost.mutate(updateData);
      } else {
        // Create new post
        savedPost = await trpc.createBlogPost.mutate(formData);
      }

      // Update SEO metadata if changed
      if (seoData && savedPost) {
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
            content_type: 'blog_post',
            content_id: savedPost.id,
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
      if (socialSettings && savedPost) {
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
            content_type: 'blog_post',
            content_id: savedPost.id,
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
      console.error('Failed to save blog post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelect = (media: Media) => {
    setFormData((prev: CreateBlogPostInput) => ({
      ...prev,
      featured_image_id: media.id
    }));
    setFeaturedImage(media);
    setShowMediaPicker(false);
  };

  const removeFeaturedImage = () => {
    setFormData((prev: CreateBlogPostInput) => ({
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
                {post ? 'Edit Blog Post' : 'New Blog Post'}
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="social">Social Sharing</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Enter blog post title"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-500 mr-2">/blog/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBlogPostInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="url-slug"
                      required
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({
                        ...prev,
                        excerpt: e.target.value || null
                      }))
                    }
                    placeholder="Brief description of the post (optional)"
                    className="mt-2"
                    rows={3}
                  />
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

                {/* Content Editor */}
                <div>
                  <Label>Content *</Label>
                  <div className="mt-2">
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content: string) =>
                        setFormData((prev: CreateBlogPostInput) => ({ ...prev, content }))
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Publication Settings</h3>
                
                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') =>
                      setFormData((prev: CreateBlogPostInput) => ({ ...prev, status: value }))
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

                {/* Publish Date */}
                <div>
                  <Label htmlFor="published_at">Publish Date</Label>
                  <Input
                    id="published_at"
                    type="datetime-local"
                    value={
                      formData.published_at
                        ? new Date(formData.published_at.getTime() - formData.published_at.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({
                        ...prev,
                        published_at: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to publish immediately when status is set to "Published"
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <SeoEditor
              contentType="blog_post"
              contentId={post?.id || 0}
              seoData={seoData}
              onChange={setSeoData}
              title={formData.title}
              excerpt={formData.excerpt}
            />
          </TabsContent>

          {/* Social Sharing Tab */}
          <TabsContent value="social">
            <SocialSharingEditor
              contentType="blog_post"
              contentId={post?.id || 0}
              settings={socialSettings}
              onChange={setSocialSettings}
              title={formData.title}
              excerpt={formData.excerpt}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}