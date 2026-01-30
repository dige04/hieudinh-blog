import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { blogPosts, profile } from "@/data/blogData";
import avatar from "@/assets/avatar.jpg";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy bài viết</h1>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
            ← Quay lại trang blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>{post.tag}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground">
            {post.excerpt}
          </p>
        </header>

        {/* Featured Image */}
        <div className="mb-8">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-auto rounded-lg object-cover aspect-video"
          />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg prose-slate dark:prose-invert max-w-none font-serif
            prose-headings:font-bold prose-headings:font-sans
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal prose-code:before:content-none prose-code:after:content-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Section */}
        <footer className="mt-12 pt-8 border-t border-border">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img
              src={avatar}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          </Link>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;
