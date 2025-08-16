# Fiverr Chat Loader Extension

This project is a simple chrome browser userscript/extension that allows you to load and browse your Fiverr conversations in a custom chat panel with:

- **Floating chat window** overlay on Fiverr  
- **Load More (Older)** button to fetch messages before the earliest loaded  
- **Scroll-to-Top** button for quick navigation  
- **Inline media preview** (images open in a new tab when clicked)  
- **Disabled background scrolling** while the panel is open  

---

## 🚀 How to Use

1. Copy the full script (`chat-loader.js`) into your browser extension / userscript environment (e.g. Tampermonkey, Greasemonkey, or Chrome extension content script).  

2. Navigate to your Fiverr inbox conversation page using this URL format:  

https://www.fiverr.com/inbox/contacts/client/conversation?timestamp=<unix-timestamp-ms>
https://www.fiverr.com/inbox/contacts/client/conversation?timestamp=1751802826538


- Replace `client` with **your Fiverr client**  
- Replace the timestamp with the time you want to load messages up to.  
  - It must be in **milliseconds** (e.g., `Date.now()` in your browser console).

3. Once the page loads, a **chat panel** will appear with controls at the top:
- Select a **Last Date & Time** and click **Load** to fetch messages.  
- Use **Load More (Older)** to fetch earlier messages.  
- Use the **↑ Scroll-to-Top** button to quickly return to the beginning of the chat.  

---

## 🛠 Notes

- You need to be **logged in to Fiverr** in the same browser for the fetch requests to succeed.  
- This works only on Fiverr conversation URLs (`/inbox/contacts/.../conversation`).  
- Background scrolling is disabled while the panel is open for a cleaner chat experience.  

---

## ⚠️ Disclaimer

This tool is for **personal use only**. It is not affiliated with Fiverr in any way. Use at your own risk.

