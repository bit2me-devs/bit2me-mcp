                // Helper to create dummy values for JSON example
                function formatArgsExample(args) {
                    const ex = {};
                    for (const key in args) {
                        const type = args[key];
                        if (typeof type === 'string') {
                             if (type.includes("number")) ex[key] = 100;
                             else if (type.includes("BTC")) ex[key] = "BTC";
                             else if (type.includes("EUR")) ex[key] = "EUR";
                             else ex[key] = "example_value";
                        } else if (typeof type === 'object' && type.type) {
                             if (type.type === "number") ex[key] = 100;
                             else if (type.type === "boolean") ex[key] = true;
                             else ex[key] = "example_value";
                        } else {
                            ex[key] = "example_value";
                        }
                    }
                    return ex;
                }

                // Filter state
                let currentFilterType = "ALL";
                let currentFilterText = "";

                // Render tools function
                function renderTools(textFilter = "") {
                    const container = document.getElementById("tools-container");
                    container.innerHTML = "";

                    toolsData.forEach((cat) => {
                        const filteredTools = cat.tools.filter((tool) => {
                            const matchesType = currentFilterType === "ALL" || tool.type === currentFilterType;
                            return matchesType;
                        });

                        if (filteredTools.length === 0) return;

                        const sectionHTML = `
                        <div id="${cat.id}" class="mb-12 scroll-mt-20">
                            <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 group">
                                <span class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-1.5 rounded-lg text-lg">${cat.icon}</span> ${cat.category}
                                <button onclick="copySectionLink('${cat.id}', this)"
                                    class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 ml-2"
                                    title="Copy Link">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1">
                                        </path>
                                    </svg>
                                </button>
                            </h3>
                            <div class="space-y-3">
                                ${filteredTools
                                    .map((tool) => {
                                        const badgeClass =
                                            tool.type === "READ"
                                                ? "badge-read"
                                                : tool.type === "WRITE"
                                                  ? "badge-write"
                                                  : "badge-meta";
                                        const argsExample = tool.exampleArgs || formatArgsExample(tool.args);
                                        const jsonExample = JSON.stringify(
                                            {
                                                name: tool.name,
                                                arguments: argsExample,
                                            },
                                            null,
                                            2
                                        );

                                        return `
                                    <details id="tool-${tool.name}" class="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition hover:border-blue-300 dark:hover:border-blue-700">
                                        <summary class="flex items-center justify-between p-4 cursor-pointer select-none">
                                            <div class="flex items-center gap-3">
                                                <span class="badge ${badgeClass}">${tool.type}</span>
                                                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${tool.name}</span>
                                            </div>
                                            <svg class="w-5 h-5 text-slate-400 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </summary>
                                        <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                                            <p class="text-sm text-slate-600 dark:text-slate-400">${tool.desc}</p>
                                            ${
                                                Object.keys(tool.args).length > 0
                                                    ? `
                                                <div>
                                                    <h5 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Arguments</h5>
                                                    <ul class="space-y-1">
                                                        ${Object.entries(tool.args)
                                                            .map(([key, details]) => {
                                                                const type =
                                                                    typeof details === "object" ? details.type : details;
                                                                const desc =
                                                                    typeof details === "object" ? details.desc : "";
                                                                return `
                                                            <li class="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1 mb-2">
                                                                <div class="flex items-center gap-2">
                                                                    <code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">${key}</code>
                                                                    <span class="text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700 rounded px-1">${type}</span>
                                                                </div>
                                                                ${desc ? `<p class="text-slate-500 dark:text-slate-500 pl-2 border-l-2 border-slate-200 dark:border-slate-700 text-[11px] leading-relaxed">${desc}</p>` : ""}
                                                            </li>
                                                        `;
                                                            })
                                                            .join("")}
                                                    </ul>
                                                </div>
                                            `
                                                    : ""
                                            }
                                            <div>
                                                <h5 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Example Usage</h5>
                                                <pre class="bg-slate-900 dark:bg-black rounded p-3 overflow-x-auto text-xs" translate="no"><code class="language-json">${jsonExample}</code></pre>
                                            </div>
                                            ${
                                                tool.response
                                                    ? `
                                            <div class="mt-3">
                                                <h5 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Example Response</h5>
                                                <pre class="bg-slate-900 dark:bg-black rounded p-3 overflow-x-auto text-xs" translate="no"><code class="language-json">${JSON.stringify(tool.response, null, 2)}</code></pre>
                                            </div>
                                            `
                                                    : ""
                                            }
                                        </div>
                                    </details>
                                `;
                                    })
                                    .join("")}
                            </div>
                        </div>
                    `;
                        container.insertAdjacentHTML("beforeend", sectionHTML);
                    });

                    // Re-apply syntax highlighting and copy buttons
                    if (window.hljs) {
                        hljs.highlightAll();
                    }
                    addCopyButtons();
                }

                // Close menu when clicking overlay
                document.getElementById("mobileOverlay")?.addEventListener("click", () => {
                    window.toggleMenu();
                });

                // Filter function
                window.setFilter = function (type) {
                    currentFilterType = type;

                    // Update UI
                    document.querySelectorAll(".filter-chip").forEach((btn) => {
                        if (btn.textContent === type) {
                            btn.className =
                                "filter-chip active px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 dark:bg-blue-600 text-white shadow-md transition whitespace-nowrap ring-2 ring-transparent focus:outline-none scale-105";
                        } else {
                            btn.className =
                                "filter-chip px-2.5 py-1 rounded-md text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition whitespace-nowrap";
                        }
                    });

                    renderTools(currentFilterText);

                    // Close mobile menu if open
                    const sidebar = document.getElementById("sidebar");
                    const overlay = document.getElementById("mobileOverlay");
                    if (sidebar && overlay) {
                        sidebar.classList.remove("translate-x-0");
                        sidebar.classList.add("-translate-x-full");
                        overlay.classList.add("hidden", "opacity-0");
                    }

                    // Scroll to tools section
                    const referenceSection = document.getElementById("reference");
                    if (referenceSection) {
                        referenceSection.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                };

                // Tab Logic
                window.openTab = function (evt, tabName) {
                    var i, tabcontent, tablinks;
                    tabcontent = document.getElementsByClassName("tab-content");
                    for (i = 0; i < tabcontent.length; i++) {
                        tabcontent[i].classList.add("hidden");
                    }
                    tablinks = document.getElementsByClassName("tab-btn");
                    for (i = 0; i < tablinks.length; i++) {
                        tablinks[i].classList.remove(
                            "border-blue-600",
                            "text-blue-600",
                            "dark:text-blue-400",
                            "bg-white",
                            "dark:bg-slate-950"
                        );
                        tablinks[i].classList.add("border-transparent", "text-slate-500", "dark:text-slate-400");
                    }
                    document.getElementById(tabName).classList.remove("hidden");
                    evt.currentTarget.classList.remove(
                        "border-transparent",
                        "text-slate-500",
                        "dark:text-slate-400",
                        "hover:text-slate-700",
                        "dark:hover:text-slate-200"
                    );
                    evt.currentTarget.classList.add(
                        "border-blue-600",
                        "text-blue-600",
                        "dark:text-blue-400",
                        "bg-white",
                        "dark:bg-slate-950"
                    );
                };

                // Initial Render
                renderTools();

                // Get main content element (used by multiple features)
                const mainContent = document.querySelector("main");

                // Back to Top Button Logic
                const backToTopBtn = document.getElementById("backToTop");

                mainContent.addEventListener("scroll", () => {
                    if (mainContent.scrollTop > 300) {
                        backToTopBtn.classList.remove("opacity-0", "invisible");
                        backToTopBtn.classList.add("opacity-100");
                    } else {
                        backToTopBtn.classList.add("opacity-0", "invisible");
                        backToTopBtn.classList.remove("opacity-100");
                    }
                });

                // Highlight Active Sidebar Link on Scroll
                const sidebarLinks = document.querySelectorAll(".sidebar-link");

                function updateActiveLink() {
                    // Get all sections with IDs
                    const sections = Array.from(document.querySelectorAll('section[id], div[id^="cat-"]'));
                    const scrollPosition = mainContent.scrollTop;

                    let currentSection = "";

                    // Check from bottom to top to find the current section
                    for (let i = sections.length - 1; i >= 0; i--) {
                        const section = sections[i];
                        const sectionTop = section.offsetTop - 200; // offset for early activation

                        if (scrollPosition >= sectionTop) {
                            currentSection = section.getAttribute("id");
                            break;
                        }
                    }

                    // If still no section and we're near the top, use first section
                    if (!currentSection && scrollPosition < 100) {
                        currentSection = "overview";
                    }

                    // Force overview if at the very top
                    if (scrollPosition < 50) {
                        currentSection = "overview";
                    }

                    // Update active state on sidebar links
                    sidebarLinks.forEach((link) => {
                        // Remove all active classes
                        link.classList.remove(
                            "active",
                            "bg-blue-50",
                            "dark:bg-blue-900/30",
                            "text-blue-600",
                            "dark:text-blue-400",
                            "font-bold"
                        );
                        link.classList.add("text-slate-600", "dark:text-slate-400");

                        const href = link.getAttribute("href");
                        if (href && href === `#${currentSection}`) {
                            // Add active classes only to the matching link
                            link.classList.add(
                                "active",
                                "bg-blue-50",
                                "dark:bg-blue-900/30",
                                "text-blue-600",
                                "dark:text-blue-400",
                                "font-bold"
                            );
                            link.classList.remove("text-slate-600", "dark:text-slate-400");

                            // Update URL without adding to history stack
                            if (history.replaceState) {
                                history.replaceState(null, null, "#" + currentSection);
                            }
                        }
                    });
                }

                // Add scroll listener
                if (mainContent) {
                    mainContent.addEventListener("scroll", () => {
                        updateActiveLink();
                    });
                }

                // Update on click with smooth scroll
                sidebarLinks.forEach((link) => {
                    link.addEventListener("click", (e) => {
                        e.preventDefault();
                        const targetId = link.getAttribute("href")?.substring(1);
                        if (!targetId) return;

                        const targetSection = document.getElementById(targetId);

                        if (targetSection) {
                            // Scroll to section
                            mainContent.scrollTo({
                                top: targetSection.offsetTop - 50,
                                behavior: "smooth",
                            });

                            // Update URL
                            if (history.pushState) {
                                history.pushState(null, null, "#" + targetId);
                            }
                        }

                        // Immediately update active state
                        sidebarLinks.forEach((l) => {
                            l.classList.remove(
                                "active",
                                "bg-blue-50",
                                "dark:bg-blue-900/30",
                                "text-blue-600",
                                "dark:text-blue-400",
                                "font-bold"
                            );
                            l.classList.add("text-slate-600", "dark:text-slate-400");
                        });
                        link.classList.add(
                            "active",
                            "bg-blue-50",
                            "dark:bg-blue-900/30",
                            "text-blue-600",
                            "dark:text-blue-400",
                            "font-bold"
                        );
                        link.classList.remove("text-slate-600", "dark:text-slate-400");

                        // Close mobile menu if open
                        const sidebar = document.getElementById("sidebar");
                        const overlay = document.getElementById("mobileOverlay");
                        if (sidebar && overlay) {
                            sidebar.classList.remove("translate-x-0");
                            sidebar.classList.add("-translate-x-full");
                            overlay.classList.add("hidden", "opacity-0");
                        }
                    });
                });

                // Handle initial hash and active link
                if (window.location.hash && window.location.hash !== "#overview") {
                    const targetId = window.location.hash.substring(1);
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        // If valid section in hash, scroll to it
                        setTimeout(() => {
                            mainContent.scrollTo({
                                top: targetSection.offsetTop - 50,
                                behavior: "smooth"
                            });
                        }, 100);
                    } else {
                        // Invalid hash, fallback to standard update
                        setTimeout(updateActiveLink, 200);
                    }
                } else {
                    // No hash or overview, run standard update
                    setTimeout(updateActiveLink, 200);
                }
                // Set current year
                document.getElementById("current-year").textContent = new Date().getFullYear();

                // === DARK MODE INITIALIZATION ===
                const html = document.documentElement;

                // Check preference
                if (
                    localStorage.theme === "dark" ||
                    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
                ) {
                    html.classList.add("dark");
                } else {
                    html.classList.remove("dark");
                }

                // Search & Suggestion Logic
                const searchInput = document.getElementById("toolSearch");
                const suggestionsBox = document.getElementById("searchSuggestions");

                searchInput.addEventListener("input", (e) => {
                    const query = e.target.value.toLowerCase();

                    if (query.length < 1) {
                        suggestionsBox.classList.add("hidden");
                        return;
                    }

                    // Flatten all tools into a single array
                    const allTools = toolsData.flatMap((cat) => cat.tools.map((t) => ({ ...t, category: cat.category })));
                    const matches = allTools.filter(
                        (tool) => tool.name.toLowerCase().includes(query) || tool.desc.toLowerCase().includes(query)
                    );

                    if (matches.length > 0) {
                        suggestionsBox.innerHTML = matches
                            .slice(0, 8)
                            .map(
                                (tool) => `
                                <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition" onclick="scrollToTool('${tool.name}')">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">${tool.name}</span>
                                        <span class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">${tool.type}</span>
                                    </div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">${tool.desc}</div>
                                </div>
                            `
                            )
                            .join("");
                        suggestionsBox.classList.remove("hidden");
                    } else {
                        suggestionsBox.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">No tools found</div>`;
                        suggestionsBox.classList.remove("hidden");
                    }
                });

                // Hide suggestions when clicking outside
                document.addEventListener("click", (e) => {
                    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                        suggestionsBox.classList.add("hidden");
                    }
                });

                // Scroll to specific tool
                window.scrollToTool = function (toolName) {
                    const toolElement = document.getElementById(`tool-${toolName}`);
                    if (toolElement) {
                        // Close suggestions
                        suggestionsBox.classList.add("hidden");
                        searchInput.value = ""; // Optional: clear search

                        // Open the details element
                        toolElement.open = true;

                        // Scroll to element with offset
                        // Using scrollIntoView for simplicity as it handles nested scrolling contexts better usually
                        toolElement.scrollIntoView({ behavior: "smooth", block: "center" });

                        // Highlight effect
                        toolElement.classList.add("ring-2", "ring-blue-500", "ring-offset-2", "dark:ring-offset-slate-900");
                        setTimeout(() => {
                            toolElement.classList.remove(
                                "ring-2",
                                "ring-blue-500",
                                "ring-offset-2",
                                "dark:ring-offset-slate-900"
                            );
                        }, 2000);

                        // Close mobile menu if open
                        const sidebar = document.getElementById("sidebar");
                        const overlay = document.getElementById("mobileOverlay");
                        if (sidebar && overlay) {
                            sidebar.classList.remove("translate-x-0");
                            sidebar.classList.add("-translate-x-full");
                            overlay.classList.add("hidden", "opacity-0");
                        }
                    }
                };
        </script>
    </body>
</html>
