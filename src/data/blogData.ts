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
    title: "Tuần báo Tech & AI - Tuần 04/2026",
    excerpt: "Tuần này chứng kiến sự bùng nổ của hệ sinh thái công cụ lập trình AI: Claude ra mắt MCP Apps, hệ thống plugin Cowork và tính năng đo lường đóng góp; Kimi K2.5 leo lên vị trí dẫn đầu SWE-Bench; OpenClaw đạt 100.000 GitHub stars.",
    content: `
      <p>Tuần này mình chứng kiến một chuyển dịch khá thú vị: từ việc "AI viết code giúp mình" sang "quản lý cả hệ sinh thái AI code". Claude tung MCP Apps và plugin Cowork, Cline đạt 5 triệu lượt cài, Tessl ra mắt package manager đầu tiên cho Agent Skills. Đặc biệt là Kimi K2.5 với khả năng điều phối 100 agent con chạy song song - mình thấy đây là tín hiệu rõ ràng nhất về tương lai của AI coding.</p>

      <h2>Highlights của tuần</h2>
      <ul>
        <li><strong>Kimi K2.5</strong> - 76.8% trên SWE-Bench, điều phối 100 agent song song. Đáng thử.</li>
        <li><strong>Claude ecosystem</strong> - MCP Apps, Contribution Metrics, Cowork Plugins. Đang xây hệ sinh thái thực sự.</li>
        <li><strong>SERA</strong> - Tái tạo SOTA agent với 400 USD. Mình nghĩ đây là breakthrough về democratization.</li>
        <li><strong>Sam Altman</strong> - Thừa nhận GPT-5 yếu về writing, hứa GPT 5.x sẽ rẻ hơn 100 lần vào 2027.</li>
      </ul>

      <h2>Models</h2>

      <h3>Kimi K2.5 - Agent Swarm thực sự</h3>
      <p><a href="https://www.kimi.com/blog/kimi-k2-5.html" target="_blank">Kimi K2.5</a> của Moonshot AI khiến mình ấn tượng nhất tuần này. 76.8% trên SWE-Bench Verified là tốt, nhưng điểm thực sự đặc biệt là <strong>Agent Swarm</strong> - tự điều phối tới 100 agent con làm việc song song, thực thi hơn 1.500 bước phối hợp. Phương pháp PARL (Parallel Agent Reinforcement Learning) giảm thời gian chạy xuống 4.5 lần.</p>
      <p><em>Theo dõi: Đây có thể là hướng đi mới cho complex coding tasks.</em></p>

      <h3>Qwen3-Max-Thinking - Reasoning đỉnh cao</h3>
      <p>Alibaba ra <a href="https://qwen.ai/blog?id=qwen3-max-thinking" target="_blank">Qwen3-Max-Thinking</a>, sánh ngang GPT-5.2-Thinking và Claude-Opus-4.5. Hai tính năng đáng chú ý: <strong>adaptive tool calling</strong> và <strong>test-time scaling</strong>. Mình thấy adaptive tool calling là điều cần có cho production agents.</p>

      <h3>Arcee AI Trinity Large - MoE từ Mỹ</h3>
      <p><a href="https://www.interconnects.ai/p/arcee-ai-goes-all-in-on-open-models" target="_blank">Trinity Large</a> 400B MoE, Apache 2.0. Điều khiến mình chú ý là đây là model MoE open-source quy mô lớn hiếm hoi từ Mỹ - năm qua các model này hầu như đều từ Trung Quốc.</p>

      <h3>SERA - Train agent với 400 USD</h3>
      <p>AI2 mở nguồn <a href="https://allenai.org/blog/open-coding-agents" target="_blank">SERA</a> với kỹ thuật <strong>soft-verified generation</strong>. Tái tạo SOTA coding agent chỉ tốn 400 USD - mình nghĩ đây là game changer cho những người muốn customize agent theo nhu cầu riêng.</p>

      <h2>Tools</h2>

      <h3>Claude Updates - Xây hệ sinh thái</h3>
      <p>Anthropic đang đẩy mạnh ecosystem development:</p>
      <ul>
        <li><a href="https://claude.com/blog/interactive-tools-in-claude" target="_blank">MCP Apps</a> - Tích hợp Asana, Slack, Figma trực tiếp vào conversation</li>
        <li><a href="https://claude.com/blog/contribution-metrics" target="_blank">Contribution Metrics</a> - Track impact của Claude Code qua GitHub integration</li>
        <li><a href="https://claude.com/blog/cowork-plugins" target="_blank">Cowork Plugins</a> - Package skills, connectors, slash commands thành plugins</li>
      </ul>
      <p><em>Mình đánh giá cao: Đây là cách đúng để scale adoption.</em></p>

      <h3>OpenClaw - 100K stars</h3>
      <p><a href="https://openclaw.ai/blog/introducing-openclaw" target="_blank">OpenClaw</a> rebrand xong với 100K+ stars. Self-hosted AI agent platform cho WhatsApp, Telegram, Discord, Slack, Teams. Đáng thử nếu bạn cần control infrastructure.</p>

      <h3>Tessl Agent Skills - Package manager cho skills</h3>
      <p><a href="https://tessl-io-sanity.vercel.app/blog/skills-are-software-and-they-need-a-lifecycle-introducing-skills-on-tessl/" target="_blank">Tessl</a> ra mắt package manager đầu tiên cho <strong>Agent Skills</strong> với versioning, registry, evaluation. Mình thấy đây là missing piece - skills cần lifecycle management giống software packages.</p>

      <h3>Cline 5M - 1M grant program</h3>
      <p><a href="https://cline.bot/blog/5m-installs-1m-open-source-grant-program" target="_blank">Cline</a> đạt 5 triệu installs, announce 1M USD grant cho open-source projects. Impressive growth.</p>

      <h3>Cognition Agent Trace - Open standard</h3>
      <p><a href="https://cognition.ai/blog/agent-trace" target="_blank">Cognition</a> hợp tác Cursor, Cloudflare, Vercel, Google Jules cho <strong>Agent Trace</strong> standard - ghi lại AI code contribution context. Mình nghĩ standardization là cần thiết cho enterprise adoption.</p>

      <h3>Amp Deep Mode - Long-running research</h3>
      <p><a href="https://ampcode.com/news/deep-mode" target="_blank">Amp</a> ra <strong>deep mode</strong> dùng GPT-5.2-Codex, focus vào autonomous research dài hạn. Niche nhưng powerful cho research workflows.</p>

      <h2>Tin tức đáng chú ý</h2>

      <h3>Sam Altman thừa nhận GPT-5 yếu writing</h3>
      <p><a href="https://baoyu.io/blog/2026/01/27/sam-altman-developer-townhall-gpt5" target="_blank">Tại Developer Town Hall</a>, Sam thừa nhận GPT-5 "messed up" writing quality, cam kết GPT 5.x sẽ tốt hơn GPT 4.5. Điểm thú vị: dự đoán cuối 2027 sẽ có GPT 5.2x intelligence với cost thấp hơn 100 lần.</p>

      <h3>Every.to - Practical insights</h3>
      <p>Hai bài thực chiến hay:</p>
      <ul>
        <li><a href="https://every.to/source-code/how-i-use-claude-code-to-ship-like-a-team-of-five-6f23f136-52ab-455f-a997-101c071613aa" target="_blank">Ship like a team of five với Claude Code</a></li>
        <li><a href="https://every.to/source-code/compound-engineering-how-every-codes-with-agents-af3a1bae-cf9b-458e-8048-c6b4ba860e62" target="_blank">Compound Engineering</a></li>
      </ul>

      <h3>Anthropic Research - AI coding trade-offs</h3>
      <p><a href="https://www.anthropic.com/research/AI-assistance-coding-skills" target="_blank">RCT study</a> cho thấy AI coding assistance làm giảm 17% skill retention. Điều mình nghĩ: tool là để ship faster, learning vẫn cần intentional practice riêng.</p>

      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Góc nhìn của mình:</strong> Tuần này chứng kiến "Toolchain Maturity" - không còn là hype về "AI viết code", mà là infrastructure thực tế để quản lý, track, standardize AI-generated code. Đây là tín hiệu adoption đang chuyển từ early adopters sang mainstream.
      </div>
    `,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    tag: "AI Weekly",
    tagColor: "blue",
    date: "01 Feb 2026",
    readTime: "15 min read",
    slug: "2026-w04"
  },
  {
    id: "2",
    title: "Tuần báo Tech & AI - Tuần 03/2026",
    excerpt: "Tuần này tập trung vào việc AI phát triển từ trợ lý trò chuyện thành mô-đun năng suất được nhúng trong các công cụ và quy trình làm việc. Những điểm nổi bật chính bao gồm việc tích hợp Claude vào Excel, thực tiễn kỹ thuật của OpenAI cho PostgreSQL và sự trưởng thành của hệ sinh thái Agent.",
    content: `
      <p>Tuần này mình nhận ra một điều: AI đang dịch chuyển từ chatbot sang embedded productivity modules. Claude trong Excel, OpenAI scale PostgreSQL cho 800M users, agent ecosystem bùng nổ với Mastra, BrowserOS, AgentFS. Điều khiến mình hứng thú nhất là cách các tool này embed AI vào workflows thay vì làm standalone apps.</p>

      <h2>Highlights của tuần</h2>
      <ul>
        <li><strong>Claude in Excel</strong> - LLM hiểu dependency graph của spreadsheet. Đây là killer use case.</li>
        <li><strong>OpenAI PostgreSQL</strong> - Scale đến 800M users. Practical insights về connection pooling, read/write split.</li>
        <li><strong>FastRender</strong> - Cursor experiment với 2000 agents build browser engine bằng Rust. Wild.</li>
        <li><strong>GLM-4.7-Flash</strong> - 30B MoE với Preserved Thinking cho multi-turn agent tasks.</li>
      </ul>

      <h2>Tin tức đáng chú ý</h2>

      <h3>Claude in Excel - AI trong spreadsheet</h3>
      <p><a href="https://claude.com/claude-in-excel" target="_blank">Claude in Excel</a> là ứng dụng khiến mình excited nhất. Anthropic làm cho Claude hiểu toàn bộ workbook - dependencies, formulas, data flows. Debug <code>#REF!</code> errors, phân tích financial models, build complex formulas. Mình nghĩ đây là cách đúng để democratize advanced spreadsheet work.</p>

      <h3>OpenAI scale PostgreSQL - 800M users</h3>
      <p><a href="https://openai.com/index/scaling-postgresql/" target="_blank">Technical writeup từ OpenAI</a> về cách scale Postgres đến 800 triệu users. Key takeaways: single writer + read replicas pattern, connection pooling, migrate sharded workloads sang Azure Cosmos DB. Đây là case study thực chiến, không phải theoretical.</p>

      <h3>FastRender - 2000 agents cộng tác</h3>
      <p>Cursor team thử nghiệm <a href="https://simonwillison.net/2026/Jan/23/fastrender/" target="_blank">FastRender</a> - 2000 agents build browser engine bằng Rust. Điểm đặc biệt là collaboration mechanism giữa planning agents và execution agents. Mình thấy đây là hướng đi thú vị cho massive parallelization.</p>

      <h3>AI-resistant interviews</h3>
      <p><a href="https://www.anthropic.com/engineering/AI-resistant-technical-evaluations" target="_blank">Anthropic đổi format interview</a> - tránh questions mà models dễ giải, chuyển sang novel problems với strict constraints. Mình nghĩ đây là inevitable evolution.</p>

      <h3>Weng Jiayi về OpenAI model development</h3>
      <p><a href="https://www.youtube.com/watch?v=I0DrcsDf3Os" target="_blank">Podcast discussion</a> về model capability development, nhấn mạnh vai trò của RL và post-training trong alignment. Worth watching nếu bạn quan tâm về behind-the-scenes.</p>

      <h2>Models</h2>

      <h3>GLM-4.7-Flash - Efficient reasoning</h3>
      <p><a href="https://huggingface.co/zai-org/GLM-4.7-Flash" target="_blank">GLM-4.7-Flash</a> dùng 30B MoE, dominated "cost-efficient reasoning" track. <strong>Preserved Thinking</strong> feature giảm information loss trong multi-turn agent tasks. Đáng thử cho production agent workflows.</p>

      <h3>Qwen3-TTS - Real-time voice</h3>
      <p><a href="https://qwen.ai/blog?id=qwen3tts-0115" target="_blank">Qwen3-TTS</a> open-source high-quality voice generation và voice cloning. Latency 97ms, support 10 languages. Thích hợp cho real-time interactions.</p>

      <h3>Flux 2 Klein - Educational value</h3>
      <p><a href="https://github.com/antirez/flux2.c" target="_blank">Flux 2 Klein</a> từ tác giả Redis - implement Flux 2 inference bằng pure C. Giá trị chính là educational - hiểu operators và memory layout.</p>

      <h3>Linum v2 - Text-to-Video</h3>
      <p><a href="https://huggingface.co/collections/Linum-AI/linum-v2-2b-text-to-video" target="_blank">Linum v2</a> 2B text-to-video model, Apache 2.0 license. Theo dõi nếu bạn cần video generation.</p>

      <h2>Tools</h2>

      <h3>Mastra - TypeScript Agent Framework</h3>
      <p><a href="https://github.com/mastra-ai/mastra" target="_blank">Mastra</a> là framework xây reliable agents với TypeScript. Features: model routing, workflow orchestration, human-in-the-loop state management. Production-ready approach.</p>

      <h3>BrowserOS - Local agent browser</h3>
      <p><a href="https://github.com/browseros-ai/BrowserOS" target="_blank">BrowserOS</a> - Chromium fork chạy local agents, control qua MCP server. Thích hợp cho browser automation needs.</p>

      <h3>1code - Claude Code GUI</h3>
      <p><a href="https://github.com/21st-dev/1code" target="_blank">1code</a> thêm intuitive desktop GUI cho Claude Code với diff preview và git worktree isolation. Improves DX significantly.</p>

      <h3>json-render - Structured UI generation</h3>
      <p><a href="https://json-render.dev/" target="_blank">json-render</a> - Cho AI generate UI qua "structuring + whitelisting", output structured JSON. Safer approach cho AI-generated UIs.</p>

      <h3>AgentFS - Auditable file system</h3>
      <p><a href="https://drafts.miantiao.me/posts/100" target="_blank">AgentFS</a> - File system ghi lại file operations và agent state changes vào SQLite. Audit trail cho agent behaviors - mình thấy đây là critical cho production deployments.</p>

      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Góc nhìn của mình:</strong> Tuần này là về "Controllable Engineering Phase" - observability, reproducibility, process embedding. Chúng ta đang chuyển từ "AI làm được gì" sang "làm sao control được AI làm gì".
      </div>
    `,
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
    tag: "AI Weekly",
    tagColor: "blue",
    date: "25 Jan 2026",
    readTime: "12 min read",
    slug: "2026-w03"
  },
  {
    id: "3",
    title: "Tuần báo Tech & AI - Tuần 02/2026",
    excerpt: "Tuần thứ hai của năm mới, lĩnh vực AI tiếp tục tiến lên với tốc độ cao. Tin tức lớn nhất tuần này là Anthropic mở rộng kinh nghiệm thành công của Claude Code sang các kịch bản văn phòng, trong khi sự hợp tác giữa Apple và Google báo hiệu những thay đổi mới trong bối cảnh AI di động.",
    content: `
      <p>Tuần hai năm 2026 mở đầu với động thái táo bạo: Anthropic mang model thành công của Claude Code sang office scenarios với Cowork. Apple chọn Gemini cho Siri thay vì tự build. Cursor scale agents dài hạn. Điều khiến mình chú ý nhất là trend "AI as infrastructure" - không còn là features riêng lẻ mà là nền tảng cho workflows.</p>

      <h2>Highlights của tuần</h2>
      <ul>
        <li><strong>Claude Cowork</strong> - Claude Code model áp dụng cho work tasks. PromptArmor phát hiện security risks ngay sau đó.</li>
        <li><strong>Apple + Google</strong> - Gemini power Siri. Strategic pivot đáng chú ý.</li>
        <li><strong>Cursor scaling agents</strong> - Technical writeup về long-running autonomous agents.</li>
        <li><strong>Pocket TTS</strong> - Real-time voice synthesis trên CPU, no GPU needed.</li>
      </ul>

      <h2>Tin tức đáng chú ý</h2>

      <h3>Claude Cowork - Từ code sang work</h3>
      <p><a href="https://claude.com/blog/cowork-research-preview" target="_blank">Claude Cowork</a> là tin lớn nhất tuần này. Anthropic mang "local execution + autonomous decisions" pattern từ Claude Code sang general work scenarios. Nhưng <a href="https://www.promptarmor.com/resources/claude-cowork-exfiltrates-files" target="_blank">PromptArmor nhanh chóng phát hiện file exfiltration risks</a>. <a href="https://simonw.substack.com/p/first-impressions-of-claude-cowork" target="_blank">Simon Willison's first impressions</a> cũng worth reading.</p>
      <p><em>Mình nghĩ: Power tools cần careful security considerations. Speed to market vs safety balance.</em></p>

      <h3>Apple chọn Gemini cho Siri</h3>
      <p><a href="https://www.cnbc.com/2026/01/12/apple-google-ai-siri-gemini.html" target="_blank">Apple công bố partnership với Google</a> - Gemini sẽ power Siri. Major strategic shift từ company thường tự build everything. Mình thấy đây là pragmatic move - focus vào integration thay vì compete trực tiếp.</p>

      <h3>Cursor Agent evolution</h3>
      <p><a href="https://cursor.com/blog/scaling-agents" target="_blank">Cursor technical writeup</a> về scaling long-running autonomous coding agents. Đồng thời, <a href="https://embedding-shapes.github.io/cursor-implied-success-without-evidence/" target="_blank">analysis piece chỉ ra</a> browser demo mới implied success without evidence. Lesson: demo ≠ production reliability.</p>

      <h3>Industry perspectives</h3>
      <p>Redis creator antirez <a href="https://antirez.com/news/158" target="_blank">viết bài pushback</a> against anti-AI hype trend. Chrome team lead Addy Osmani <a href="https://addyosmani.com/blog/next-two-years/" target="_blank">predict software engineering</a> trong 2 năm tới. Both worth reading cho broader context.</p>

      <h3>Các động thái khác</h3>
      <ul>
        <li><a href="https://langfuse.com/blog/joining-clickhouse" target="_blank">ClickHouse acquires Langfuse</a> - Consolidation trong LLM ops space</li>
        <li><a href="https://blog.mozilla.org/en/mozilla/mozilla-open-source-ai-strategy/" target="_blank">Mozilla open-source AI strategy</a></li>
        <li><a href="https://frontierai.substack.com/p/data-is-your-only-moat" target="_blank">Data is your only moat</a> - Frontier AI analysis</li>
        <li><a href="https://labs.ramp.com/rct" target="_blank">Claude Code chơi RollerCoaster Tycoon</a> - Fun experiment</li>
        <li><a href="https://fulghum.io/self-hosting" target="_blank">Self-hosting CLI agents</a> - Practical guide</li>
      </ul>

      <h2>Models</h2>

      <h3>Pocket TTS - CPU voice synthesis</h3>
      <p><a href="https://kyutai.org/blog/2026-01-13-pocket-tts" target="_blank">Kyutai releases Pocket TTS</a> - Real-time voice synthesis trên CPU, no GPU needed. Mình nghĩ đây là breakthrough cho edge devices và cost optimization.</p>

      <h3>Sparrow-1 - Native audio conversations</h3>
      <p><a href="https://www.tavus.io/post/sparrow-1-human-level-conversational-timing-in-real-time-voice" target="_blank">Tavus releases Sparrow-1</a> - Native audio model với human-level conversational turn-taking. No ASR → natural conversations. Đáng thử cho voice applications.</p>

      <h3>FLUX.2 Klein - Interactive visual intelligence</h3>
      <p><a href="https://bfl.ai/blog/flux2-klein-towards-interactive-visual-intelligence" target="_blank">Black Forest Labs releases FLUX.2 Klein</a> - Focus vào real-time interactive capabilities. Theo dõi nếu bạn build visual AI apps.</p>

      <h3>TimeCapsuleLLM - 19th century training data</h3>
      <p><a href="https://github.com/haykgrigo3/TimeCapsuleLLM" target="_blank">TimeCapsuleLLM</a> chỉ train trên data từ 1800-1875. Experimental và educational value - hiểu language evolution.</p>

      <h2>Tools</h2>

      <h3>Security & Sandboxing</h3>
      <ul>
        <li><a href="https://github.com/finbarr/yolobox" target="_blank">Yolobox</a> - Agents run safely với sudo access</li>
        <li><a href="https://patrickmccanna.net/a-better-way-to-limit-claude-code-and-other-coding-agents-access-to-secrets/" target="_blank">Bubblewrap approach</a> - Linux namespaces block agent access to sensitive files</li>
      </ul>
      <p><em>Mình đánh giá cao: Security-first approach cho agent deployments.</em></p>

      <h3>OpenWork - Open-source Cowork alternative</h3>
      <p><a href="https://github.com/different-ai/openwork" target="_blank">OpenWork</a> là open-source alternative cho Cowork, support local deployment. Đáng thử nếu bạn cần self-hosted solution.</p>

      <h3>Developer tooling</h3>
      <ul>
        <li><a href="https://github.com/njbrake/agent-of-empires" target="_blank">Agent-of-empires</a> - Multi-session manager</li>
        <li><a href="https://github.com/cosinusalpha/webctl" target="_blank">Webctl</a> - CLI-based browser automation</li>
        <li><a href="https://github.com/chunkhound/chunkhound" target="_blank">ChunkHound</a> - Codebase chunking tool</li>
        <li><a href="https://www.mintlify.com/blog/install-md-standard-for-llm-executable-installation" target="_blank">Install.md</a> - LLM-executable installation standard</li>
      </ul>

      <h3>Guides & practices</h3>
      <ul>
        <li><a href="https://nanonets.com/cookbooks/structured-llm-outputs" target="_blank">Structured LLM outputs cookbook</a></li>
        <li><a href="https://news.ycombinator.com/item?id=46616529" target="_blank">RAG discussion trên HN</a></li>
        <li><a href="https://jakobemmerling.de/posts/fuse-is-all-you-need/" target="_blank">FUSE cho AI agents</a></li>
        <li><a href="https://pieterma.es/syntopic-reading-claude/" target="_blank">Syntopic reading practice</a></li>
      </ul>

      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Góc nhìn của mình:</strong> Tuần này highlight tension giữa capability và safety. Cowork shows power nhưng security risks emerge immediately. Lesson: autonomous AI tools cần security-by-design, không phải afterthought.
      </div>
    `,
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800",
    tag: "AI Weekly",
    tagColor: "blue",
    date: "18 Jan 2026",
    readTime: "10 min read",
    slug: "2026-w02"
  },
  {
    id: "4",
    title: "Tuần báo Tech & AI - Tuần 01/2026",
    excerpt: "Tuần đầu năm mở màn với những insights sâu sắc về AI coding assistants - từ cách build một clone Claude Code với 200 dòng Python đến phương pháp Vibe Coding cho người không biết code. Đặc biệt là câu chuyện về kỹ sư Google tái tạo project một năm trong một giờ - và bài học quan trọng đằng sau nó.",
    content: `
      <p>Tuần đầu tiên của 2026 khiến mình nhận ra một sự thật: những tool AI coding mà mình dùng hằng ngày không hề "ma thuật" như tưởng. Khi đọc bài viết về việc build Claude Code chỉ với 200 dòng Python, mình thấy rõ bản chất của nó là một vòng lặp cực kỳ đơn giản. Điều thực sự có giá trị không phải là code, mà là cách nghĩ về vấn đề - và đây chính là insight lớn nhất của tuần này.</p>

      <h2>Highlights của tuần</h2>
      <ul>
        <li><strong>200 dòng Python</strong> - Tái tạo Claude Code cơ bản. Demystify hoàn toàn "magic" của AI coding.</li>
        <li><strong>Vibe Coding</strong> - Phương pháp coding cho người không biết code. Ba nguyên tắc cực thực tế.</li>
        <li><strong>Google vs Claude Code</strong> - Một năm vs một giờ. Plot twist: đây không phải cuộc đua công bằng.</li>
        <li><strong>Security wake-up call</strong> - IBM AI Bob tải malware, Anthropic block third-party apps.</li>
      </ul>

      <h2>Tin tức đáng chú ý</h2>

      <h3>Build Claude Code với 200 dòng Python</h3>
      <p>Bài viết <a href="https://www.mihaileric.com/The-Emperor-Has-No-Clothes/" target="_blank">này của Mihail Eric</a> mở mắt mình hoàn toàn. Tác giả demystify cách hoạt động của Claude Code - và thực sự không có gì phức tạp: call LLM API, file system operations, tool execution, conversation context management. Vòng lặp cốt lõi là: user request → LLM decides → execute locally → return results → repeat.</p>
      <p><em>Mình thích nhất: Insight rằng "emperor has no clothes" - những công cụ này powerful nhưng không phải magic. Hiểu được mechanism giúp mình dùng chúng hiệu quả hơn nhiều.</em></p>

      <h3>Vibe Coding - Code bằng giao tiếp</h3>
      <p>Elena giới thiệu <a href="https://baoyu.io/blog/vibe-coding-ai-code-for-non-programmers" target="_blank">phương pháp Vibe Coding</a> với ba nguyên tắc mình thấy cực thực tế:</p>
      <ul>
        <li><strong>Nói rõ yêu cầu</strong> - Input gì? Logic xử lý như nào? Output ra sao? Edge cases?</li>
        <li><strong>Lặp từng bước nhỏ</strong> - Mỗi lần một việc, mỗi bước phải chạy được</li>
        <li><strong>Để AI hỏi lại</strong> - Khuyến khích clarification thay vì để AI đoán</li>
      </ul>
      <p><em>Đáng thử: Mình đang áp dụng nguyên tắc này và thấy quality của output tăng đáng kể.</em></p>

      <h3>Một năm vs một giờ - Câu chuyện thật</h3>
      <p>Jaana Dogan từ Google <a href="https://baoyu.io/blog/claude-code-beats-google-team-on-year-long-project-in-hour" target="_blank">share case study gây nhiều tranh cãi</a>: dùng Claude Code một giờ tái tạo công việc một năm của team. Nhưng plot twist là - một năm đó spent cho architecture exploration, real-world validation, team alignment. Còn output một giờ chỉ là toy version.</p>
      <p><em>Lesson quan trọng: AI replicate "building", nhưng cognitive work phía trước vẫn cần human. Bottleneck đang shift từ "how to build" sang "what to build".</em></p>

      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Góc nhìn của mình:</strong> Tuần này cho thấy rõ AI coding tools đang mature - không còn là hype về "AI thay lập trình viên", mà là câu hỏi "lập trình viên sẽ làm gì khi execution cost = 0". Thinking clearly > typing fast.
      </div>

      <h3>PM trong kỷ nguyên AI Agent</h3>
      <p>Shubham Saboo từ Google <a href="https://baoyu.io/blog/2026/01/07/ai-pm-new-era" target="_blank">phân tích role shift của PM</a>. Core shift: từ "translate requirements" sang "define problems". Khi execution cost giảm, judgment value tăng. Ba capability mới: problem definition, context loading, taste & judgment.</p>

      <h3>AI coding assistants đang suy giảm?</h3>
      <p><a href="https://spectrum.ieee.org/ai-coding-degrades" target="_blank">IEEE Spectrum discussion</a> về phenomenon đáng lo: AI coding performance có thể đang decline. Possible causes: model updates causing regressions, training data quality issues, expectation-capability gap widening, silent failures increasing.</p>
      <p><em>Mình quan sát: Đúng là thỉnh thoảng tools sai lạ. Need better evals and monitoring.</em></p>

      <h3>Security concerns nổi lên</h3>
      <p><a href="https://www.promptarmor.com/resources/ibm-ai-%28-bob-%29-downloads-and-executes-malware" target="_blank">PromptArmor phát hiện</a> IBM's "Bob" AI có thể bị trick để download và execute malware. Red flag lớn cho agent security.</p>
      <p>Đồng thời, <a href="https://github.com/anomalyco/opencode/issues/7410" target="_blank">Anthropic update ToS</a> block third-party apps khỏi dùng Claude Code subscriptions. Strategy shift gây nhiều discussion.</p>

      <h2>Models</h2>

      <h3>Sopro TTS - Voice on CPU</h3>
      <p><a href="https://github.com/samuel-vitorino/sopro" target="_blank">Sopro TTS</a> là 169M parameter zero-shot voice cloning model chạy trên CPU. Trên M3 base, RTF chỉ 0.25 (30s audio trong 7.5s). MIT license.</p>
      <p><em>Đáng chú ý: No GPU needed. Perfect cho edge devices và cost optimization.</em></p>

      <h2>Tools</h2>

      <h3>Anthropic evals guide</h3>
      <p><a href="https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents" target="_blank">Comprehensive guide</a> về evals cho AI agents. Cover full cycle: design, implementation, maintenance. Key advice: chỉ cần 20-50 simple tasks để start.</p>
      <p><em>Practical takeaway: Start small, iterate based on real failures.</em></p>

      <h3>Cursor's dynamic context discovery</h3>
      <p><a href="https://baoyu.io/translations/cursor-dynamic-context-discovery" target="_blank">Cursor reveals</a> core philosophy: <strong>less is more</strong>. Càng ít initial info, agent hoạt động càng effective.</p>
      <p><em>Counterintuitive nhưng makes sense: Overloading context = degraded signal-to-noise ratio.</em></p>

      <h3>Digital Red Queen - Adversarial evolution</h3>
      <p><a href="https://sakana.ai/drq/" target="_blank">Sakana AI</a> dùng LLM cho adversarial program evolution experiments trong Core War. DRQ algorithm inspired by Red Queen hypothesis.</p>
      <p><em>Niche nhưng fascinating approach to co-evolution and robustness.</em></p>

      <div class="bg-secondary/50 p-4 rounded-lg my-4">
        <strong>Suy nghĩ cuối tuần:</strong> Tuần đầu năm chứng kiến sự demystification của AI coding tools - từ technical mechanisms đến practical methodologies. Core insight: công cụ AI không replace thinking, nó accelerate execution. The new skill? Thinking clearly about problems.
      </div>
    `,
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    tag: "AI Weekly",
    tagColor: "blue",
    date: "11 Jan 2026",
    readTime: "10 min read",
    slug: "2026-w01"
  }
];

export const tags = [
  { name: "All", color: "default" as const },
  { name: "AI Weekly", color: "blue" as const },
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
