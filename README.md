# 🌍 Find My IP | Advanced IP Intelligence Dashboard

A professional, privacy-focused IP address lookup tool featuring a stunning Glassmorphism UI, interactive mapping, and a comprehensive educational hub. Built with pure Vanilla JavaScript, HTML5, and CSS3.

**Live Demo:** [https://bhanu2006-24.github.io/find-my-ip/](https://bhanu2006-24.github.io/find-my-ip/)

![Project Preview](https://img.shields.io/badge/Status-Live-success?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## ✨ Key Features

### 🔍 **Advanced Lookup Engine**

- **Instant Detection**: Automatically identifies your public IPv4/IPv6, location, and ISP on load.
- **Universal Search**: Lookup details for _any_ IP address globally.
- **Search History**: Automatically saves your recent queries for quick access (persisted securely in LocalStorage).

### 📊 **Rich Data & Intelligence**

- **Network Insights**: ISP name, ASN (Autonomous System Number), Connection Type, and Timezone.
- **Demographics**: Country Population, Primary Languages, Currency, TLD, and Area Code.
- **Device Fingerprinting**: Detects your local Browser, Operating System, and Screen Resolution.
- **Map Visualization**: Interactive dark-mode map powered by **Leaflet.js** for precise geolocation.

### 🎓 **IP Learning Center**

A built-in interactive educational carousel featuring 9+ detailed lessons on:

- What an IP Address is (Public vs Private)
- IPv4 vs IPv6
- How Geolocation works
- Understanding ISP & ASN
- Privacy, VPNs, and Proxies
- Static vs Dynamic IPs
- Tor Network & DDoS Attacks

### 🎨 **Modern Experience**

- **Glassmorphism Design**: Sleek, translucent UI with backdrop blurs and smooth gradients.
- **Fully Responsive**: Optimized layouts for Mobile, Tablet, and Desktop.
- **Dark Mode Native**: Designed from the ground up for eye comfort.
- **Animations**: Smooth transitions and entry animations.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (CSS Variables, Flexbox, Grid), JavaScript (ES6+).
- **Mapping Engine**: [Leaflet.js](https://leafletjs.com/) + CartoDB Dark Matter Tiles.
- **Data Source**: [ipapi.co](https://ipapi.co/) (No API key required for standard usage).
- **Typography**: Inter (Google Fonts).

## 🚀 Getting Started

To run this project locally, simply clone the repository and open `index.html`. No build process or heavy node_modules required!

```bash
# Clone the repository
git clone https://github.com/bhanu2006-24/find-my-ip.git

# Navigate to the directory
cd find-my-ip

# Open the app (Mac)
open index.html
# Or just double-click index.html in your file explorer
```

## 📝 Usage Guide

1.  **View Your Info**: The dashboard loads your details immediately.
2.  **Search**: Type an IP (e.g., `1.1.1.1` or `2406:b400:...`) in the header search bar and hit Enter.
3.  **Explore**:
    - Click the **History Clock** 🕓 in the header to seeing past searches.
    - Click the **Help Icon** [?] to open the Learning Center.
    - Click your **IP Address** to copy it to the clipboard.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/bhanu2006-24">Bhanu Pratap Saini</a></sub>
</div>
