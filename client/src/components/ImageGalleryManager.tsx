import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  Calendar,
  Globe
} from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { ImageGallery } from '../../../server/src/schema';

export function ImageGalleryManager() {
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGalleries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getImageGalleries.query().catch(() => []);
      setGalleries(result);
    } catch (error) {
      console.error('Failed to load galleries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;
    
    try {
      // Note: This endpoint doesn't exist yet, but we're preparing for it
      // await trpc.deleteImageGallery.mutate({ id });
      setGalleries(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Failed to delete gallery:', error);
    }
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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading galleries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Image Galleries</h2>
          <p className="text-sm text-gray-600">
            Create and manage image collections for your website
          </p>
        </div>
        <Button className="flex items-center self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Gallery
        </Button>
      </div>

      {/* Galleries Grid */}
      {galleries.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first image gallery to showcase collections of photos.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Gallery
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {galleries.map((gallery: ImageGallery) => (
            <Card key={gallery.id} className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {gallery.title}
                  </h3>
                  
                  {gallery.description && (
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {gallery.description}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      <span>/gallery/{gallery.slug}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {formatDate(gallery.created_at)}
                    </div>
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>0 images</span> {/* TODO: Add actual image count */}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    {getStatusBadge(gallery.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Manage Images</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(gallery.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}