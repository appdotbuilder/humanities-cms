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
  Globe,
  ArrowLeft
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
import { PublicBlog } from '@/components/PublicBlog';
import { BlogPostEditor } from '@/components/BlogPostEditor';
import { StaticPageEditor } from '@/components/StaticPageEditor';
import { ProjectEditor } from '@/components/ProjectEditor';
import { MediaManager } from '@/components/MediaManager';
import { TimelineManager } from '@/components/TimelineManager';
import { ImageGalleryManager } from '@/components/ImageGalleryManager';

function App() {
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
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

  // Show public blog view
  if (viewMode === 'public') {
    return <PublicBlog onAdminMode={() => setViewMode('admin')} />;
  }

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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setViewMode('public')}
                className="text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                📚 Academic CMS Dashboard
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Welcome back, Professor
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="blog" className="text-xs sm:text-sm">Blog Posts</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs sm:text-sm">Static Pages</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs sm:text-sm">Projects</TabsTrigger>
            <TabsTrigger value="galleries" className="text-xs sm:text-sm">Galleries</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
            <TabsTrigger value="media" className="text-xs sm:text-sm">Media</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <PenTool className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{blogPosts.length}</p>
                    <p className="text-sm sm:text-base text-gray-600">Blog Posts</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{staticPages.length}</p>
                    <p className="text-sm sm:text-base text-gray-600">Static Pages</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <Project className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{projects.length}</p>
                    <p className="text-sm sm:text-base text-gray-600">Projects</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <Image className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2 sm:mb-0" />
                  <div className="sm:ml-4">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{media.length}</p>
                    <p className="text-sm sm:text-base text-gray-600">Media Files</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Recent Content</h3>
              <div className="space-y-4">
                {[...blogPosts, ...staticPages]
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 5)
                  .map((item: BlogPost | StaticPage) => (
                    <div key={`${'published_at' in item ? 'blog' : 'page'}-${item.id}`} 
                         className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex items-center">
                        {'published_at' in item ? 
                          <PenTool className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" /> :
                          <FileText className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        }
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{item.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Updated {formatDate(item.updated_at)}
                          </p>
                        </div>
                      </div>
                      <div className="self-start sm:self-center">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>

          {/* Blog Posts Tab */}
          <TabsContent value="blog" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Blog Posts</h2>
              <Button onClick={() => setShowBlogEditor(true)} className="self-start sm:self-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {blogPosts.map((post: BlogPost) => (
                <Card key={post.id} className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 pr-2">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {post.published_at ? formatDate(post.published_at) : 'Not published'}
                        </span>
                        <span className="hidden sm:inline">Updated {formatDate(post.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit('blog', post)}
                          className="px-2 sm:px-3"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('blog', post.id)}
                          className="px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Static Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Static Pages</h2>
              <Button onClick={() => setShowPageEditor(true)} className="self-start sm:self-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Page</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {staticPages.map((page: StaticPage) => (
                <Card key={page.id} className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                        <h3 className="text-base sm:text-lg font-semibold">{page.title}</h3>
                        {page.is_homepage && (
                          <Badge className="bg-blue-100 text-blue-800 self-start">
                            Homepage
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="truncate">/{page.slug}</span>
                        </span>
                        <span className="hidden sm:inline">Updated {formatDate(page.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(page.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit('page', page)}
                          className="px-2 sm:px-3"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('page', page.id)}
                          className="px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Projects</h2>
              <Button onClick={() => setShowProjectEditor(true)} className="self-start sm:self-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {projects.map((project: ProjectType) => (
                <Card key={project.id} className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-3">{project.description}</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                        {project.technologies.slice(0, 4).map((tech: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.technologies.length - 4}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                        {project.start_date && (
                          <span>{formatDate(project.start_date)}</span>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
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
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit('project', project)}
                          className="px-2 sm:px-3"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('project', project.id)}
                          className="px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:ml-1 sm:inline">Delete</span>
                        </Button>
                      </div>
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