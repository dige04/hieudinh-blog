import { Github, Twitter, Linkedin, Instagram, Mail, MapPin, Briefcase, Heart } from "lucide-react";
import { profile } from "@/data/blogData";

const About = () => {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Bento Grid Container */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Profile Card - Large */}
          <div className="col-span-2 row-span-2 bg-background rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-border">
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="w-28 h-28 rounded-full object-cover mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground mb-2">{profile.name}</h1>
            <p className="text-muted-foreground text-sm max-w-xs">{profile.bio}</p>
          </div>

          {/* Twitter Card */}
          <a 
            href={profile.social.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center border border-border hover:bg-muted/50 transition-colors group"
          >
            <Twitter className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform" />
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

          {/* Location Card - Wide */}
          <div className="col-span-2 row-span-1 bg-background rounded-3xl p-6 flex items-center gap-4 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <MapPin className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
              <p className="text-foreground font-medium">Ho Chi Minh City, Vietnam</p>
            </div>
          </div>

          {/* Work Card - Wide */}
          <div className="col-span-2 row-span-1 bg-background rounded-3xl p-6 flex items-center gap-4 border border-border">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Work</p>
              <p className="text-foreground font-medium">Frontend Developer</p>
            </div>
          </div>

          {/* About Text Card - Full Width */}
          <div className="col-span-2 md:col-span-4 row-span-1 bg-background rounded-3xl p-8 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">Về tôi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Xin chào! Tôi là một Frontend Developer với niềm đam mê thiết kế và xây dựng các sản phẩm web đẹp mắt, 
              thân thiện với người dùng. Tôi thích khám phá công nghệ mới và chia sẻ kiến thức qua blog của mình.
            </p>
          </div>

          {/* Email Card */}
          <a 
            href="mailto:hello@example.com"
            className="col-span-2 row-span-1 bg-foreground rounded-3xl p-6 flex items-center justify-center gap-3 text-background hover:opacity-90 transition-opacity"
          >
            <Mail className="w-5 h-5" />
            <span className="font-medium">Liên hệ với tôi</span>
          </a>

          {/* Interests Card */}
          <div className="col-span-2 row-span-1 bg-background rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Interests</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["UI/UX", "React", "TypeScript", "Design Systems", "Photography"].map((interest) => (
                <span 
                  key={interest}
                  className="px-3 py-1 bg-muted rounded-full text-sm text-foreground"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Back to Blog Link */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Quay lại Blog
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
