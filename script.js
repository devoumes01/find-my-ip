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
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
        } else {
            map.setView([lat, lng], 13);
        }

        // Add user marker
        // Clear existing markers first (optional but good practice if moving a lot)
        // For simplicity, just adding a new one is okay as Leaflet handles layers well, 
        // but let's be clean and remove old ones if we tracked them. 
        // For this simple app, just adding on top is fine or we can clear:
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<b>${label || 'Location'}</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
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

    // --- Modal Logic ---
    function openModal() {
        modalBackdrop.classList.add('open');
    }

    function closeModal() {
        modalBackdrop.classList.remove('open');
    }

    // --- Event Listeners ---
    
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
        if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
            closeModal();
        }
    });

    // --- Initialization ---
    initDeviceInfo();
    fetchIPData(); // Load own IP on start
});
