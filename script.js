document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const ipAddressElement = document.getElementById('ip-address');
    const badgeContainer = document.getElementById('badges');
    const mapElement = document.getElementById('map');
    
    // Details Elements
    const cityEl = document.getElementById('city');
    const regionEl = document.getElementById('region');
    const countryEl = document.getElementById('country');
    const postalEl = document.getElementById('postal');
    const continentEl = document.getElementById('continent');
    const timezoneEl = document.getElementById('timezone');
    const ispEl = document.getElementById('isp');
    const asnEl = document.getElementById('asn');
    const currencyEl = document.getElementById('currency');
    const callingCodeEl = document.getElementById('calling-code');
    
    // Device Elements
    const browserEl = document.getElementById('browser');
    const osEl = document.getElementById('os');
    const screenEl = document.getElementById('screen');
    
    // Controls
    const ipInput = document.getElementById('ip-input');
    const searchBtn = document.getElementById('search-btn');
    const infoBtn = document.getElementById('info-btn');
    const historyBtn = document.getElementById('history-btn');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    const toast = document.getElementById('toast');
    const ipDisplay = document.getElementById('ip-display');
    
    // Modal
    const modalBackdrop = document.getElementById('info-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // Map Variable
    let map = null;

    // --- Core Logic ---

    async function fetchIPData(ip = '') {
        // UI Loading State
        ipAddressElement.textContent = 'Loading...';
        
        try {
            const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.reason || 'Invalid IP');
            }

            updateUI(data);
            
            // Save to history if it's a specific search OR just the user's IP (limit redundancy maybe?)
            // We'll save everything valid
            addToHistory(data.ip, `${data.city}, ${data.country_name}`);
            
        } catch (error) {
            console.error(error);
            ipAddressElement.textContent = 'Error';
            // Optional: Show a toast for the error
            showToast(`Error: ${error.message}`, true);
        }
    }

    function updateUI(data) {
        // 1. Update Header Info
        ipAddressElement.textContent = data.ip;
        
        // Badges (IP Version, Privacy - inferred)
        badgeContainer.innerHTML = '';
        const badges = [];
        if (data.version) badges.push(data.version);
        if (data.in_eu) badges.push('EU');
        
        badges.forEach(text => {
            const span = document.createElement('span');
            span.className = 'badge';
            span.textContent = text;
            badgeContainer.appendChild(span);
        });

        // 2. Update Location Details
        cityEl.textContent = data.city || '-';
        regionEl.textContent = data.region || '-';
        countryEl.textContent = data.country_name || '-';
        postalEl.textContent = data.postal || '-';
        continentEl.textContent = data.continent_code || '-';
        timezoneEl.textContent = data.timezone || '-';

        // 3. Update Network Details
        ispEl.textContent = data.org || '-';
        asnEl.textContent = data.asn || '-';
        currencyEl.textContent = data.currency || '-';
        callingCodeEl.textContent = data.country_calling_code ? `+${data.country_calling_code}` : '-';

        // 4. Update Map
        if (data.latitude && data.longitude) {
            updateMap(data.latitude, data.longitude, data.city);
        }
    }

    function updateMap(lat, lng, label) {
        if (!map) {
            // First time initialization
            map = L.map('map').setView([lat, lng], 13);
            
            // Dark Mode Map Tiles (CartoDB Dark Matter)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributor',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
        } else {
            map.setView([lat, lng], 13);
        }

        // Add user marker
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<b>${label || 'Location'}</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
    }

    // --- Search History Logic ---
    function addToHistory(ip, location) {
        let history = JSON.parse(localStorage.getItem('ip_history')) || [];
        
        // Remove duplicates (move to top)
        history = history.filter(item => item.ip !== ip);
        
        // Add new
        history.unshift({ ip, location, timestamp: Date.now() });
        
        // Limit to 10
        if (history.length > 10) history.pop();
        
        localStorage.setItem('ip_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('ip_history')) || [];
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div style="color: var(--text-secondary); padding: 0.5rem; text-align: center;">No recent searches</div>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="history-ip">${item.ip}</span>
                <span class="history-loc">${item.location}</span>
            `;
            div.addEventListener('click', () => {
                fetchIPData(item.ip);
                historyPanel.classList.remove('show');
            });
            historyList.appendChild(div);
        });
    }

    function clearHistory() {
        localStorage.removeItem('ip_history');
        renderHistory();
    }

    // --- Device Info Logic ---
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = "Unknown";
        if (ua.indexOf("Chrome") > -1) browserName = "Chrome";
        else if (ua.indexOf("Safari") > -1) browserName = "Safari";
        else if (ua.indexOf("Firefox") > -1) browserName = "Firefox";
        else if (ua.indexOf("MSIE") > -1 || !!document.documentMode) browserName = "IE"; 
        
        return browserName;
    }

    function getOSInfo() {
        let os = "Unknown";
        if (navigator.appVersion.indexOf("Win") != -1) os = "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) os = "MacOS";
        if (navigator.appVersion.indexOf("X11") != -1) os = "UNIX";
        if (navigator.appVersion.indexOf("Linux") != -1) os = "Linux";
        return os;
    }

    function initDeviceInfo() {
        browserEl.textContent = getBrowserInfo();
        osEl.textContent = getOSInfo();
        screenEl.textContent = `${window.screen.width} x ${window.screen.height}`;
    }

    // --- Toast Logic ---
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.background = isError ? '#ef4444' : '#10b981';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Lesson Carousel Logic ---
    const lessons = [
        {
            title: "Lesson 1: What is an IP Address?",
            icon: "🌐",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
                <p>An <strong>IP (Internet Protocol) Address</strong> is like a digital home address for your device. Just as your physical mail needs a street address to reach you, internet data needs an IP address to find your computer or phone.</p>
                <p>Every time you visit a website, your device sends a request with your IP address so the website knows where to send the information back.</p>
                <ul>
                    <li><span class="key-term">Public IP:</span> The address the outside world sees (assigned by your ISP).</li>
                    <li><span class="key-term">Private IP:</span> The address used only within your home Wi-Fi network (usually starts with 192.168...).</li>
                </ul>
            `
        },
        {
            title: "Lesson 2: IPv4 vs IPv6",
            icon: "🔢",
            content: `
               <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg></div>
               <p>The internet is upgrading! There are two main versions of IP addresses:</p>
               <ul>
                   <li><span class="key-term">IPv4 (Old):</span> Looks like <code>192.168.1.1</code>. We only have about 4 billion of these, and we ran out of them years ago!</li>
                   <li><span class="key-term">IPv6 (New):</span> Looks like <code>2001:0db8:85a3...</code>. It uses hexadecimals and allows for an almost infinite number of addresses—enough for every grain of sand on Earth to have its own IP!</li>
               </ul>
               <p>Your connection likely uses both simultaneously right now.</p>
            `
        },
        {
            title: "Lesson 3: How Geolocation Works",
            icon: "📍",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                <p>How do we know where you are? It's not magic, and it's not GPS!</p>
                <p>We use <strong>IP Geolocation Databases</strong>. Companies map large blocks of IP addresses to specific ISPs in specific cities.</p>
                <p><strong>Accuracy:</strong> It's usually accurate to the <em>City</em> or <em>Zip Code</em> level, but rarely your exact house. It often points to your ISP's local switching center.</p>
                <p><em>Fun Fact:</em> Mobile data IPs (4G/5G) are notoriously inaccurate because you might be routed through a tower in a different city.</p>
            `
        },
        {
            title: "Lesson 4: Understanding Network Terms",
            icon: "🏢",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path></svg></div>
                <p>When you look up an IP, you'll see these terms:</p>
                <ul>
                    <li><span class="key-term">ISP (Internet Service Provider):</span> The company you pay for internet (e.g., Verizon, AT&T).</li>
                    <li><span class="key-term">ASN (Autonomous System Number):</span> A unique ID for a large network on the internet. Big companies (Google, Netflix, ISPs) have their own ASNs to route traffic efficiently. It's like a Zip Code for the internet backbone.</li>
                </ul>
            `
        },
        {
            title: "Lesson 5: Privacy & VPNs",
            icon: "🛡️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
                <p>Your IP address is public information to every site you visit. They can use it to track you or block you.</p>
                <p><strong>How to hide it?</strong></p>
                <ul>
                    <li><span class="key-term">VPN (Virtual Private Network):</span> Routes your traffic through a server in another location. Sites see the VPN's IP, not yours.</li>
                    <li><span class="key-term">Proxy:</span> Similar to a VPN but usually for just one app or browser tab.</li>
                </ul>
                <p>If you see a location here that isn't yours, you might be connected to a VPN!</p>
            `
        }
    ];

    let currentSlideIndex = 0;
    const modalBody = document.getElementById('modal-body');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const dotsContainer = document.getElementById('pagination-dots');

    function renderSlide(index) {
        const lesson = lessons[index];
        modalBody.innerHTML = `
            <div class="lesson-slide active">
                <h3>${lesson.icon} ${lesson.title}</h3>
                ${lesson.content}
            </div>
        `;
        
        // Update dots
        dotsContainer.innerHTML = '';
        lessons.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `dot ${i === index ? 'active' : ''}`;
            dotsContainer.appendChild(dot);
        });

        // Update buttons
        prevBtn.disabled = index === 0;
        nextBtn.textContent = index === lessons.length - 1 ? 'Finish' : 'Next';
        
        // Animate scrollTop
        modalBody.scrollTop = 0;
    }

    function changeSlide(direction) {
        const newIndex = currentSlideIndex + direction;
        if (newIndex >= 0 && newIndex < lessons.length) {
            currentSlideIndex = newIndex;
            renderSlide(currentSlideIndex);
        } else if (newIndex >= lessons.length) {
            closeModal();
        }
    }

    function openModal() {
        modalBackdrop.classList.add('open');
        currentSlideIndex = 0;
        renderSlide(0);
    }

    function closeModal() {
        modalBackdrop.classList.remove('open');
    }

    // --- Event Listeners ---
    
    // Slide Navigation
    prevBtn.addEventListener('click', () => changeSlide(-1));
    nextBtn.addEventListener('click', () => changeSlide(1));

    // Search
    function handleSearch() {
        const ip = ipInput.value.trim();
        if (ip) {
            fetchIPData(ip);
        }
    }

    searchBtn.addEventListener('click', handleSearch);
    
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Copy IP
    ipDisplay.addEventListener('click', () => {
        const text = ipAddressElement.textContent;
        if (text && text !== 'Loading...' && text !== 'Error') {
            navigator.clipboard.writeText(text);
            showToast('Copied IP Address!');
        }
    });

    // History Events
    historyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        historyPanel.classList.toggle('show');
        renderHistory();
    });

    clearHistoryBtn.addEventListener('click', clearHistory);

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (!historyPanel.contains(e.target) && e.target !== historyBtn && !historyBtn.contains(e.target)) {
            historyPanel.classList.remove('show');
        }
    });


    // Modal Events
    infoBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalBackdrop.classList.contains('open')) closeModal();
            if (historyPanel.classList.contains('show')) historyPanel.classList.remove('show');
        }
    });

    // --- Initialization ---
    initDeviceInfo();
    fetchIPData(); // Load own IP on start
});
