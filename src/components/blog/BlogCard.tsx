import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/data/blogData";

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
}

const tagColorClasses: Record<string, string> = {
  pink: "bg-tag-pink text-white",
  orange: "bg-tag-orange text-white",
  green: "bg-tag-green text-white",
  blue: "bg-tag-blue text-white",
  purple: "bg-tag-purple text-white",
  yellow: "bg-tag-yellow text-white",
};

export function BlogCard({ post, onClick }: BlogCardProps) {
  return (
    <article 
      className="group cursor-pointer bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={post.thumbnail} 
          alt={post.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge 
          className={`absolute top-3 left-3 ${tagColorClasses[post.tagColor]} border-0 font-medium`}
        >
          {post.tag}
        </Badge>
      </div>
      
      <div className="p-5">
        <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {post.title}
        </h2>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </article>
  );
}
