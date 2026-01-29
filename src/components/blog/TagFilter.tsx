import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tag {
  name: string;
  color: 'default' | 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'yellow';
}

interface TagFilterProps {
  tags: Tag[];
  selectedTag: string;
  onTagSelect: (tag: string) => void;
}

const tagColorClasses: Record<string, { active: string; inactive: string }> = {
  default: { 
    active: "bg-foreground text-background", 
    inactive: "bg-secondary text-foreground hover:bg-muted" 
  },
  pink: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-pink/10 text-tag-pink hover:bg-tag-pink/20" 
  },
  orange: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-orange/10 text-tag-orange hover:bg-tag-orange/20" 
  },
  green: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-green/10 text-tag-green hover:bg-tag-green/20" 
  },
  blue: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-blue/10 text-tag-blue hover:bg-tag-blue/20" 
  },
  purple: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-purple/10 text-tag-purple hover:bg-tag-purple/20" 
  },
  yellow: { 
    active: "bg-foreground text-background", 
    inactive: "bg-tag-yellow/10 text-tag-yellow hover:bg-tag-yellow/20" 
  },
};

export function TagFilter({ tags, selectedTag, onTagSelect }: TagFilterProps) {
  return (
    <div className="flex gap-2 whitespace-nowrap">
      {tags.map((tag) => {
        const isActive = selectedTag === tag.name;
        const colorClass = tagColorClasses[tag.color];
        
        return (
          <button
            key={tag.name}
            type="button"
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors flex-shrink-0",
              isActive ? colorClass.active : colorClass.inactive
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTagSelect(tag.name);
            }}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
