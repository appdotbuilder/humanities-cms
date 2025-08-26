import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Calendar, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { BlogPost, StaticPage } from '../../../server/src/schema';

interface PublicBlogProps {
  onAdminMode: () => void;
}

export function PublicBlog({ onAdminMode }: PublicBlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [homepage, setHomepage] = useState<StaticPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [postsResult, homepageResult] = await Promise.all([
          trpc.getBlogPosts.query().catch(() => []),
          trpc.getHomepage.query().catch(() => null)
        ]);
        
        // Filter published posts only
        const publishedPosts = postsResult.filter((post: BlogPost) => post.status === 'published');
        setPosts(publishedPosts);
        setHomepage(homepageResult);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                📚 Academic Blog
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Thoughts on humanities, teaching, and research
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onAdminMode}
              className="flex items-center text-sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Homepage Content */}
        {homepage && (
          <Card className="p-6 sm:p-8 mb-12 bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {homepage.title}
            </h2>
            <div 
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: homepage.content }}
            />
          </Card>
        )}

        {/* Blog Posts Section */}
        <section>
          <div className="flex items-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mr-4">
              Recent Posts
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>

          {posts.length === 0 ? (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
              <div className="text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p>Check back later for new content!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {posts.map((post: BlogPost) => (
                <Card key={post.id} className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <article>
                    <header className="mb-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Professor
                        </div>
                      </div>
                    </header>

                    {post.excerpt && (
                      <div className="text-gray-700 mb-4 leading-relaxed">
                        {post.excerpt}
                      </div>
                    )}

                    <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 mb-6">
                      <div dangerouslySetInnerHTML={{ 
                        __html: post.content.length > 500 
                          ? post.content.substring(0, 500) + '...'
                          : post.content 
                      }} />
                    </div>

                    <footer>
                      <Button 
                        variant="outline" 
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        Read More →
                      </Button>
                    </footer>
                  </article>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p className="text-sm">
            © 2024 Academic Blog. Built with love for learning and teaching.
          </p>
        </footer>
      </main>
    </div>
  );
}