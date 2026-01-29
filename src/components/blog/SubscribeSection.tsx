import { useState } from "react";

export function SubscribeSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate subscription
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      setEmail("");
    }, 1000);
  };

  return (
    <section className="py-12 md:py-16 border-t border-border">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Đăng ký nhận bài viết mới
        </h2>
        <p className="text-sm text-muted-foreground">
          Nhận thông báo khi có bài viết mới qua email.
        </p>
      </div>

      {isSubscribed ? (
        <div className="text-center py-4">
          <p className="text-foreground font-medium">Cảm ơn bạn đã đăng ký! ✓</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex border border-border rounded-full overflow-hidden bg-background">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-5 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "..." : "Subscribe"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
