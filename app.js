/* ============================================
   PulseNews — Application Logic
   ============================================ */

(function () {
    'use strict';

    // ── Configuration ──
    const CONFIG = {
        // NewsAPI.org
        API_BASE: 'https://newsapi.org/v2',
        API_KEY: '8978511fa99345df8874cede50c83294',
        MAX_ARTICLES: 30,
        ARTICLES_PER_PAGE: 9,
        PLACEHOLDER_IMG: 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=800&q=80',
        CATEGORIES: ['general', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'],
    };

    // ── State ──
    const state = {
        articles: [],
        displayedCount: 0,
        currentCategory: 'general',
        isLoading: false,
        isListView: false,
        theme: localStorage.getItem('pulsenews-theme') || 'dark',
        searchQuery: '',
    };

    // ── DOM References ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {
        tickerContent: $('#tickerContent'),
        header: $('#header'),
        mainNav: $('#mainNav'),
        hamburger: $('#hamburger'),
        heroGrid: $('#heroGrid'),
        newsGrid: $('#newsGrid'),
        loadingContainer: $('#loadingContainer'),
        loadMoreContainer: $('#loadMoreContainer'),
        loadMoreBtn: $('#loadMoreBtn'),
        errorState: $('#errorState'),
        retryBtn: $('#retryBtn'),
        searchInput: $('#searchInput'),
        searchBtn: $('#searchBtn'),
        themeToggle: $('#themeToggle'),
        gridViewBtn: $('#gridViewBtn'),
        listViewBtn: $('#listViewBtn'),
        scrollTopBtn: $('#scrollTopBtn'),
        sectionTitle: $('#sectionTitle'),
        totalArticles: $('#totalArticles'),
        totalSources: $('#totalSources'),
        lastUpdated: $('#lastUpdated'),
        currentCategory: $('#currentCategory'),
        articleModal: $('#articleModal'),
        closeArticleModal: $('#closeArticleModal'),
        modalImg: $('#modalImg'),
        modalSource: $('#modalSource'),
        modalTime: $('#modalTime'),
        modalTitle: $('#modalTitle'),
        modalContent: $('#modalContent'),
        modalOriginalLink: $('#modalOriginalLink'),
    };


    // ── Theme ──
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        state.theme = theme;
        localStorage.setItem('pulsenews-theme', theme);
    }

    // ── Utility Functions ──
    function timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.slice(0, len) + '...' : str;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


    // ── Fallback News Data ──
    // Used when no API key is set or API fails
    function getFallbackNews(category) {
        const allNews = [
            {
                title: "Global Leaders Gather for Historic Climate Summit in Geneva",
                description: "World leaders from over 150 countries have convened in Geneva for what experts are calling the most ambitious climate action summit in history. New binding agreements on carbon emissions are expected.",
                url: "https://example.com/climate-summit",
                image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80",
                publishedAt: new Date(Date.now() - 1800000).toISOString(),
                source: { name: "Reuters", url: "https://reuters.com" },
                category: "world"
            },
            {
                title: "AI-Powered Medical Breakthrough Detects Cancer 5 Years Early",
                description: "A revolutionary artificial intelligence system developed by researchers at MIT can now detect certain types of cancer up to five years before traditional diagnostic methods, potentially saving millions of lives.",
                url: "https://example.com/ai-cancer",
                image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                source: { name: "Science Daily", url: "https://sciencedaily.com" },
                category: "science"
            },
            {
                title: "Tech Giants Report Record-Breaking Quarterly Earnings",
                description: "Major technology companies including Apple, Microsoft, and Google parent Alphabet have all reported earnings that exceeded Wall Street expectations, driving stock markets to new highs.",
                url: "https://example.com/tech-earnings",
                image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                source: { name: "Bloomberg", url: "https://bloomberg.com" },
                category: "business"
            },
            {
                title: "SpaceX Successfully Launches First Commercial Lunar Mission",
                description: "SpaceX has made history by launching the first fully commercial mission to the Moon, carrying scientific instruments and a small rover that will explore the lunar south pole.",
                url: "https://example.com/spacex-moon",
                image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&q=80",
                publishedAt: new Date(Date.now() - 10800000).toISOString(),
                source: { name: "Space.com", url: "https://space.com" },
                category: "technology"
            },
            {
                title: "Champions League Final Draws Record 500 Million Viewers",
                description: "The UEFA Champions League final between Real Madrid and Manchester City attracted a record-breaking global audience of 500 million viewers, making it the most-watched club football match in history.",
                url: "https://example.com/ucl-final",
                image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
                publishedAt: new Date(Date.now() - 14400000).toISOString(),
                source: { name: "ESPN", url: "https://espn.com" },
                category: "sports"
            },
            {
                title: "New Study Reveals Mediterranean Diet Reduces Heart Disease Risk by 40%",
                description: "A comprehensive 10-year study published in The Lancet has found that strict adherence to a Mediterranean-style diet can reduce the risk of heart disease by up to 40 percent in adults over 50.",
                url: "https://example.com/mediterranean-diet",
                image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
                publishedAt: new Date(Date.now() - 18000000).toISOString(),
                source: { name: "The Lancet", url: "https://thelancet.com" },
                category: "health"
            },
            {
                title: "Oscar-Winning Director Announces Surprise Sequel to Cult Classic",
                description: "Academy Award-winning director Christopher Nolan has announced an unexpected sequel to his 2010 mind-bending thriller 'Inception', with the original cast reportedly set to return.",
                url: "https://example.com/nolan-sequel",
                image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
                publishedAt: new Date(Date.now() - 21600000).toISOString(),
                source: { name: "Variety", url: "https://variety.com" },
                category: "entertainment"
            },
            {
                title: "Central Banks Worldwide Signal Coordinated Interest Rate Cuts",
                description: "In an unprecedented move, central banks across the G7 nations have signaled plans for coordinated interest rate reductions to stimulate global economic growth amid cooling inflation.",
                url: "https://example.com/rate-cuts",
                image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
                publishedAt: new Date(Date.now() - 25200000).toISOString(),
                source: { name: "Financial Times", url: "https://ft.com" },
                category: "business"
            },
            {
                title: "Breakthrough Quantum Computer Solves Problem in 4 Minutes That Would Take Classical Computer 10,000 Years",
                description: "Google's latest quantum processor has achieved a computational milestone, solving a complex optimization problem in just four minutes that would take the world's fastest supercomputer millennia.",
                url: "https://example.com/quantum",
                image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
                publishedAt: new Date(Date.now() - 28800000).toISOString(),
                source: { name: "Wired", url: "https://wired.com" },
                category: "technology"
            },
            {
                title: "Historic Peace Agreement Signed Between Long-Time Rival Nations",
                description: "After decades of tension and years of negotiations, two major nations have signed a comprehensive peace agreement that includes trade partnerships, cultural exchanges, and mutual defense commitments.",
                url: "https://example.com/peace-deal",
                image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
                publishedAt: new Date(Date.now() - 32400000).toISOString(),
                source: { name: "AP News", url: "https://apnews.com" },
                category: "world"
            },
            {
                title: "Electric Vehicle Sales Surpass Gas-Powered Cars in Europe for First Time",
                description: "In a watershed moment for the automotive industry, electric vehicle sales across the European Union have officially surpassed those of traditional gasoline-powered cars for the first time in history.",
                url: "https://example.com/ev-sales",
                image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
                publishedAt: new Date(Date.now() - 36000000).toISOString(),
                source: { name: "The Guardian", url: "https://theguardian.com" },
                category: "general"
            },
            {
                title: "World Health Organization Declares New Pandemic Prevention Framework",
                description: "The WHO has unveiled a comprehensive new framework for pandemic prevention, incorporating lessons learned from COVID-19 and utilizing AI-powered early detection systems.",
                url: "https://example.com/who-framework",
                image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80",
                publishedAt: new Date(Date.now() - 39600000).toISOString(),
                source: { name: "WHO", url: "https://who.int" },
                category: "health"
            },
            {
                title: "NASA's James Webb Telescope Discovers New Earth-Like Exoplanet",
                description: "NASA scientists have confirmed the discovery of a promising Earth-like exoplanet in the habitable zone of a nearby star system, raising hopes for finding signs of extraterrestrial life.",
                url: "https://example.com/jwst-planet",
                image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
                publishedAt: new Date(Date.now() - 43200000).toISOString(),
                source: { name: "NASA", url: "https://nasa.gov" },
                category: "science"
            },
            {
                title: "Premier League Transfer Window Sets New Spending Record",
                description: "English Premier League clubs have collectively spent over £3 billion during the summer transfer window, shattering previous records as top clubs compete for world-class talent.",
                url: "https://example.com/transfer-window",
                image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
                publishedAt: new Date(Date.now() - 46800000).toISOString(),
                source: { name: "BBC Sport", url: "https://bbc.co.uk/sport" },
                category: "sports"
            },
            {
                title: "Streaming Wars Intensify as Netflix Announces Revolutionary Interactive Feature",
                description: "Netflix has unveiled a groundbreaking interactive storytelling feature powered by AI that allows viewers to influence plot directions in real-time, potentially reshaping the future of entertainment.",
                url: "https://example.com/netflix-interactive",
                image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80",
                publishedAt: new Date(Date.now() - 50400000).toISOString(),
                source: { name: "TechCrunch", url: "https://techcrunch.com" },
                category: "entertainment"
            },
            {
                title: "UN General Assembly Adopts Historic Resolution on Digital Rights",
                description: "The United Nations General Assembly has adopted a landmark resolution establishing fundamental digital rights for all citizens worldwide, including data privacy and internet access as basic human rights.",
                url: "https://example.com/un-digital-rights",
                image: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&q=80",
                publishedAt: new Date(Date.now() - 54000000).toISOString(),
                source: { name: "United Nations", url: "https://un.org" },
                category: "general"
            },
            {
                title: "Renewable Energy Now Cheapest Power Source in 90% of the World",
                description: "A comprehensive report by the International Energy Agency reveals that solar and wind power have become the cheapest sources of new electricity generation in virtually every major market worldwide.",
                url: "https://example.com/renewables",
                image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
                publishedAt: new Date(Date.now() - 57600000).toISOString(),
                source: { name: "IEA", url: "https://iea.org" },
                category: "science"
            },
            {
                title: "Global Cryptocurrency Regulation Framework Finalized by G20",
                description: "G20 finance ministers have agreed on a unified regulatory framework for cryptocurrencies, providing clarity for investors and businesses while aiming to prevent fraud and money laundering.",
                url: "https://example.com/crypto-regulation",
                image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
                publishedAt: new Date(Date.now() - 61200000).toISOString(),
                source: { name: "CoinDesk", url: "https://coindesk.com" },
                category: "business"
            },
        ];

        if (category === 'general') return allNews;
        return allNews.filter(n => n.category === category).length > 0
            ? allNews.filter(n => n.category === category)
            : allNews; // fallback to all if category has no news
    }


    // ── Fetch News ──
    async function fetchNews(category = 'general', query = '') {
        state.isLoading = true;
        showLoading(true);
        hideError();

        // If no API key, use fallback data
        if (!CONFIG.API_KEY) {
            await new Promise(r => setTimeout(r, 800)); // Simulate loading
            let articles = getFallbackNews(category);
            if (query) {
                const q = query.toLowerCase();
                articles = articles.filter(a =>
                    a.title.toLowerCase().includes(q) ||
                    (a.description && a.description.toLowerCase().includes(q))
                );
            }
            state.articles = articles;
            state.displayedCount = 0;
            state.isLoading = false;
            showLoading(false);
            renderHero();
            renderNextPage();
            updateStats();
            updateTicker();
            return;
        }

        try {
            let url;
            if (query) {
                url = `${CONFIG.API_BASE}/everything?q=${encodeURIComponent(query)}&language=en&pageSize=${CONFIG.MAX_ARTICLES}&apiKey=${CONFIG.API_KEY}`;
            } else {
                const categoryMap = {
                    general: 'general',
                    world: 'general',
                    business: 'business',
                    technology: 'technology',
                    entertainment: 'entertainment',
                    sports: 'sports',
                    science: 'science',
                    health: 'health',
                };
                const cat = categoryMap[category] || 'general';
                url = `${CONFIG.API_BASE}/top-headlines?category=${cat}&language=en&country=us&pageSize=${CONFIG.MAX_ARTICLES}&apiKey=${CONFIG.API_KEY}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();

            state.articles = data.articles || [];
            state.displayedCount = 0;
            state.isLoading = false;

            showLoading(false);
            renderHero();
            renderNextPage();
            updateStats();
            updateTicker();
        } catch (err) {
            console.error('Fetch error:', err);
            state.isLoading = false;
            showLoading(false);

            // Fall back to demo data on error
            let articles = getFallbackNews(category);
            if (query) {
                const q = query.toLowerCase();
                articles = articles.filter(a =>
                    a.title.toLowerCase().includes(q) ||
                    (a.description && a.description.toLowerCase().includes(q))
                );
            }
            state.articles = articles;
            state.displayedCount = 0;
            renderHero();
            renderNextPage();
            updateStats();
            updateTicker();
        }
    }


    // ── Render Hero ──
    function renderHero() {
        const heroArticles = state.articles.slice(0, 2);
        if (heroArticles.length === 0) {
            DOM.heroGrid.innerHTML = '';
            return;
        }

        DOM.heroGrid.innerHTML = heroArticles.map((article, i) => `
            <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer" class="hero-card" style="animation-delay: ${i * 0.15}s">
                <img class="hero-img" src="${article.image || article.urlToImage || CONFIG.PLACEHOLDER_IMG}" alt="${escapeHtml(article.title)}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'">
                <div class="hero-overlay">
                    <span class="hero-category">${escapeHtml(article.source?.name || 'News')}</span>
                    <h2 class="hero-title">${escapeHtml(article.title)}</h2>
                    <div class="hero-meta">
                        <span class="source">${escapeHtml(article.source?.name || 'Unknown')}</span>
                        <span>•</span>
                        <span>${timeAgo(article.publishedAt)}</span>
                    </div>
                </div>
            </a>
        `).join('');
    }


    // ── Render News Cards ──
    function renderNextPage() {
        const start = state.displayedCount + 2; // Skip hero articles
        const end = start + CONFIG.ARTICLES_PER_PAGE;
        const pageArticles = state.articles.slice(start, end);

        if (state.displayedCount === 0) {
            DOM.newsGrid.innerHTML = '';
        }

        pageArticles.forEach((article, i) => {
            const card = document.createElement('a');
            card.href = article.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = 'news-card';
            card.style.animationDelay = `${i * 0.08}s`;

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img class="card-image" src="${article.image || article.urlToImage || CONFIG.PLACEHOLDER_IMG}" alt="${escapeHtml(article.title)}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'">
                    <span class="card-badge">${escapeHtml(state.currentCategory)}</span>
                </div>
                <div class="card-body">
                    <div class="card-source">${escapeHtml(article.source?.name || 'Unknown Source')}</div>
                    <h3 class="card-title">${escapeHtml(article.title)}</h3>
                    <p class="card-description">${escapeHtml(article.description || '')}</p>
                    <div class="card-footer">
                        <span class="card-time">🕐 ${timeAgo(article.publishedAt)}</span>
                        <span class="card-read">Read more →</span>
                    </div>
                </div>
            `;

            DOM.newsGrid.appendChild(card);
        });

        state.displayedCount = end - 2;

        // Show/hide load more
        if (state.articles.length > end) {
            DOM.loadMoreContainer.style.display = 'block';
        } else {
            DOM.loadMoreContainer.style.display = 'none';
        }
    }


    // ── Ticker ──
    function updateTicker() {
        const headlines = state.articles.slice(0, 10).map(a => `<span>${escapeHtml(truncate(a.title, 80))}</span>`);
        // Duplicate for seamless scroll
        DOM.tickerContent.innerHTML = headlines.join('') + headlines.join('');
    }


    // ── Stats ──
    function updateStats() {
        const sources = new Set(state.articles.map(a => a.source?.name).filter(Boolean));
        animateNumber(DOM.totalArticles, state.articles.length);
        animateNumber(DOM.totalSources, sources.size);
        DOM.lastUpdated.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        DOM.currentCategory.textContent = state.currentCategory.charAt(0).toUpperCase() + state.currentCategory.slice(1);
    }

    function animateNumber(el, target) {
        const duration = 600;
        const start = parseInt(el.textContent) || 0;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }


    // ── UI Helpers ──
    function showLoading(show) {
        DOM.loadingContainer.style.display = show ? 'block' : 'none';
        if (show) {
            DOM.newsGrid.innerHTML = '';
            DOM.heroGrid.innerHTML = '';
            DOM.loadMoreContainer.style.display = 'none';
        }
    }

    function showError() {
        DOM.errorState.style.display = 'block';
        DOM.newsGrid.innerHTML = '';
        DOM.loadMoreContainer.style.display = 'none';
    }

    function hideError() {
        DOM.errorState.style.display = 'none';
    }


    // ── Event Listeners ──
    function initEvents() {
        // Category navigation
        $$('.nav-link').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.nav-link').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentCategory = btn.dataset.category;
                state.searchQuery = '';
                DOM.searchInput && (DOM.searchInput.value = '');
                DOM.sectionTitle.innerHTML = `<span class="title-accent"></span>${btn.dataset.category.charAt(0).toUpperCase() + btn.dataset.category.slice(1)} Headlines`;
                fetchNews(btn.dataset.category);

                // Close mobile nav
                DOM.mainNav.classList.remove('open');
                DOM.hamburger.classList.remove('active');
            });
        });

        // Footer category links
        $$('.footer-col a[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.dataset.category;
                $$('.nav-link').forEach(b => b.classList.remove('active'));
                const navBtn = $(`[data-category="${cat}"]`);
                if (navBtn) navBtn.classList.add('active');
                state.currentCategory = cat;
                DOM.sectionTitle.innerHTML = `<span class="title-accent"></span>${cat.charAt(0).toUpperCase() + cat.slice(1)} Headlines`;
                fetchNews(cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Search
        function doSearch() {
            const query = DOM.searchInput.value.trim();
            if (!query) return;
            state.searchQuery = query;
            state.currentCategory = 'search';
            $$('.nav-link').forEach(b => b.classList.remove('active'));
            DOM.sectionTitle.innerHTML = `<span class="title-accent"></span>Results for "${escapeHtml(query)}"`;
            fetchNews('general', query);
        }

        DOM.searchBtn?.addEventListener('click', doSearch);
        DOM.searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        // Theme toggle
        DOM.themeToggle.addEventListener('click', () => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });

        // View toggle
        DOM.gridViewBtn.addEventListener('click', () => {
            DOM.newsGrid.classList.remove('list-view');
            DOM.gridViewBtn.classList.add('active');
            DOM.listViewBtn.classList.remove('active');
            state.isListView = false;
        });

        DOM.listViewBtn.addEventListener('click', () => {
            DOM.newsGrid.classList.add('list-view');
            DOM.listViewBtn.classList.add('active');
            DOM.gridViewBtn.classList.remove('active');
            state.isListView = true;
        });

        // Hamburger
        DOM.hamburger.addEventListener('click', () => {
            DOM.hamburger.classList.toggle('active');
            DOM.mainNav.classList.toggle('open');
        });

        // Load more
        DOM.loadMoreBtn.addEventListener('click', () => {
            renderNextPage();
        });

        // Retry
        DOM.retryBtn.addEventListener('click', () => {
            fetchNews(state.currentCategory, state.searchQuery);
        });

        // Scroll to top
        DOM.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Scroll events
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            // Header shadow
            DOM.header.classList.toggle('scrolled', scrollY > 10);

            // Scroll to top button
            DOM.scrollTopBtn.classList.toggle('visible', scrollY > 600);

            lastScrollY = scrollY;
        }, { passive: true });

    }


    // ── Initialize ──
    function init() {
        applyTheme(state.theme);
        initEvents();
        fetchNews('general');
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
