import { BlogPost } from "@/data/blogData";

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
}

export function BlogCard({ post, onClick }: BlogCardProps) {
  return (
    <article 
      className="group cursor-pointer py-6 border-b border-border last:border-b-0 flex gap-6"
      onClick={onClick}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground uppercase tracking-wide">
          {post.tag}
        </span>
        <h2 className="text-xl font-semibold text-foreground group-hover:underline transition-colors mt-1 mb-2 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <img 
          src={post.thumbnail} 
          alt={post.title}
          className="w-24 h-24 md:w-28 md:h-28 object-cover rounded"
        />
      </div>
    </article>
  );
}
