'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import Dialog from './Dialog';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  memory_id: string;
  user_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function BlogPostViewer() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const { user } = useAuth();

  const showDialog = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', showCancel = false, onConfirm?: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      showCancel,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (user) {
      fetchBlogPosts();
    }
  }, [user]);

  const fetchBlogPosts = async () => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blog posts:', error);
        return;
      }

      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlogPost = async (id: string) => {
    if (!supabase) return;

    showDialog(
      'Delete Blog Post',
      'Are you sure you want to delete this blog post? This action cannot be undone.',
      'warning',
      true,
      async () => {
        try {
          if (!supabase) return;
          
          const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Error deleting blog post:', error);
            showDialog('Error', 'Failed to delete blog post. Please try again.', 'error');
            return;
          }

          setBlogPosts(blogPosts.filter(post => post.id !== id));
          if (selectedPost?.id === id) {
            setSelectedPost(null);
          }
          showDialog('Success', 'Blog post deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting blog post:', error);
          showDialog('Error', 'Failed to delete blog post. Please try again.', 'error');
        }
      }
    );
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showDialog('Success', 'Blog post copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showDialog('Error', 'Failed to copy to clipboard. Please try again.', 'error');
    }
  };

  const downloadAsMarkdown = (post: BlogPost) => {
    const element = document.createElement('a');
    const file = new Blob([post.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary">Loading blog posts...</div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedPost(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Blog Posts
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(selectedPost.content)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Copy
            </button>
            <button
              onClick={() => downloadAsMarkdown(selectedPost)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Download
            </button>
            <button
              onClick={() => deleteBlogPost(selectedPost.id)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="text-3xl font-bold text-main mb-4">{selectedPost.title}</h1>
          <div className="text-sm text-secondary mb-6">
            Created: {new Date(selectedPost.created_at).toLocaleDateString()}
            {selectedPost.updated_at !== selectedPost.created_at && (
              <span> • Updated: {new Date(selectedPost.updated_at).toLocaleDateString()}</span>
            )}
          </div>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: selectedPost.content.replace(/\n/g, '<br>').replace(/# (.*)/g, '<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-main">Your Blog Posts</h2>
        <div className="text-sm text-secondary">
          {blogPosts.length} {blogPosts.length === 1 ? 'post' : 'posts'}
        </div>
      </div>

      {blogPosts.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">No blog posts yet</p>
          <p className="text-sm">Create memories through conversations to generate blog posts!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 
                  className="text-lg font-semibold text-main cursor-pointer hover:text-indigo-600"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.title}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => copyToClipboard(post.content)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => downloadAsMarkdown(post)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => deleteBlogPost(post.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-2 line-clamp-3">
                {post.content.replace(/# (.*)/g, '').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 200)}...
              </p>
              <div className="text-xs text-gray-400">
                Created: {new Date(post.created_at).toLocaleDateString()}
                {post.updated_at !== post.created_at && (
                  <span> • Updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        showCancel={dialog.showCancel}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
