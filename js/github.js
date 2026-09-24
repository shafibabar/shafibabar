/* "Latest on GitHub" feed for the Portfolio page.
   Renders public repos with DOM APIs only (API data never touches innerHTML),
   caches in sessionStorage to stay under the 60 req/hour anonymous limit,
   and falls back to the static profile link already in the page. */
(function () {
  "use strict";

  var CONFIG = {
    username: "shafibabar",
    maxRepos: 6,
    // Profile repo, plus client-engagement repos kept off the public site
    // until confirmed for publication.
    exclude: ["shafibabar", "Datadog-Observability-Copilot", "ec-conduct-factory", "ec-document-flow-map"],
    cacheKey: "gh-repos-v1",
    cacheTtlMs: 30 * 60 * 1000,
    timeoutMs: 8000
  };

  var feed = document.querySelector("[data-github-feed]");
  if (!feed) return;
  var list = feed.querySelector("[data-feed-list]");
  var status = feed.querySelector("[data-feed-status]");
  var profileUrl = "https://github.com/" + CONFIG.username;
  var excluded = CONFIG.exclude.map(function (name) { return name.toLowerCase(); });

  var LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", HTML: "#e34c26",
    CSS: "#663399", Shell: "#89e051", Go: "#00add8", Java: "#b07219", "C#": "#178600",
    Jupyter: "#da5b0b", "Jupyter Notebook": "#da5b0b", Rust: "#dea584", Ruby: "#701516"
  };

  /* ---------- small DOM helpers ---------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function svgIcon(pathD) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    return svg;
  }

  function setStatus(message, withLink) {
    status.textContent = message;
    if (withLink) {
      status.appendChild(document.createTextNode(" "));
      var a = el("a", null, "See all repositories on GitHub");
      a.href = profileUrl;
      status.appendChild(a);
      status.appendChild(document.createTextNode("."));
    }
  }

  /* ---------- cache ---------- */
  function readCache(allowStale) {
    try {
      var raw = sessionStorage.getItem(CONFIG.cacheKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!allowStale && Date.now() - data.time > CONFIG.cacheTtlMs) return null;
      return data.repos;
    } catch (e) { return null; }
  }
  function writeCache(repos) {
    try { sessionStorage.setItem(CONFIG.cacheKey, JSON.stringify({ time: Date.now(), repos: repos })); } catch (e) { /* storage blocked */ }
  }

  /* ---------- data ---------- */
  function pick(repos) {
    return repos
      .filter(function (r) {
        return !r.fork && !r.archived && excluded.indexOf(String(r.name).toLowerCase()) === -1;
      })
      .sort(function (a, b) { return new Date(b.pushed_at) - new Date(a.pushed_at); })
      .slice(0, CONFIG.maxRepos)
      .map(function (r) {
        return {
          name: String(r.name),
          url: String(r.html_url),
          description: r.description ? String(r.description) : "",
          language: r.language ? String(r.language) : "",
          stars: Number(r.stargazers_count) || 0,
          pushed: String(r.pushed_at)
        };
      });
  }

  function fetchRepos() {
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, CONFIG.timeoutMs) : null;
    var url = "https://api.github.com/users/" + encodeURIComponent(CONFIG.username) + "/repos?per_page=100&sort=pushed";
    return fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller ? controller.signal : undefined })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        // Anonymous 403/429 from this endpoint is the rate limit; treat an
        // unreadable header (not CORS-exposed) the same way.
        var remaining = res.headers.get("x-ratelimit-remaining");
        if ((res.status === 403 || res.status === 429) && (remaining === "0" || remaining === null)) {
          var err = new Error("rate-limited");
          err.rateLimited = true;
          throw err;
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!Array.isArray(json)) throw new Error("Unexpected response");
        return pick(json);
      });
  }

  /* ---------- rendering ---------- */
  var relative = "Intl" in window && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }) : null;
  function timeAgo(iso) {
    var date = new Date(iso);
    var seconds = (date - Date.now()) / 1000;
    var units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(seconds) >= units[i][1] || units[i][0] === "minute") {
        var value = Math.round(seconds / units[i][1]);
        return relative ? relative.format(value, units[i][0]) : date.toLocaleDateString();
      }
    }
  }

  function isSafeRepoUrl(url) {
    return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(url);
  }

  function repoCard(repo) {
    var card = el("article", "tile span-2 repo-card");
    var title = el("h3");
    var link = el("a", null, repo.name);
    link.href = isSafeRepoUrl(repo.url) ? repo.url : profileUrl;
    title.appendChild(link);
    card.appendChild(title);
    card.appendChild(el("p", null, repo.description || "No description provided."));

    var meta = el("div", "repo-meta");
    if (repo.language) {
      var lang = el("span");
      var dot = el("span", "lang-dot");
      dot.setAttribute("aria-hidden", "true");
      if (LANG_COLORS[repo.language]) dot.style.setProperty("--lang", LANG_COLORS[repo.language]);
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(repo.language));
      meta.appendChild(lang);
    }
    var stars = el("span");
    stars.appendChild(svgIcon("M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"));
    stars.appendChild(document.createTextNode(String(repo.stars)));
    stars.appendChild(el("span", "visually-hidden", repo.stars === 1 ? " star" : " stars"));
    meta.appendChild(stars);

    var updated = el("time", null, "Updated " + timeAgo(repo.pushed));
    updated.dateTime = repo.pushed;
    meta.appendChild(updated);
    card.appendChild(meta);
    return card;
  }

  function renderSkeletons() {
    list.replaceChildren();
    for (var i = 0; i < 3; i++) {
      var card = el("div", "tile span-2 repo-card repo-card--skeleton");
      card.setAttribute("aria-hidden", "true");
      ["60%", "95%", "80%", "40%"].forEach(function (w) {
        var bar = el("div", "skeleton-bar");
        bar.style.width = w;
        card.appendChild(bar);
      });
      list.appendChild(card);
    }
  }

  function render(repos) {
    list.replaceChildren();
    list.removeAttribute("aria-busy");
    if (!repos.length) {
      setStatus("No public repositories to show right now.", true);
      return;
    }
    repos.forEach(function (repo) { list.appendChild(repoCard(repo)); });
    setStatus("", false);
  }

  function renderError(err) {
    var stale = readCache(true);
    if (stale && stale.length) {
      render(stale);
      return;
    }
    list.replaceChildren();
    list.removeAttribute("aria-busy");
    if (err && err.rateLimited) {
      setStatus("GitHub's hourly limit for anonymous requests has been reached, so the live list can't load right now.", true);
    } else {
      setStatus("GitHub couldn't be reached right now.", true);
    }
  }

  /* ---------- run ---------- */
  var cached = readCache(false);
  if (cached) {
    render(cached);
    return;
  }
  setStatus("Loading recent repositories…", false);
  list.setAttribute("aria-busy", "true");
  renderSkeletons();
  fetchRepos()
    .then(function (repos) {
      writeCache(repos);
      render(repos);
    })
    .catch(renderError);
})();
