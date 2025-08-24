import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Share2, 
  Twitter, 
  Facebook,
  Image,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import type { SeoMetadata, Media } from '../../../server/src/schema';
import { MediaPicker } from '@/components/MediaPicker';

interface SeoEditorProps {
  contentType: 'blog_post' | 'static_page' | 'project';
  contentId: number;
  seoData: SeoMetadata | null;
  onChange: (seoData: SeoMetadata | null) => void;
  title: string;
  excerpt?: string | null;
}

export function SeoEditor({ 
  contentType, 
  contentId, 
  seoData, 
  onChange, 
  title, 
  excerpt 
}: SeoEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [socialImage, setSocialImage] = useState<Media | null>(null);
  
  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    social_image_id: null as number | null,
    og_title: '',
    og_description: '',
    twitter_title: '',
    twitter_description: '',
    canonical_url: '',
    robots: 'index,follow'
  });

  useEffect(() => {
    if (seoData) {
      setFormData({
        meta_title: seoData.meta_title || '',
        meta_description: seoData.meta_description || '',
        social_image_id: seoData.social_image_id,
        og_title: seoData.og_title || '',
        og_description: seoData.og_description || '',
        twitter_title: seoData.twitter_title || '',
        twitter_description: seoData.twitter_description || '',
        canonical_url: seoData.canonical_url || '',
        robots: seoData.robots || 'index,follow'
      });
    } else {
      // Auto-populate with content data
      setFormData(prev => ({
        ...prev,
        meta_title: title || '',
        meta_description: excerpt?.substring(0, 160) || '',
        og_title: title || '',
        og_description: excerpt?.substring(0, 160) || '',
        twitter_title: title || '',
        twitter_description: excerpt?.substring(0, 160) || ''
      }));
    }
  }, [seoData, title, excerpt]);

  const updateSeoData = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Create updated SEO data object
    const updatedSeoData: SeoMetadata = {
      id: seoData?.id || 0,
      content_type: contentType,
      content_id: contentId,
      meta_title: newFormData.meta_title || null,
      meta_description: newFormData.meta_description || null,
      social_image_id: newFormData.social_image_id,
      og_title: newFormData.og_title || null,
      og_description: newFormData.og_description || null,
      twitter_title: newFormData.twitter_title || null,
      twitter_description: newFormData.twitter_description || null,
      canonical_url: newFormData.canonical_url || null,
      robots: newFormData.robots || null,
      created_at: seoData?.created_at || new Date(),
      updated_at: new Date()
    };
    
    onChange(updatedSeoData);
  };

  const handleMediaSelect = (media: Media) => {
    setSocialImage(media);
    updateSeoData({ social_image_id: media.id });
    setShowMediaPicker(false);
  };

  const getMetaTitleLength = () => formData.meta_title.length;
  const getMetaDescriptionLength = () => formData.meta_description.length;
  
  const getTitleStatus = () => {
    const length = getMetaTitleLength();
    if (length === 0) return { status: 'warning', message: 'Meta title is required' };
    if (length < 30) return { status: 'warning', message: 'Meta title is too short' };
    if (length > 60) return { status: 'error', message: 'Meta title is too long' };
    return { status: 'success', message: 'Meta title length is good' };
  };

  const getDescriptionStatus = () => {
    const length = getMetaDescriptionLength();
    if (length === 0) return { status: 'warning', message: 'Meta description is recommended' };
    if (length < 120) return { status: 'warning', message: 'Meta description could be longer' };
    if (length > 160) return { status: 'error', message: 'Meta description is too long' };
    return { status: 'success', message: 'Meta description length is good' };
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
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
    <div className="space-y-6">
      {/* Basic SEO */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Search Engine Optimization
        </h3>
        
        <div className="space-y-4">
          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <div className="flex items-center space-x-2 text-sm">
                <StatusIcon status={getTitleStatus().status} />
                <span className={`text-${getTitleStatus().status === 'error' ? 'red' : getTitleStatus().status === 'success' ? 'green' : 'yellow'}-600`}>
                  {getMetaTitleLength()}/60
                </span>
              </div>
            </div>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateSeoData({ meta_title: e.target.value })
              }
              placeholder="Enter meta title for search engines"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">{getTitleStatus().message}</p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <div className="flex items-center space-x-2 text-sm">
                <StatusIcon status={getDescriptionStatus().status} />
                <span className={`text-${getDescriptionStatus().status === 'error' ? 'red' : getDescriptionStatus().status === 'success' ? 'green' : 'yellow'}-600`}>
                  {getMetaDescriptionLength()}/160
                </span>
              </div>
            </div>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateSeoData({ meta_description: e.target.value })
              }
              placeholder="Brief description for search engine results"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">{getDescriptionStatus().message}</p>
          </div>

          {/* Canonical URL */}
          <div>
            <Label htmlFor="canonical_url">Canonical URL (Optional)</Label>
            <Input
              id="canonical_url"
              value={formData.canonical_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateSeoData({ canonical_url: e.target.value })
              }
              placeholder="https://example.com/canonical-url"
              className="mt-2"
            />
          </div>

          {/* Robots */}
          <div>
            <Label htmlFor="robots">Robots Meta Tag</Label>
            <Input
              id="robots"
              value={formData.robots}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateSeoData({ robots: e.target.value })
              }
              placeholder="index,follow"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Common values: index,follow | noindex,nofollow | index,nofollow
            </p>
          </div>
        </div>
      </Card>

      {/* Social Media */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Social Media Sharing
        </h3>

        {/* Social Image */}
        <div className="mb-6">
          <Label>Social Sharing Image</Label>
          <div className="mt-2">
            {socialImage ? (
              <div className="relative inline-block">
                <img
                  src={`/uploads/${socialImage.filename}`}
                  alt={socialImage.alt_text || socialImage.original_name}
                  className="w-64 h-32 object-cover rounded-md border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSocialImage(null);
                    updateSeoData({ social_image_id: null });
                  }}
                  className="absolute -top-2 -right-2"
                >
                  ×
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowMediaPicker(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                Select Social Image
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recommended size: 1200×630px for optimal sharing appearance
          </p>
        </div>

        <Separator className="my-6" />

        {/* Open Graph (Facebook) */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook / Open Graph
          </h4>
          
          <div>
            <Label htmlFor="og_title">Facebook Title</Label>
            <Input
              id="og_title"
              value={formData.og_title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateSeoData({ og_title: e.target.value })
              }
              placeholder="Leave empty to use meta title"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="og_description">Facebook Description</Label>
            <Textarea
              id="og_description"
              value={formData.og_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateSeoData({ og_description: e.target.value })
              }
              placeholder="Leave empty to use meta description"
              rows={2}
              className="mt-2"
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Twitter */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Twitter className="h-4 w-4 mr-2 text-blue-400" />
            Twitter
          </h4>
          
          <div>
            <Label htmlFor="twitter_title">Twitter Title</Label>
            <Input
              id="twitter_title"
              value={formData.twitter_title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateSeoData({ twitter_title: e.target.value })
              }
              placeholder="Leave empty to use meta title"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="twitter_description">Twitter Description</Label>
            <Textarea
              id="twitter_description"
              value={formData.twitter_description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateSeoData({ twitter_description: e.target.value })
              }
              placeholder="Leave empty to use meta description"
              rows={2}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* SEO Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Search Engine Preview
        </h3>
        
        <div className="border rounded-md p-4 bg-white">
          <div className="text-blue-600 text-lg hover:underline cursor-pointer">
            {formData.meta_title || title || 'Page Title'}
          </div>
          <div className="text-green-700 text-sm mt-1">
            https://yoursite.com/example-url
          </div>
          <div className="text-gray-600 text-sm mt-2">
            {formData.meta_description || excerpt || 'No description available.'}
          </div>
        </div>

        <Separator className="my-4" />

        <h4 className="font-medium mb-3">Facebook Preview</h4>
        <div className="border rounded-md overflow-hidden bg-white max-w-lg">
          {socialImage && (
            <img
              src={`/uploads/${socialImage.filename}`}
              alt="Social preview"
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-3">
            <div className="text-gray-500 text-xs uppercase mb-1">yoursite.com</div>
            <div className="font-medium text-gray-900">
              {formData.og_title || formData.meta_title || title || 'Page Title'}
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {formData.og_description || formData.meta_description || excerpt || 'No description available.'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}