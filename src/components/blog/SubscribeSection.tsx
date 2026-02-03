import { useState } from "react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function SubscribeSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      // Call Supabase Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      setIsSubscribed(true);
      setEmail("");
      toast.success(data.message || "Đăng ký thành công!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
        <p className="text-xs text-muted-foreground/60 mt-1">
          Không spam, chỉ gửi khi có bài mới.
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
