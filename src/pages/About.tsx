import { Github, Linkedin, Instagram, Mail, AtSign, PenSquare } from "lucide-react";
import { profile } from "@/data/blogData";
import avatar from "@/assets/avatar.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Bento Grid Container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Profile Card - Large */}
          <div className="col-span-2 row-span-2 bg-background rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-border">
            <img 
              src={avatar} 
              alt={profile.name}
              className="w-28 h-28 rounded-full object-cover mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground mb-2">{profile.name}</h1>
            <p className="text-muted-foreground text-sm max-w-xs">{profile.bio}</p>
          </div>

          {/* Threads Card */}
          <a 
            href={profile.social.threads}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center border border-border hover:bg-muted/50 transition-colors group"
          >
            <AtSign className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform" />
          </a>

          {/* GitHub Card */}
          <a 
            href={profile.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center border border-border hover:bg-muted/50 transition-colors group"
          >
            <Github className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform" />
          </a>

          {/* LinkedIn Card */}
          <a 
            href={profile.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center border border-border hover:bg-muted/50 transition-colors group"
          >
            <Linkedin className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform" />
          </a>

          {/* Instagram Card */}
          <a 
            href={profile.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center border border-border hover:bg-muted/50 transition-colors group"
          >
            <Instagram className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform" />
          </a>


          {/* Email Card */}
          <a 
            href="mailto:hi@hieudinh.dev"
            className="col-span-2 md:col-span-4 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center gap-3 border border-border hover:bg-muted/50 transition-colors"
          >
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">hi@hieudinh.dev</span>
          </a>

          {/* Blog Card */}
          <a 
            href="/blog"
            className="col-span-2 md:col-span-4 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center gap-3 border border-border hover:bg-muted/50 transition-colors group"
          >
            <PenSquare className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
            <span className="text-foreground font-medium">Blog</span>
          </a>

        </div>
      </div>
    </div>
  );
};

export default About;
