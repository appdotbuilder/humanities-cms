import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Image,
  Globe,
  Home
} from 'lucide-react';

import type { 
  StaticPage, 
  CreateStaticPageInput, 
  UpdateStaticPageInput,
  Media,
  SeoMetadata,
  SocialSharingSettings
} from '../../../server/src/schema';

import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaPicker } from '@/components/MediaPicker';
import { SeoEditor } from '@/components/SeoEditor';
import { SocialSharingEditor } from '@/components/SocialSharingEditor';

interface StaticPageEditorProps {
  page?: StaticPage | null;
  onClose: () => void;
  onSave: () => void;
}

export function StaticPageEditor({ page, onClose, onSave }: StaticPageEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  
  const [formData, setFormData] = useState<CreateStaticPageInput>({
    title: '',
    slug: '',
    content: '',
    featured_image_id: null,
    is_homepage: false,
    status: 'draft'
  });

  const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
  const [seoData, setSeoData] = useState<SeoMetadata | null>(null);
  const [socialSettings, setSocialSettings] = useState<SocialSharingSettings | null>(null);

  // Load existing data
  const loadData = useCallback(async () => {
    if (page) {
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        featured_image_id: page.featured_image_id,
        is_homepage: page.is_homepage,
        status: page.status
      });

      // Load featured image
      if (page.featured_image_id) {
        try {
          const image = await trpc.getMediaById.query({ id: page.featured_image_id });
          setFeaturedImage(image);
        } catch (error) {
          console.error('Failed to load featured image:', error);
        }
      }

      // Load SEO data
      try {
        const seo = await trpc.getSeoMetadata.query({
          contentType: 'static_page',
          contentId: page.id
        });
        setSeoData(seo);
      } catch (error) {
        console.log('No SEO data found');
      }

      // Load social sharing settings
      try {
        const social = await trpc.getSocialSharingSettings.query({
          contentType: 'static_page',
          contentId: page.id
        });
        setSocialSettings(social);
      } catch (error) {
        console.log('No social settings found');
      }
    }
  }, [page]);

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
    setFormData((prev: CreateStaticPageInput) => ({
      ...prev,
      title,
      slug: !page ? generateSlug(title) : prev.slug // Only auto-generate for new pages
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let savedPage: StaticPage;
      
      if (page) {
        // Update existing page
        const updateData: UpdateStaticPageInput = {
          id: page.id,
          ...formData
        };
        savedPage = await trpc.updateStaticPage.mutate(updateData);
      } else {
        // Create new page
        savedPage = await trpc.createStaticPage.mutate(formData);
      }

      // Update SEO metadata if changed
      if (seoData && savedPage) {
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
            content_type: 'static_page',
            content_id: savedPage.id,
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
      if (socialSettings && savedPage) {
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
            content_type: 'static_page',
            content_id: savedPage.id,
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
      console.error('Failed to save static page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSelect = (media: Media) => {
    setFormData((prev: CreateStaticPageInput) => ({
      ...prev,
      featured_image_id: media.id
    }));
    setFeaturedImage(media);
    setShowMediaPicker(false);
  };

  const removeFeaturedImage = () => {
    setFormData((prev: CreateStaticPageInput) => ({
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
                {page ? 'Edit Static Page' : 'New Static Page'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {formData.is_homepage && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Home className="h-3 w-3 mr-1" />
                  Homepage
                </Badge>
              )}
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
                    placeholder="Enter page title"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-500 mr-2">/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateStaticPageInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="url-slug"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This will be the page URL. Use lowercase letters and hyphens only.
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

                {/* Content Editor */}
                <div>
                  <Label>Content *</Label>
                  <div className="mt-2">
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content: string) =>
                        setFormData((prev: CreateStaticPageInput) => ({ ...prev, content }))
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
                <h3 className="text-lg font-semibold">Page Settings</h3>
                
                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') =>
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, status: value }))
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

                {/* Homepage Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_homepage">Set as Homepage</Label>
                    <p className="text-sm text-gray-500">
                      This page will be displayed as the site homepage
                    </p>
                  </div>
                  <Switch
                    id="is_homepage"
                    checked={formData.is_homepage}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, is_homepage: checked }))
                    }
                  />
                </div>

                {formData.is_homepage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-start">
                      <Home className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Homepage Settings</p>
                        <p className="text-xs text-blue-700 mt-1">
                          This page will be accessible at the root URL ('/') and will override any other homepage settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Preview */}
                <div>
                  <Label>Page URL Preview</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {formData.is_homepage ? 
                          'https://yoursite.com/' : 
                          `https://yoursite.com/${formData.slug || 'your-page-slug'}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <SeoEditor
              contentType="static_page"
              contentId={page?.id || 0}
              seoData={seoData}
              onChange={setSeoData}
              title={formData.title}
              excerpt={null}
            />
          </TabsContent>

          {/* Social Sharing Tab */}
          <TabsContent value="social">
            <SocialSharingEditor
              contentType="static_page"
              contentId={page?.id || 0}
              settings={socialSettings}
              onChange={setSocialSettings}
              title={formData.title}
              excerpt={null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}