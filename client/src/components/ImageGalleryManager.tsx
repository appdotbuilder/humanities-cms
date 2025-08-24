import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Images,
  Edit,
  Trash2,
  Eye,
  Image,
  Globe,
  Move,
  X
} from 'lucide-react';

import type { 
  ImageGallery, 
  CreateImageGalleryInput,
  GalleryImage,
  Media 
} from '../../../server/src/schema';

import { MediaPicker } from '@/components/MediaPicker';

export function ImageGalleryManager() {
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<ImageGallery | null>(null);
  const [galleryImages, setGalleryImages] = useState<(GalleryImage & { media: Media })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ImageGallery | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateImageGalleryInput>({
    title: '',
    description: null,
    slug: '',
    status: 'draft'
  });

  const loadGalleries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getImageGalleries.query();
      setGalleries(result);
    } catch (error) {
      console.error('Failed to load galleries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGalleryImages = useCallback(async (galleryId: number) => {
    try {
      const gallery = await trpc.getImageGallery.query({ id: galleryId });
      // Note: This is a stub - the actual handler would need to join with media table
      // For now, we'll show the gallery structure
      console.log('Gallery loaded:', gallery);
      // setGalleryImages(gallery.images || []);
    } catch (error) {
      console.error('Failed to load gallery images:', error);
    }
  }, []);

  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

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
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingGallery ? generateSlug(title) : prev.slug
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: null,
      slug: '',
      status: 'draft'
    });
  };

  const handleCreate = async () => {
    try {
      await trpc.createImageGallery.mutate(formData);
      setShowCreateDialog(false);
      resetForm();
      await loadGalleries();
    } catch (error) {
      console.error('Failed to create gallery:', error);
    }
  };

  const handleEdit = (gallery: ImageGallery) => {
    setEditingGallery(gallery);
    setFormData({
      title: gallery.title,
      description: gallery.description,
      slug: gallery.slug,
      status: gallery.status
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingGallery) return;
    
    try {
      // Note: This would need an update handler in the backend
      console.log('Update gallery:', editingGallery.id, formData);
      setShowEditDialog(false);
      setEditingGallery(null);
      resetForm();
      await loadGalleries();
    } catch (error) {
      console.error('Failed to update gallery:', error);
    }
  };

  const handleDelete = async (gallery: ImageGallery) => {
    if (!confirm(`Delete gallery "${gallery.title}"? This will also remove all images from the gallery.`)) {
      return;
    }
    
    try {
      // Note: This would need a delete handler in the backend
      console.log('Delete gallery:', gallery.id);
      await loadGalleries();
    } catch (error) {
      console.error('Failed to delete gallery:', error);
    }
  };

  const handleAddImages = (gallery: ImageGallery) => {
    setSelectedGallery(gallery);
    setShowMediaPicker(true);
  };

  const handleMediaSelect = async (media: Media) => {
    if (!selectedGallery) return;
    
    try {
      await trpc.addImageToGallery.mutate({
        gallery_id: selectedGallery.id,
        media_id: media.id,
        caption: null,
        sort_order: 0
      });
      setShowMediaPicker(false);
      // Refresh gallery images if we're viewing this gallery
      if (showImageManager) {
        await loadGalleryImages(selectedGallery.id);
      }
    } catch (error) {
      console.error('Failed to add image to gallery:', error);
    }
  };

  const handleManageImages = (gallery: ImageGallery) => {
    setSelectedGallery(gallery);
    loadGalleryImages(gallery.id);
    setShowImageManager(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.draft}>
        {status}
      </Badge>
    );
  };

  const GalleryForm = ({ onSubmit, onCancel, isEdit = false }: {
    onSubmit: () => void;
    onCancel: () => void;
    isEdit?: boolean;
  }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Gallery Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={handleTitleChange}
          placeholder="Enter gallery title"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">URL Slug</Label>
        <div className="flex items-center mt-2">
          <span className="text-sm text-gray-500 mr-2">/gallery/</span>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, slug: e.target.value }))
            }
            placeholder="gallery-slug"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, description: e.target.value || null }))
          }
          placeholder="Brief description of the gallery"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'draft' | 'published' | 'archived') =>
            setFormData(prev => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );

  if (showMediaPicker) {
    return (
      <MediaPicker
        onSelect={handleMediaSelect}
        onClose={() => setShowMediaPicker(false)}
      />
    );
  }

  if (showImageManager && selectedGallery) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowImageManager(false)}
              className="mb-2"
            >
              ← Back to Galleries
            </Button>
            <h2 className="text-xl font-semibold">
              🖼️ Managing: {selectedGallery.title}
            </h2>
          </div>
          <Button onClick={() => setShowMediaPicker(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Images
          </Button>
        </div>

        {/* Gallery Images */}
        <Card className="p-6">
          <div className="text-center py-12">
            <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Gallery image management is being implemented
            </p>
            <p className="text-sm text-gray-400">
              This feature will allow you to add, remove, reorder, and caption images in your galleries.
            </p>
            <Button 
              className="mt-4"
              onClick={() => setShowMediaPicker(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Images to Gallery
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🖼️ Image Galleries</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Gallery
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Gallery</DialogTitle>
            </DialogHeader>
            <GalleryForm
              onSubmit={handleCreate}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Galleries List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading galleries...</p>
        </div>
      ) : galleries.length === 0 ? (
        <div className="text-center py-12">
          <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No image galleries yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Gallery
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {galleries.map((gallery: ImageGallery) => (
            <Card key={gallery.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold mr-3">{gallery.title}</h3>
                    {getStatusBadge(gallery.status)}
                  </div>
                  
                  {gallery.description && (
                    <p className="text-gray-600 mb-3">{gallery.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      /gallery/{gallery.slug}
                    </span>
                    <span>Created {formatDate(gallery.created_at)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageImages(gallery)}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Manage Images
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddImages(gallery)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Images
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(gallery)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(gallery)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Gallery Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center justify-center h-24 text-gray-400">
                  <Images className="h-8 w-8 mr-2" />
                  <span className="text-sm">Gallery preview will show thumbnails here</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gallery</DialogTitle>
          </DialogHeader>
          <GalleryForm
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditDialog(false);
              setEditingGallery(null);
              resetForm();
            }}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}