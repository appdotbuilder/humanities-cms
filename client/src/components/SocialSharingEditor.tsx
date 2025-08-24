import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin,
  Link2,
  Copy,
  ExternalLink
} from 'lucide-react';

import type { SocialSharingSettings } from '../../../server/src/schema';

interface SocialSharingEditorProps {
  contentType: 'blog_post' | 'static_page' | 'project';
  contentId: number;
  settings: SocialSharingSettings | null;
  onChange: (settings: SocialSharingSettings | null) => void;
  title: string;
  excerpt?: string | null;
}

export function SocialSharingEditor({ 
  contentType, 
  contentId, 
  settings, 
  onChange, 
  title, 
  excerpt 
}: SocialSharingEditorProps) {
  const [formData, setFormData] = useState({
    enable_twitter: true,
    enable_facebook: true,
    enable_linkedin: true,
    enable_copy_link: true,
    custom_message: ''
  });

  const [previewUrl] = useState('https://yoursite.com/example-url');

  useEffect(() => {
    if (settings) {
      setFormData({
        enable_twitter: settings.enable_twitter,
        enable_facebook: settings.enable_facebook,
        enable_linkedin: settings.enable_linkedin,
        enable_copy_link: settings.enable_copy_link,
        custom_message: settings.custom_message || ''
      });
    }
  }, [settings]);

  const updateSettings = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Create updated settings object
    const updatedSettings: SocialSharingSettings = {
      id: settings?.id || 0,
      content_type: contentType,
      content_id: contentId,
      enable_twitter: newFormData.enable_twitter,
      enable_facebook: newFormData.enable_facebook,
      enable_linkedin: newFormData.enable_linkedin,
      enable_copy_link: newFormData.enable_copy_link,
      custom_message: newFormData.custom_message || null,
      created_at: settings?.created_at || new Date(),
      updated_at: new Date()
    };
    
    onChange(updatedSettings);
  };

  const generateSharingUrl = (platform: string) => {
    const url = encodeURIComponent(previewUrl);
    const text = encodeURIComponent(formData.custom_message || title);
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      default:
        return previewUrl;
    }
  };

  const platforms = [
    {
      key: 'enable_twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50',
      description: 'Share on Twitter with custom message'
    },
    {
      key: 'enable_facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Share on Facebook'
    },
    {
      key: 'enable_linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      description: 'Share on LinkedIn'
    },
    {
      key: 'enable_copy_link',
      name: 'Copy Link',
      icon: Link2,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Enable copy link to clipboard functionality'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Platform Toggles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Social Sharing Platforms
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isEnabled = formData[platform.key as keyof typeof formData] as boolean;
            
            return (
              <div
                key={platform.key}
                className={`border rounded-lg p-4 transition-colors ${
                  isEnabled ? platform.bgColor : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked: boolean) =>
                      updateSettings({ [platform.key]: checked })
                    }
                  />
                </div>
                <p className="text-sm text-gray-600">{platform.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Custom Message */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Sharing Message</h3>
        
        <div>
          <Label htmlFor="custom_message">
            Message (Optional)
          </Label>
          <Textarea
            id="custom_message"
            value={formData.custom_message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              updateSettings({ custom_message: e.target.value })
            }
            placeholder={`Default: "${title}"`}
            rows={3}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Custom message for social sharing. Leave empty to use the page title.
          </p>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sharing Preview</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Share URL</Label>
            <div className="flex items-center mt-2">
              <Input
                value={previewUrl}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => navigator.clipboard.writeText(previewUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Share Message</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
              <p className="text-sm">
                {formData.custom_message || title}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Label className="mb-3 block">Test Sharing Links</Label>
          <div className="flex flex-wrap gap-2">
            {formData.enable_twitter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(generateSharingUrl('twitter'), '_blank')}
              >
                <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                Test Twitter
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            
            {formData.enable_facebook && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(generateSharingUrl('facebook'), '_blank')}
              >
                <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                Test Facebook
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            
            {formData.enable_linkedin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(generateSharingUrl('linkedin'), '_blank')}
              >
                <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                Test LinkedIn
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            
            {formData.enable_copy_link && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(previewUrl);
                  // You could add a toast notification here
                }}
              >
                <Link2 className="h-4 w-4 mr-2 text-gray-600" />
                Copy Link
              </Button>
            )}
          </div>
        </div>

        {/* Sharing Statistics Preview */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
          <p className="text-sm text-blue-800">
            Test your sharing links to ensure they display correctly on each platform. 
            The social image and meta description from the SEO tab will be used for rich previews.
          </p>
        </div>
      </Card>

      {/* Analytics Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sharing Analytics</h3>
        <div className="text-center py-8 text-gray-500">
          <Share2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Social sharing analytics will appear here once the content is published and shared.</p>
        </div>
      </Card>
    </div>
  );
}