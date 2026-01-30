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
    title: "Kiến trúc RAG cho Threat Intelligence: Từ Lý thuyết đến Triển khai Thực tế",
    excerpt: "Đi sâu vào kỹ thuật xây dựng hệ thống Retrieval-Augmented Generation (RAG) quy mô lớn. Tối ưu hóa Vector Database, chiến lược Chunking và giải quyết bài toán Lost-in-the-middle.",
    content: `
      <h2>1. Tại sao RAG lại quan trọng trong Cybersecurity?</h2>
      <p>Trong lĩnh vực an ninh mạng, thông tin về các lỗ hổng (CVE), mã độc (Malware hash), và các chiến dịch tấn công (APT) được cập nhật hàng giây. Các mô hình ngôn ngữ lớn (LLM) dù mạnh mẽ đến đâu cũng không thể bắt kịp tốc độ này chỉ bằng việc pre-training. <strong>RAG (Retrieval-Augmented Generation)</strong> chính là "cây cầu" nối giữa khả năng suy luận của LLM và kho tri thức thời gian thực.</p>
      
      <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070" alt="Cybersecurity Dashboard" class="w-full rounded-lg my-6" />

      <h2>2. Kiến trúc Data Pipeline chuẩn cho RAG</h2>
      <p>Một hệ thống RAG production-ready không chỉ có LLM và Vector DB. Nó là một pipeline dữ liệu phức tạp gồm 4 giai đoạn:</p>
      
      <h3>2.1. Ingestion (Thu thập)</h3>
      <p>Dữ liệu threat intelligence đến từ nhiều nguồn:</p>
      <ul>
        <li><strong>Structured:</strong> Các bảng tính CSV, JSON từ API (VirusTotal, AlienVault).</li>
        <li><strong>Unstructured:</strong> Báo cáo PDF, bài viết trên blog an ninh mạng, Dark web forums.</li>
      </ul>

      <h3>2.2. Parsing & Chunking (Xử lý)</h3>
      <p>Đây là bước quyết định chất lượng của RAG. Thay vì cắt văn bản theo độ dài cố định (fixed-size chunking) - ví dụ cứ 500 từ cắt 1 lần, chúng ta nên sử dụng <strong>Semantic Chunking</strong>.</p>
      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Ví dụ:</strong> Một báo cáo malware thường có cấu trúc: "Tổng quan" -> "Hành vi kỹ thuật" -> "IOCs". Chúng ta cần tách riêng phần IOCs (Hash, IP) để khi user search cụ thể về một IP, hệ thống retrieve đúng đoạn đó thay vì đoạn văn mô tả chung chung.
      </div>

      <h3>2.3. Embedding & Indexing</h3>
      <p>Việc lựa chọn model embed phụ thuộc vào domain. Với cybersecurity, các model general như <code>text-embedding-3-small</code> hoạt động ổn, nhưng các model chuyên biệt (fine-tuned on security papers) sẽ cho vector space tốt hơn, giúp phân biệt được sự khác nhau giữa "SQL Injection" và "XSS" dựa trên context code.</p>

      <h2>3. Chiến lược Retrieval nâng cao</h2>
      <p>Với hàng triệu vector, việc search sao cho chính xác là một nghệ thuật.</p>
      
      <h3>3.1. Hybrid Search</h3>
      <p>Vector Search rất giỏi tìm kiếm ngữ nghĩa ("Cách phòng chống tấn công DDoS"), nhưng rất dở trong việc tìm kiếm chính xác ("CVE-2024-1234"). Giải pháp là kết hợp:</p>
      <ul>
        <li><strong>Vector Search (Dense):</strong> Tìm kiếm độ tương đồng về ý nghĩa.</li>
        <li><strong>Keyword Search (Sparse - BM25):</strong> Tìm kiếm từ khóa chính xác.</li>
      </ul>
      <p>Sử dụng thuật toán <strong>Reciprocal Rank Fusion (RRF)</strong> để gộp kết quả từ 2 phương pháp trên.</p>

      <h3>3.2. Re-ranking</h3>
      <p>Sau khi retrieve được Top-50 đoạn văn bản liên quan, chúng ta sử dụng một model <strong>Cross-Encoder</strong> (như BGE-Reranker) để chấm điểm lại kỹ lưỡng hơn và chọn ra Top-5 đoạn thực sự chất lượng để đưa vào context window của LLM. Kỹ thuật này giải quyết vấn đề "Lost in the Middle" (LLM bị nhiễu bởi thông tin không liên quan).</p>

      <img src="https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&q=80&w=2000" alt="AI Data Processing" class="w-full rounded-lg my-6" />

      <h2>4. Kết luận</h2>
      <p>Xây dựng RAG không khó, nhưng xây dựng RAG có độ chính xác cao (High Recall & Precision) là một bài toán khó. Nó đòi hỏi sự kết hợp nhuần nhuyễn giữa kiến thức Data Engineering (Pipeline, Database) và AI Engineering (Prompting, Embedding).</p>
    `,
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    tag: "AI & GenAI",
    tagColor: "blue",
    date: "28 Jan 2026",
    readTime: "12 min read",
    slug: "rag-architecture-deep-dive"
  },
  {
    id: "2",
    title: "Alpha Research 101: Giải mã Toán học đằng sau các Quỹ định lượng",
    excerpt: "Vén màn bí mật của Quant Finance. Làm thế nào để biến dữ liệu thị trường thành tín hiệu giao dịch (Alpha)? Những cạm bẫy thống kê cần tránh khi backtesting.",
    content: `
      <h2>1. Bản chất của Alpha</h2>
      <p>Trong thế giới Quant, Alpha ($\\alpha$) không phải là phép màu. Nó là phần lợi nhuận vượt trội so với rủi ro thị trường (Beta), được tìm ra thông qua việc khai thác các sự thiếu hiệu quả (inefficiencies) của thị trường. Một Alpha tốt thường có công thức dạng:</p>
      <pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>Alpha = Rank(Correlation(Rank(Close), Rank(Volume), 5))</code></pre>
      <p>Đơn giản nhưng sâu sắc. Nó nói rằng: "Hãy mua những cổ phiếu có giá tăng kèm volume tăng".</p>
      
      <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=2000" alt="Financial Charts" class="w-full rounded-lg my-6" />

      <h2>2. Quy trình "đào" Alpha (Alpha Mining)</h2>
      <p>Quy trình nghiên cứu thường đi theo các bước:</p>
      <ul>
        <li><strong>Data Cleaning:</strong> Dữ liệu tài chính cực kỳ "bẩn". Split stocks, dividend adjustments, outliers là những thứ phải xử lý đầu tiên.</li>
        <li><strong>Feature Engineering:</strong> Biến đổi dữ liệu thô (OHLCV) thành các features có ý nghĩa. Ví dụ: Biến động giá (Volatility), Động lượng (Momentum), Dòng tiền (Money Flow).</li>
        <li><strong>Simulation (Backtesting):</strong> Chạy giả lập trên dữ liệu quá khứ. Lưu ý quan trọng: <em>Look-ahead Bias</em> (nhìn trước tương lai) là lỗi sơ đẳng nhưng chí mạng.</li>
      </ul>

      <h2>3. Cạm bẫy rủi ro: Overfitting & P-Hacking</h2>
      <p>Đây là lý do 90% các mô hình thất bại khi live trading. Nếu bạn thử 1000 biến số để tìm ra 1 biến số có tương quan ngẫu nhiên với giá, đó là P-hacking. Để tránh điều này, cần:</p>
      <ul>
        <li>Sử dụng tập dữ liệu Out-of-sample (OOS) để kiểm định.</li>
        <li>Giữ mô hình đơn giản (Occam's Razor).</li>
        <li>Hiểu rõ bản chất kinh tế (Economic Rationale) đằng sau con số, thay vì chỉ tin vào Data Mining.</li>
      </ul>
    `,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
    tag: "Quant Finance",
    tagColor: "purple",
    date: "15 Dec 2025",
    readTime: "15 min read",
    slug: "quantitative-finance-alpha-math"
  },
  {
    id: "3",
    title: "Deep Dive into Apache Spark Streaming: Xử lý dữ liệu quy mô Petabyte",
    excerpt: "Phân tích sâu về Structured Streaming, cơ chế quản lý State, Watermarking và cách tuning performance cho các ứng dụng Big Data thời gian thực.",
    content: `
      <h2>1. Structured Streaming: Tư duy thay đổi cuộc chơi</h2>
      <p>Trước đây, Spark Streaming (DStream) xử lý dữ liệu theo từng micro-batch rời rạc. <strong>Structured Streaming</strong> tiếp cận vấn đề theo cách khác: coi dòng dữ liệu vô hạn (unbounded stream) như một cái bảng (table) không giới hạn cứ liên tục được append thêm rows mới. Điều này cho phép chúng ta dùng SQL và DataFrame API quen thuộc để xử lý streaming data.</p>
      
      <img src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=2000" alt="Big Data Server" class="w-full rounded-lg my-6" />

      <h2>2. Bài toán Event-Time và Late Data</h2>
      <p>Dữ liệu real-time thường không đến đúng thứ tự. Một event xảy ra lúc 10:00 nhưng có thể đến server lúc 10:05 do mạng lag. Để xử lý chính xác (Window Aggregation), chúng ta cần dùng <strong>Event Time</strong> thay vì Processing Time.</p>
      <p>Tuy nhiên, hệ thống không thể chờ mãi mãi. Đó là lúc <strong>Watermarking</strong> xuất hiện. Watermark là một ngưỡng thời gian (threshold) cho phép hệ thống "chốt sổ". Ví dụ: "Chỉ chấp nhận dữ liệu trễ tối đa 10 phút". Mọi dữ liệu đến sau mốc này sẽ bị drop để giải phóng bộ nhớ (State Store).</p>

      <h2>3. Under the hood: State Management</h2>
      <p>Khi thực hiện các phép tính tích lũy (như <code>count()</code>, <code>sum()</code> over time), Spark phải lưu trạng thái trung gian. Mặc định nó dùng In-memory, nhưng với workload lớn, ta nên chuyển sang <strong>RocksDB State Store Provider</strong>. RocksDB lưu state xuống ổ đĩa cục bộ (SSD), giúp scale được lượng state lớn hơn nhiều so với RAM heap size, tránh lỗi OOM (Out Of Memory) kinh điển.</p>

      <h2>4. Checkpointing & Fault Tolerance</h2>
      <p>Để đảm bảo "Exactly-once thinking", Checkpoint là bắt buộc. Nó lưu vị trí (offset) của Kafka consumer và metadata của query xuống HDFS/S3. Nếu worker chết, Spark driver sẽ đọc checkpoint và tiếp tục xử lý từ đúng vị trí đó, đảm bảo không mất và không lặp dữ liệu.</p>
    `,
    thumbnail: "https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800",
    tag: "Data Engineering",
    tagColor: "blue",
    date: "10 Nov 2025",
    readTime: "10 min read",
    slug: "spark-streaming-deep-dive"
  },
  {
    id: "4",
    title: "Từ Chatbot đến Autonomous Agent: Thiết kế Hệ thống AI biết Tự hành động",
    excerpt: "Khám phá các pattern thiết kế AI Agent phổ biến như ReAct, Plan-and-Solve. Cách trang bị 'tay chân' (Tools) cho LLM để thực hiện tác vụ phức tạp.",
    content: `
      <h2>1. Sự chuyển dịch: Copilot vs Autopilot</h2>
      <p>Chúng ta đang trải qua một bước ngoặt lớn trong lịch sử phát triển AI: sự chuyển dịch từ <strong>Generative AI</strong> (AI tạo sinh) sang <strong>Agentic AI</strong> (AI tác nhân). Nếu như ChatGPT hay Claude chỉ dừng lại ở việc là một "người thảo luận" (Copilot) thông thái, thì AI Agent hướng tới việc trở thành một "nhân viên" (Autopilot) có khả năng tự chủ hoàn thành công việc.</p>
      
      <p>Sự khác biệt cốt lõi nằm ở tính chủ động (Agency):</p>
      <ul>
        <li><strong>Chatbot (Passive):</strong> User hỏi -> Bot trả lời dựa trên training data.</li>
        <li><strong>Agent (Active):</strong> User giao mục tiêu -> Bot tự suy luận (Reasoning) -> Lập kế hoạch (Planning) -> Sử dụng công cụ (Tool Use) -> Thực thi và kiểm tra lại kết quả (Reflection).</li>
      </ul>
      
      <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=2000" alt="Artificial Intelligence Neural Network" class="w-full rounded-lg my-6" />

      <h2>2. Giải phẫu một AI Agent</h2>
      <p>Để xây dựng một Agent, chúng ta cần nhiều hơn một LLM. Lilian Weng (OpenAI) đã mô tả một hệ thống Agent bao gồm 4 thành phần chính:</p>
      
      <h3>2.1. The Brain (LLM)</h3>
      <p>Đây là bộ xử lý trung tâm, chịu trách nhiệm hiểu mệnh lệnh, suy luận và ra quyết định. Hiện tại, GPT-4o và Claude 3.5 Sonnet đang là những "bộ não" tốt nhất cho Agent nhờ khả năng reasoning vượt trội và context window lớn.</p>

      <h3>2.2. Memory (Bộ nhớ)</h3>
      <p>Một Agent thông minh cần nhớ những gì nó đã làm:</p>
      <ul>
        <li><strong>Short-term memory:</strong> Lưu trữ ngữ cảnh của hội thoại hiện tại (In-context learning).</li>
        <li><strong>Long-term memory:</strong> Sử dụng Vector Database (như Pinecone, Milvus) để lưu trữ và truy xuất thông tin từ quá khứ, giúp Agent "học" từ kinh nghiệm.</li>
      </ul>

      <h3>2.3. Tools (Công cụ)</h3>
      <p>Đây là "tay chân" của Agent. Tools có thể là:</p>
      <ul>
        <li>Search Engine (Google Search, Tavily) để lấy thông tin real-time.</li>
        <li>Code Interpreter (Python REPL) để tính toán hoặc vẽ biểu đồ.</li>
        <li>External APIs (Jira, Slack, HubSpot) để tương tác với thế giới thực.</li>
      </ul>

      <h3>2.4. Planning (Lập kế hoạch)</h3>
      <p>Khả năng chia nhỏ một task lớn ("Nghiên cứu thị trường EV") thành các sub-task nhỏ ("Tìm data doanh số", "Phân tích đối thủ", "Viết báo cáo").</p>

      <h2>3. ReAct Pattern: Trái tim của Agent</h2>
      <p>Năm 2022, các nhà nghiên cứu tại Google & Princeton giới thiệu <strong>ReAct (Reasoning + Acting)</strong>, một kỹ thuật prompting giúp LLM giải quyết vấn đề bằng cách luân phiên giữa suy nghĩ và hành động.</p>
      
      <div class="bg-secondary/50 p-6 rounded-lg my-6 border border-border">
        <h4 class="font-bold mb-4">Ví dụ về ReAct Loop:</h4>
        <p class="font-mono text-sm mb-2 text-muted-foreground">// User: Apple ra mắt iPhone 15 vào ngày nào?</p>
        <ul class="space-y-3 font-mono text-sm">
          <li class="pl-4 border-l-2 border-blue-500">
            <span class="text-blue-500 font-bold">Thought:</span> Tôi cần tìm ngày ra mắt chính thức của iPhone 15 series.
          </li>
          <li class="pl-4 border-l-2 border-green-500">
            <span class="text-green-500 font-bold">Action:</span> <code class="bg-background px-2 py-1 rounded">Search("iPhone 15 release date")</code>
          </li>
          <li class="pl-4 border-l-2 border-yellow-500">
            <span class="text-yellow-500 font-bold">Observation:</span> Kết quả tìm kiếm cho thấy sự kiện Apple Event diễn ra ngày 12/9/2023, bán ra từ 22/9/2023.
          </li>
          <li class="pl-4 border-l-2 border-blue-500">
            <span class="text-blue-500 font-bold">Thought:</span> Đã có đủ thông tin. Tôi có thể trả lời ngay.
          </li>
          <li class="pl-4 border-l-2 border-purple-500">
            <span class="text-purple-500 font-bold">Final Answer:</span> Apple ra mắt iPhone 15 vào ngày 12 tháng 9 năm 2023.
          </li>
        </ul>
      </div>

      <h2>4. Triển khai thực tế với LangChain & LangGraph</h2>
      <p>Trong thực tế, việc build một Agent ổn định khó hơn nhiều so với demo. Một số thách thức kỹ thuật:</p>
      
      <h3>4.1. Structured Output</h3>
      <p>LLM thường trả về text tự do, rất khó để parse thành API call. Giải pháp là sử dụng <strong>Function Calling</strong> (OpenAI) hoặc ép kiểu output bằng Pydantic parser để đảm bảo Agent luôn trả về JSON hợp lệ.</p>

      <h3>4.2. Infinite Loops</h3>
      <p>Đôi khi Agent bị kẹt trong vòng lặp suy nghĩ (Thought -> Action -> Error -> Thought...). Cần thiết lập cơ chế <code>max_iterations</code> và timeout để ngăn chặn việc đốt token vô ích.</p>

      <h3>4.3. Multi-Agent Orchestration</h3>
      <p>Thay vì một "Super Agent" làm tất cả, xu hướng hiện nay là mô hình "Đội ngũ chuyên gia". Framework <strong>LangGraph</strong> cho phép định nghĩa một đồ thị (Graph) các state, nơi mỗi node là một Agent chuyên biệt (Researcher, Writer, Reviewer) phối hợp với nhau.</p>

      <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=2000" alt="Coding and AI" class="w-full rounded-lg my-6" />

      <h2>5. Tương lai của Agentic Workflow</h2>
      <p>Andrew Ng đã nhận định: <em>"AI Agentic workflows will drive massive AI progress this year - perhaps even more than the next generation of foundation models."</em></p>
      <p>Chúng ta đang tiến tới tương lai nơi phần mềm không chỉ là công cụ (Tool) mà là đồng nghiệp (Partner). Việc nắm vững kỹ thuật xây dựng Agent không chỉ là bắt trend, mà là chuẩn bị cho sự thay đổi căn bản trong cách con người tương tác với máy tính.</p>
    `,
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
    tag: "AI & GenAI",
    tagColor: "green",
    date: "20 Oct 2025",
    readTime: "15 min read",
    slug: "ai-agents-design-patterns"
  },
  {
    id: "5",
    title: "Data-Driven Community: Xây dựng Hệ sinh thái Công nghệ Bền vững",
    excerpt: "Framework vận hành cộng đồng dựa trên dữ liệu. Làm sao để đo lường Engagement, tối ưu hóa sự kiện và giữ chân thành viên hiệu quả?",
    content: `
      <h2>1. Cộng đồng cũng là một Sản phẩm (Product)</h2>
      <p>Tư duy sai lầm phổ biến: làm cộng đồng là hoạt động phong trào, cảm tính. Thực tế, để một cộng đồng công nghệ phát triển bền vững, cần áp dụng tư duy Product Management. Thành viên là Users, Sự kiện là Features, và Giá trị kiến thức là Value Proposition.</p>
      
      <img src="https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&q=80&w=2000" alt="Tech Community" class="w-full rounded-lg my-6" />

      <h2>2. North Star Metric cho Community</h2>
      <p>Đừng chỉ đếm số lượng thành viên (Vanity Architecture). Hãy tập trung vào:</p>
      <ul>
        <li><strong>Weekly Active Users (WAU):</strong> Số người tương tác hàng tuần.</li>
        <li><strong>Stickiness (DAU/MAU):</strong> Mức độ gắn kết.</li>
        <li><strong>NPS (Net Promoter Score):</strong> Khả năng thành viên giới thiệu cộng đồng cho người khác.</li>
      </ul>

      <h2>3. Chiến lược Nội dung: Kim tự tháp Giá trị</h2>
      <p>Nội dung cộng đồng cần được phân tầng:</p>
      <ul>
        <li><strong>Level 1 (Đại trà):</strong> News, Trend cập nhật. Dễ tiêu thụ, độ lan tỏa cao.</li>
        <li><strong>Level 2 (Chuyên sâu):</strong> Tutorials, Case studies. Dành cho người muốn học hỏi thực sự.</li>
        <li><strong>Level 3 (Kết nối):</strong> Mentorship, Offline Meetups. Đây là nơi tạo ra sự gắn kết sâu sắc nhất (High touch).</li>
      </ul>

      <h2>4. Automation trong Operations</h2>
      <p>Đừng để burn-out vì việc tay chân. Sử dụng no-code tools (Zapier, n8n) để tự động hóa: gửi mail confirm, cấp chứng nhận tham gia, thu thập feedback form. Khi operations chạy tự động, Core Team mới có thời gian suy nghĩ về chiến lược.</p>
    `,
    thumbnail: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&q=80&w=800",
    tag: "Community",
    tagColor: "orange",
    date: "05 Oct 2025",
    readTime: "6 min read",
    slug: "data-driven-community-building"
  }
];

export const tags = [
  { name: "All", color: "default" as const },
  { name: "AI & GenAI", color: "green" as const },
  { name: "Quant Finance", color: "purple" as const },
  { name: "Data Engineering", color: "blue" as const },
  { name: "Community", color: "orange" as const },
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
