export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  tag: string;
  tagColor: 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'yellow';
  date: string;
  readTime: string;
  slug: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Thiết kế UX/UI cho ứng dụng di động",
    excerpt: "Những nguyên tắc cơ bản và best practices khi thiết kế giao diện người dùng cho mobile app.",
    content: "Nội dung chi tiết về thiết kế UX/UI...",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
    tag: "Design",
    tagColor: "pink",
    date: "20 Dec 2024",
    readTime: "5 min read",
    slug: "thiet-ke-uxui-mobile"
  },
  {
    id: "2",
    title: "Học React từ con số 0",
    excerpt: "Hướng dẫn chi tiết từng bước để bắt đầu với React - thư viện JavaScript phổ biến nhất.",
    content: "Nội dung chi tiết về React...",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
    tag: "React",
    tagColor: "blue",
    date: "18 Dec 2024",
    readTime: "8 min read",
    slug: "hoc-react-tu-dau"
  },
  {
    id: "3",
    title: "Tối ưu hiệu suất website",
    excerpt: "Các kỹ thuật và công cụ giúp website của bạn load nhanh hơn và mượt mà hơn.",
    content: "Nội dung chi tiết về performance...",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    tag: "Performance",
    tagColor: "green",
    date: "15 Dec 2024",
    readTime: "6 min read",
    slug: "toi-uu-hieu-suat-website"
  },
  {
    id: "4",
    title: "TypeScript cho người mới bắt đầu",
    excerpt: "Làm quen với TypeScript và tại sao bạn nên sử dụng nó trong dự án JavaScript.",
    content: "Nội dung chi tiết về TypeScript...",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&h=400&fit=crop",
    tag: "TypeScript",
    tagColor: "purple",
    date: "12 Dec 2024",
    readTime: "7 min read",
    slug: "typescript-cho-nguoi-moi"
  },
  {
    id: "5",
    title: "CSS Grid và Flexbox trong thực tế",
    excerpt: "So sánh và hướng dẫn sử dụng CSS Grid và Flexbox cho layout hiện đại.",
    content: "Nội dung chi tiết về CSS layout...",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&h=400&fit=crop",
    tag: "CSS",
    tagColor: "orange",
    date: "10 Dec 2024",
    readTime: "6 min read",
    slug: "css-grid-flexbox"
  },
  {
    id: "6",
    title: "Xây dựng API với Node.js",
    excerpt: "Từng bước xây dựng RESTful API với Express.js và MongoDB.",
    content: "Nội dung chi tiết về Node.js API...",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
    tag: "Backend",
    tagColor: "yellow",
    date: "8 Dec 2024",
    readTime: "10 min read",
    slug: "xay-dung-api-nodejs"
  }
];

export const tags = [
  { name: "All", color: "default" as const },
  { name: "Design", color: "pink" as const },
  { name: "React", color: "blue" as const },
  { name: "Performance", color: "green" as const },
  { name: "TypeScript", color: "purple" as const },
  { name: "CSS", color: "orange" as const },
  { name: "Backend", color: "yellow" as const },
];

export const profile = {
  name: "Hieu Dinh",
  bio: "Solopreneur | AI Enthusiast",
  avatar: "/src/assets/avatar.jpg",
  location: "Hanoi, Vietnam",
  work: "Solopreneur",
  social: {
    threads: "https://threads.net/@to.hieuuu",
    github: "https://github.com/dige04",
    linkedin: "https://www.linkedin.com/in/dinhthanhhieu/",
    instagram: "https://instagram.com/to.hieuuu"
  }
};
