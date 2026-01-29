import { Link } from "react-router-dom";
import { BlogPost } from "@/data/blogData";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link to={`/blog/${post.slug}`}>
      <article className="group cursor-pointer py-4 flex gap-4">
        {/* Thumbnail - Left side, horizontal & rounded */}
        <div className="flex-shrink-0">
          <img 
            src={post.thumbnail} 
            alt={post.title}
            className="w-28 h-20 md:w-40 md:h-28 object-cover rounded-lg"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-base md:text-lg font-semibold text-foreground group-hover:underline transition-colors mb-1 md:mb-2 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
