import { Twitter, Github, Linkedin, Instagram } from "lucide-react";

interface SocialLinksProps {
  links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  size?: "sm" | "md";
}

export function SocialLinks({ links, size = "md" }: SocialLinksProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const containerClass = size === "sm" ? "gap-3" : "gap-4";

  return (
    <div className={`flex items-center ${containerClass}`}>
      {links.twitter && (
        <a 
          href={links.twitter} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Twitter className={iconSize} />
        </a>
      )}
      {links.github && (
        <a 
          href={links.github} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className={iconSize} />
        </a>
      )}
      {links.linkedin && (
        <a 
          href={links.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Linkedin className={iconSize} />
        </a>
      )}
      {links.instagram && (
        <a 
          href={links.instagram} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Instagram className={iconSize} />
        </a>
      )}
    </div>
  );
}
