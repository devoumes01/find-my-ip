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
    
    // Demographics Elements
    const populationEl = document.getElementById('population');
    const languagesEl = document.getElementById('languages');
    const tldEl = document.getElementById('tld');
    const areaCodeEl = document.getElementById('area-code');

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

        // 4. Update Demographics
        populationEl.textContent = data.country_population ? new Intl.NumberFormat().format(data.country_population) : '-';
        languagesEl.textContent = data.languages ? data.languages.split(',')[0] : '-'; // just show first
        tldEl.textContent = data.country_tld || '-';
        areaCodeEl.textContent = data.country_area ? `${new Intl.NumberFormat().format(data.country_area)} km²` : '-';

        // 5. Update Map
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
                <ul>
                    <li><span class="key-term">Public IP:</span> The address the outside world sees (assigned by your ISP).</li>
                    <li><span class="key-term">Private IP:</span> The address used within your home Wi-Fi (e.g., 192.168.x.x).</li>
                </ul>
            `
        },
        {
            title: "Lesson 2: IPv4 vs IPv6",
            icon: "🔢",
            content: `
               <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line></svg></div>
               <p>Two versions of IP addresses exist:</p>
               <ul>
                   <li><span class="key-term">IPv4:</span> (e.g., <code>192.168.1.1</code>). Limited to 4.3 billion addresses. We ran out years ago!</li>
                   <li><span class="key-term">IPv6:</span> (e.g., <code>2001:0db8...</code>). Uses hexadecimals. There are enough addresses for every atom on Earth.</li>
               </ul>
            `
        },
        {
            title: "Lesson 3: How Geolocation Works",
            icon: "📍",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg></div>
                <p>IP Geolocation isn't GPS. It maps large blocks of IP addresses to specific ISPs in cities.</p>
                <p><strong>Accuracy:</strong> Usually accurate to the city level, but never your exact house. It often points to your ISP's nearest data center.</p>
            `
        },
        {
            title: "Lesson 4: ISP & ASN",
            icon: "🏢",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l8-4 8 4v14"></path></svg></div>
                <ul>
                    <li><span class="key-term">ISP:</span> Internet Service Provider (e.g., Comcast, AT&T). They connect you to the web.</li>
                    <li><span class="key-term">ASN:</span> Autonomous System Number. A unique ID for large networks (Google, Netflix, ISPs) that helps route traffic globally.</li>
                </ul>
            `
        },
        {
            title: "Lesson 5: Privacy & VPNs",
            icon: "🛡️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
                <p>Sites can track you via your IP. To hide it:</p>
                <ul>
                    <li><span class="key-term">VPN:</span> Routes traffic through a remote server. Sites see the VPN's IP, not yours.</li>
                    <li><span class="key-term">Proxy:</span> Similar to VPN but usually web-only and less secure.</li>
                </ul>
            `
        },
        {
            title: "Lesson 6: Static vs Dynamic IPs",
            icon: "🔄",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 2.66 5.5"></path></svg></div>
                <ul>
                    <li><span class="key-term">Dynamic:</span> Temporary IP from your ISP. Changes when you restart your router. Common for homes.</li>
                    <li><span class="key-term">Static:</span> Permanent IP. Used by businesses for servers/CCTV so they are always at the same address.</li>
                </ul>
            `
        },
        {
            title: "Lesson 7: The Tor Network",
            icon: "🧅",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div>
                <p><strong>Tor (The Onion Router)</strong> bounces traffic through 3 volunteer nodes globally. Each hop peels off a layer of encryption.</p>
                <p>It provides extreme anonymity but is much slower than a normal connection.</p>
            `
        },
        {
            title: "Lesson 8: What is DNS?",
            icon: "📖",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
                <p><strong>DNS (Domain Name System)</strong> is the phonebook of the internet. It turns human names like <code>google.com</code> into IP addresses like <code>142.250.x.x</code> that computers understand.</p>
            `
        },
        {
            title: "Lesson 9: DDoS Attacks",
            icon: "🚨",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg></div>
                <p><strong>DDoS (Distributed Denial of Service)</strong>: A cyberattack where thousands of hacked devices (botnet) flood a server with traffic to crash it.</p>
            `
        },
        // --- NEW LESSONS ---
        {
            title: "Lesson 10: MAC Address vs IP",
            icon: "🆔",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><path d="M6 6h.01M6 18h.01"></path></svg></div>
                <ul>
                    <li><span class="key-term">IP Address:</span> Your digital location. Changeable (like moving houses).</li>
                    <li><span class="key-term">MAC Address:</span> A permanent serial number burned into your network card. Unique to every device hardware.</li>
                </ul>
            `
        },
        {
            title: "Lesson 11: TCP vs UDP",
            icon: "📦",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>
                <p>Two ways to send data:</p>
                <ul>
                    <li><span class="key-term">TCP:</span> Reliable. Checks if every packet arrived perfectly (Websites, Email).</li>
                    <li><span class="key-term">UDP:</span> Fast. Sends packets blindly without checking errors (Gaming, Video Streaming).</li>
                </ul>
            `
        },
        {
            title: "Lesson 12: What is a Port?",
            icon: "🚪",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-6"></path><path d="M12 8V2"></path><rect x="4" y="8" width="16" height="8" rx="2"></rect></svg></div>
                <p>If an IP is the building address, the <strong>Port</strong> is the specific apartment number.</p>
                <p>Web traffic goes to Port 80/443, Email to Port 25. This lets your computer do many things at once on one specific IP.</p>
            `
        },
        {
            title: "Lesson 13: NAT (Network Address Translation)",
            icon: "🔀",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg></div>
                <p>NAT allows your entire home (Phones, TVs, Laptops) to share <strong>ONE single Public IP</strong>.</p>
                <p>Your router acts as the middleman, sorting incoming mail to the correct device inside the house.</p>
            `
        },
        {
            title: "Lesson 14: DHCP",
            icon: "🏷️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg></div>
                <p><strong>DHCP (Dynamic Host Configuration Protocol)</strong> is the system that automatically assigns IP addresses when you join a Wi-Fi network.</p>
                <p>Without it, you'd have to manually type connection settings every time you sat down at a cafe!</p>
            `
        },
        {
            title: "Lesson 15: Subnet Masks",
            icon: "🎭",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
                <p>A <strong>Subnet Mask</strong> (usually 255.255.255.0) tells your device which part of the IP address is the "Network ID" (The Street) and which part is the "Host ID" (The House Number).</p>
            `
        },
        {
            title: "Lesson 16: The Ping Command",
            icon: "🏓",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div>
                <p><strong>Ping</strong> measures how fast a signal travels from you to a server and back. It's measured in milliseconds (ms).</p>
                <p>Low ping is crucial for gaming. High ping causes "lag".</p>
            `
        },
        {
            title: "Lesson 17: Packet Loss",
            icon: "💔",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg></div>
                <p>Data travels in small chunks called "packets". Sometimes, due to congestion or bad cables, packets get lost on the way.</p>
                <p>This results in jittery video calls, rubber-banding in games, or slow downloads.</p>
            `
        },
        {
            title: "Lesson 18: Bandwidth vs Latency",
            icon: "🏎️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V6"></path><path d="M6 20v-8"></path></svg></div>
                <ul>
                    <li><span class="key-term">Bandwidth:</span> The <em>width</em> of the pipe. How much data can fit at once (Download speed).</li>
                    <li><span class="key-term">Latency:</span> The <em>speed</em> of travel. How fast a single drop gets there (Ping).</li>
                </ul>
                <p>You can have high bandwidth but terrible latency (e.g., Satellite internet).</p>
            `
        },
        {
            title: "Lesson 19: Firewalls",
            icon: "🔥",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                <p>A <strong>Firewall</strong> is a security guard that monitors traffic. It blocks unauthorized access to your ports while allowing safe traffic (like Netflix) to pass through.</p>
            `
        },
        {
            title: "Lesson 20: HTTP vs HTTPS",
            icon: "🔒",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg></div>
                <p>Always look for the <strong>padlock icon</strong>!</p>
                <ul>
                    <li><span class="key-term">HTTP:</span> Transmits data in plain text. Anyone on the Wi-Fi can read your passwords.</li>
                    <li><span class="key-term">HTTPS:</span> Encrypted. Only you and the server can read the data.</li>
                </ul>
            `
        },
        {
            title: "Lesson 21: SSL/TLS Certificates",
            icon: "📜",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                <p>These are digital ID cards that prove a website is who it claims to be. They enable the HTTPS encryption. If a cert is expired, your browser warns you "Connection Not Private".</p>
            `
        },
        {
            title: "Lesson 22: Cookies",
            icon: "🍪",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-5.38c-3.09-.48-4.28.43-5.96 1.58"></path></svg></div>
                <p>Not the tasty kind! Cookies are small text files websites save on your computer to remember your login or cart items. They track you across the web more effectively than just your IP.</p>
            `
        },
        {
            title: "Lesson 23: Dark Web vs Deep Web",
            icon: "🕵️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
                <ul>
                    <li><span class="key-term">Deep Web:</span> 90% of the internet. Anything not indexed by Google (Emails, Banking portals).</li>
                    <li><span class="key-term">Dark Web:</span> A small slice intentionally hidden and accessible only via Tor. Often used for illegal activity but also for activists in oppressive regimes.</li>
                </ul>
            `
        },
        {
            title: "Lesson 24: Localhost (127.0.0.1)",
            icon: "🏠",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
                <p><strong>There's no place like 127.0.0.1</strong>.</p>
                <p>This is a special "loopback" address that always points back to <em>your own computer</em>. Developers use it to test websites before they go live on the internet.</p>
            `
        },
        {
            title: "Lesson 25: Modem vs Router",
            icon: "📡",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg></div>
                <ul>
                    <li><span class="key-term">Modem:</span> Translates the signal from the ISP cable into digital data.</li>
                    <li><span class="key-term">Router:</span> Takes that data and broadcasts it via Wi-Fi to multiple devices.</li>
                </ul>
                <p>Most ISPs provide a "Gateway" which combines both dealing in one box.</p>
            `
        },
        {
            title: "Lesson 26: Phishing",
            icon: "🎣",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <p>Phishing is when hackers create fake emails or websites (like a fake Bank login) to trick you into typing your password. They don't hack the computer; they hack the human.</p>
            `
        },
        {
            title: "Lesson 27: IP Spoofing",
            icon: "🎭",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2.05 6.6a10 10 0 0 1 19.9 0"></path><path d="M12 2A10 10 0 0 0 12 22"></path></svg></div>
                <p>Hackers can modify packet headers to make it look like data is coming from a trusted IP address, bypassing firewalls or framing someone else for an attack.</p>
            `
        },
        {
            title: "Lesson 28: Man-in-the-Middle Attack",
            icon: "👥",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                <p>If you use public, unencrypted Wi-Fi (like at a cafe), a hacker can secretly intercept the data passing between you and the router, stealing data in transit.</p>
            `
        },
        {
            title: "Lesson 29: What is a CDN?",
            icon: "🌍",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
                <p>A <strong>Content Delivery Network</strong> (like Cloudflare) keeps copies of websites on servers in every country.</p>
                <p>When you visit a site, you download images from the server closest to you, not the main server halfway across the world. This makes the web fast.</p>
            `
        },
        {
            title: "Lesson 30: IoT Security Risks",
            icon: "💡",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path><line x1="12" y1="22" x2="12" y2="22"></line></svg></div>
                <p><strong>Internet of Things</strong> (Smart Fridges, Cameras) often have weak security.</p>
                <p>Hackers hijack these devices to form botnets. Your toaster could currently be attacking a government server!</p>
            `
        },
        {
            title: "Lesson 31: Whois Lookup",
            icon: "❓",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <p>WHOIS is a public database that tells you who creates/owns a website domain or IP address. Privacy protection services now obscure most of this data for individuals.</p>
            `
        },
        {
            title: "Lesson 32: WebRTC Leaks",
            icon: "💧",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg></div>
                <p>WebRTC allows video chat in browsers. However, it can leak your real IP address even if you are using a VPN!</p>
            `
        },
        {
            title: "Lesson 33: Undersea Cables",
            icon: "🌊",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
                <p>99% of international data travels via massive fiber-optic cables laid on the ocean floor. They are the size of a garden hose but carry the entire internet between continents.</p>
            `
        },
        {
            title: "Lesson 34: 5G Networking",
            icon: "📶",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg></div>
                <p>5G brings lower latency (1ms) and higher density (1 million devices per sq km). This enables self-driving cars and remote surgery, which rely on instant IP communication.</p>
            `
        },
        {
            title: "Lesson 35: Starlink & Satellite Internet",
            icon: "🛰️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
                <p>Traditional satellites are 35,000km up (high lag). LEO (Low Earth Orbit) satellites like Starlink are only 550km up, allowing low-latency internet anywhere on Earth.</p>
            `
        },
        {
            title: "Lesson 36: Net Neutrality",
            icon: "⚖️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg></div>
                <p>The principle that ISPs should treat all internet data equally, not charging more for Netflix or slowing down competitors. It keeps the web a fair playing field.</p>
            `
        },
        {
            title: "Lesson 37: Broadcast vs Multicast",
            icon: "📢",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg></div>
                <ul>
                    <li><span class="key-term">Unicast:</span> One-to-one (Web browsing).</li>
                    <li><span class="key-term">Broadcast:</span> One-to-all (Shouting to the whole room).</li>
                    <li><span class="key-term">Multicast:</span> One-to-many (Cable TV style efficient streaming).</li>
                </ul>
            `
        },
        {
            title: "Lesson 38: Traceroute",
            icon: "🛤️",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg></div>
                <p>A tool that records every "hop" (router) your data takes to reach a destination. It helps diagnose where the internet is broken if a site isn't loading.</p>
            `
        },
        {
            title: "Lesson 39: Zero Rating",
            icon: "🆓",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg></div>
                <p>When an ISP lets you use a specific app (like WhatsApp or Spotify) without it counting against your monthly data cap. It's convenient but controversial for Net Neutrality.</p>
            `
        },
        {
            title: "Lesson 40: The Future (Web 3.0)",
            icon: "🚀",
            content: `
                <div class="lesson-image"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg></div>
                <p>Future internet (Web3) aims to be decentralized via blockchain (IPFS), where sites aren't hosted on one server but distributed across everyone's devices, making them impossible to censor.</p>
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
        
        // Update Counter (instead of 40 separate dots)
        dotsContainer.innerHTML = `<span class="lesson-counter">Lesson ${index + 1} of ${lessons.length}</span>`;

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

    // --- Mobile Viewport Fix ---
    function setAppHeight() {
        const doc = document.documentElement;
        doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }
    
    window.addEventListener('resize', setAppHeight);
    setAppHeight(); // Call on load

    // --- Initialization ---
    initDeviceInfo();
    fetchIPData(); // Load own IP on start
});
