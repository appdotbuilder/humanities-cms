import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  PenTool, 
  FileText, 
  Image, 
  FolderOpen as Project,
  Clock,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Globe
} from 'lucide-react';

// Import types
import type { 
  BlogPost, 
  StaticPage, 
  Project as ProjectType, 
  ImageGallery,
  TimelineEntry,
  Media
} from '../../server/src/schema';

// Import components
import { BlogPostEditor } from '@/components/BlogPostEditor';
import { StaticPageEditor } from '@/components/StaticPageEditor';
import { ProjectEditor } from '@/components/ProjectEditor';
import { MediaManager } from '@/components/MediaManager';
import { TimelineManager } from '@/components/TimelineManager';
import { ImageGalleryManager } from '@/components/ImageGalleryManager';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Content states
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [media, setMedia] = useState<Media[]>([]);

  // Editor states
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load all content
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        postsResult,
        pagesResult,
        projectsResult,
        galleriesResult,
        timelineResult,
        mediaResult
      ] = await Promise.all([
        trpc.getBlogPosts.query(),
        trpc.getStaticPages.query(),
        trpc.getProjects.query(),
        trpc.getImageGalleries.query(),
        trpc.getTimelineEntries.query(),
        trpc.getMedia.query()
      ]);
      
      setBlogPosts(postsResult);
      setStaticPages(pagesResult);
      setProjects(projectsResult);
      setGalleries(galleriesResult);
      setTimelineEntries(timelineResult);
      setMedia(mediaResult);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleEdit = (type: string, item: any) => {
    setEditingItem(item);
    switch (type) {
      case 'blog':
        setShowBlogEditor(true);
        break;
      case 'page':
        setShowPageEditor(true);
        break;
      case 'project':
        setShowProjectEditor(true);
        break;
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      switch (type) {
        case 'blog':
          await trpc.deleteBlogPost.mutate({ id });
          setBlogPosts(prev => prev.filter(p => p.id !== id));
          break;
        case 'page':
          await trpc.deleteStaticPage.mutate({ id });
          setStaticPages(prev => prev.filter(p => p.id !== id));
          break;
        case 'project':
          await trpc.deleteProject.mutate({ id });
          setProjects(prev => prev.filter(p => p.id !== id));
          break;
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const closeEditors = () => {
    setShowBlogEditor(false);
    setShowPageEditor(false);
    setShowProjectEditor(false);
    setEditingItem(null);
    loadContent(); // Refresh data after edit
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

  if (showBlogEditor) {
    return (
      <BlogPostEditor 
        post={editingItem}
        onClose={closeEditors}
        onSave={closeEditors}
      />
    );
  }

  if (showPageEditor) {
    return (
      <StaticPageEditor 
        page={editingItem}
        onClose={closeEditors}
        onSave={closeEditors}
      />
    );
  }

  if (showProjectEditor) {
    return (
      <ProjectEditor 
        project={editingItem}
        onClose={closeEditors}
        onSave={closeEditors}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              📚 Academic CMS Dashboard
            </h1>
            <div className="text-sm text-gray-500">
              Welcome back, Professor
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="pages">Static Pages</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <PenTool className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{blogPosts.length}</p>
                    <p className="text-gray-600">Blog Posts</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{staticPages.length}</p>
                    <p className="text-gray-600">Static Pages</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <Project className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                    <p className="text-gray-600">Projects</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <Image className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{media.length}</p>
                    <p className="text-gray-600">Media Files</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Content</h3>
              <div className="space-y-4">
                {[...blogPosts, ...staticPages]
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 5)
                  .map((item: BlogPost | StaticPage) => (
                    <div key={`${'published_at' in item ? 'blog' : 'page'}-${item.id}`} 
                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {'published_at' in item ? 
                          <PenTool className="h-4 w-4 text-blue-500 mr-3" /> :
                          <FileText className="h-4 w-4 text-green-500 mr-3" />
                        }
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-500">
                            Updated {formatDate(item.updated_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          {/* Blog Posts Tab */}
          <TabsContent value="blog" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Blog Posts</h2>
              <Button onClick={() => setShowBlogEditor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>

            <div className="grid gap-6">
              {blogPosts.map((post: BlogPost) => (
                <Card key={post.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {post.published_at ? formatDate(post.published_at) : 'Not published'}
                        </span>
                        <span>Updated {formatDate(post.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(post.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit('blog', post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('blog', post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Static Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Static Pages</h2>
              <Button onClick={() => setShowPageEditor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Page
              </Button>
            </div>

            <div className="grid gap-6">
              {staticPages.map((page: StaticPage) => (
                <Card key={page.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold">{page.title}</h3>
                        {page.is_homepage && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            Homepage
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          /{page.slug}
                        </span>
                        <span>Updated {formatDate(page.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(page.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit('page', page)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('page', page.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Projects</h2>
              <Button onClick={() => setShowProjectEditor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            <div className="grid gap-6">
              {projects.map((project: ProjectType) => (
                <Card key={project.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {project.start_date && (
                          <span>{formatDate(project.start_date)}</span>
                        )}
                        {project.project_url && (
                          <a 
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Project
                          </a>
                        )}
                        {project.github_url && (
                          <a 
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(project.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit('project', project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('project', project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Galleries Tab */}
          <TabsContent value="galleries">
            <ImageGalleryManager />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <TimelineManager />
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <MediaManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;