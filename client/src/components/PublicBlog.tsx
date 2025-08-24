import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  ArrowLeft, 
  Search, 
  User, 
  BookOpen, 
  ExternalLink,
  Github,
  Home,
  FileText,
  Clock,
  GraduationCap,
  Briefcase,
  ChevronRight
} from 'lucide-react';

// Import types
import type { 
  BlogPost, 
  StaticPage, 
  Project as ProjectType,
  TimelineEntry
} from '../../../server/src/schema';

type ViewMode = 'home' | 'blog' | 'post' | 'page' | 'projects' | 'about' | 'timeline';

interface PublicBlogProps {
  onAdminMode: () => void;
}

export function PublicBlog({ onAdminMode }: PublicBlogProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedItem, setSelectedItem] = useState<BlogPost | StaticPage | ProjectType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Content states
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [homepage, setHomepage] = useState<StaticPage | null>(null);

  // Load content
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        postsResult,
        pagesResult, 
        projectsResult,
        timelineResult,
        homepageResult
      ] = await Promise.all([
        trpc.getBlogPosts.query(),
        trpc.getStaticPages.query(),
        trpc.getProjects.query(),
        trpc.getTimelineEntries.query(),
        trpc.getHomepage.query().catch(() => null)
      ]);
      
      // Only show published content
      setBlogPosts(postsResult.filter(post => post.status === 'published'));
      setStaticPages(pagesResult.filter(page => page.status === 'published'));
      setProjects(projectsResult.filter(project => project.status === 'published'));
      setTimelineEntries(timelineResult);
      setHomepage(homepageResult);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredBlogPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const Navigation = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => {
                setCurrentView('home');
                setSelectedItem(null);
              }}
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              📚 Dr. Academic
            </button>
            
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => setCurrentView('home')}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                  currentView === 'home' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="h-4 w-4 inline mr-1" />
                Home
              </button>
              <button
                onClick={() => setCurrentView('blog')}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                  currentView === 'blog' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-1" />
                Blog
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                  currentView === 'projects' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Projects
              </button>
              <button
                onClick={() => setCurrentView('about')}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                  currentView === 'about' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="h-4 w-4 inline mr-1" />
                About
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onAdminMode}
              className="hidden sm:flex text-xs sm:text-sm"
            >
              Admin Dashboard
            </Button>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={onAdminMode}
                className="text-xs"
              >
                Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-3 border-t border-gray-100">
          <div className="flex space-x-2 pt-3 overflow-x-auto">
            {[
              { key: 'home', label: 'Home', icon: Home },
              { key: 'blog', label: 'Blog', icon: BookOpen },
              { key: 'projects', label: 'Projects', icon: FileText },
              { key: 'about', label: 'About', icon: User }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as ViewMode)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  currentView === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );

  const HomeView = () => (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
          Welcome to My Academic Space
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 px-4">
          Exploring ideas, sharing research, and connecting with the academic community
        </p>
        <Button 
          onClick={() => setCurrentView('blog')}
          className="text-base sm:text-lg px-6 sm:px-8 py-3"
        >
          Explore My Blog
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Homepage Content */}
      {homepage && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="prose prose-base sm:prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: homepage.content }} />
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {blogPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recent Posts</h2>
            <Button
              variant="outline"
              onClick={() => setCurrentView('blog')}
              className="text-sm sm:text-base"
            >
              View All Posts
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div onClick={() => {
                  setSelectedItem(post);
                  setCurrentView('post');
                }}>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {projects.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Projects</h2>
            <Button
              variant="outline"
              onClick={() => setCurrentView('projects')}
              className="text-sm sm:text-base"
            >
              View All Projects
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {projects.slice(0, 2).map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-3">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 3).map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.technologies.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.technologies.length - 3} more
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Project
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      GitHub
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const BlogView = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Posts</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full sm:w-80"
          />
        </div>
      </div>

      {filteredBlogPosts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {searchQuery ? 'No posts found matching your search.' : 'No blog posts published yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {filteredBlogPosts.map((post) => (
            <Card 
              key={post.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedItem(post);
                setCurrentView('post');
              }}
            >
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900 line-clamp-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-4">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const PostView = () => {
    const post = selectedItem as BlogPost;
    if (!post) return null;

    return (
      <article className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentView('blog')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-600 text-sm sm:text-base">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
            </span>
          </div>
        </div>

        <div className="prose prose-base sm:prose-lg lg:prose-xl max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
    );
  };

  const ProjectsView = () => (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">No projects published yet.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900">
                {project.title}
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {project.description}
              </p>
              
              {project.content && (
                <div className="prose prose-sm mb-6 max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: truncateText(project.content, 200) + (project.content.length > 200 ? '...' : '')
                  }} />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {project.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-3 text-sm">
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Project
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      GitHub
                    </a>
                  )}
                </div>
                
                {project.start_date && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(project.start_date)}
                    {project.end_date && ` - ${formatDate(project.end_date)}`}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const AboutView = () => {
    const aboutPage = staticPages.find(page => page.slug === 'about');
    const careerEntries = timelineEntries.filter(entry => entry.entry_type === 'career');
    const educationEntries = timelineEntries.filter(entry => entry.entry_type === 'education');

    return (
      <div className="space-y-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About Me</h1>

        {aboutPage && (
          <div className="prose prose-base sm:prose-lg lg:prose-xl max-w-4xl">
            <div dangerouslySetInnerHTML={{ __html: aboutPage.content }} />
          </div>
        )}

        {/* Career Timeline */}
        {careerEntries.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Briefcase className="h-6 w-6 mr-2" />
              Career
            </h2>
            <div className="space-y-6">
              {careerEntries
                .sort((a, b) => b.sort_order - a.sort_order)
                .map((entry) => (
                  <Card key={entry.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {entry.title}
                        </h3>
                        <p className="text-base text-blue-600 font-medium">
                          {entry.organization}
                        </p>
                        {entry.location && (
                          <p className="text-sm text-gray-600">{entry.location}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-2 sm:mt-0 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(entry.start_date)}
                        {entry.is_current ? ' - Present' : entry.end_date ? ` - ${formatDate(entry.end_date)}` : ''}
                      </div>
                    </div>
                    {entry.description && (
                      <p className="text-gray-700 text-sm sm:text-base">
                        {entry.description}
                      </p>
                    )}
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Education Timeline */}
        {educationEntries.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <GraduationCap className="h-6 w-6 mr-2" />
              Education
            </h2>
            <div className="space-y-6">
              {educationEntries
                .sort((a, b) => b.sort_order - a.sort_order)
                .map((entry) => (
                  <Card key={entry.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {entry.title}
                        </h3>
                        <p className="text-base text-blue-600 font-medium">
                          {entry.organization}
                        </p>
                        {entry.location && (
                          <p className="text-sm text-gray-600">{entry.location}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-2 sm:mt-0 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(entry.start_date)}
                        {entry.is_current ? ' - Present' : entry.end_date ? ` - ${formatDate(entry.end_date)}` : ''}
                      </div>
                    </div>
                    {entry.description && (
                      <p className="text-gray-700 text-sm sm:text-base">
                        {entry.description}
                      </p>
                    )}
                  </Card>
                ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const PageView = () => {
    const page = selectedItem as StaticPage;
    if (!page) return null;

    return (
      <article className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setCurrentView('home')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {page.title}
          </h1>
        </div>

        <div className="prose prose-base sm:prose-lg lg:prose-xl max-w-none">
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </article>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'blog':
        return <BlogView />;
      case 'post':
        return <PostView />;
      case 'page':
        return <PageView />;
      case 'projects':
        return <ProjectsView />;
      case 'about':
        return <AboutView />;
      default:
        return <HomeView />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-600 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {renderCurrentView()}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 sm:mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              © 2024 Dr. Academic. All rights reserved.
            </p>
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={onAdminMode}
                className="text-xs sm:text-sm text-gray-500"
              >
                Admin Access
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}