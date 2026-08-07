const fs = require('fs');
let html = fs.readFileSync('e:/SecurePush/web/app/page_body.txt', 'utf8');

// React-ify
html = html.replace(/class=/g, 'className=');
html = html.replace(/for=/g, 'htmlFor=');
html = html.replace(/<br>/g, '<br/>');
html = html.replace(/<hr>/g, '<hr/>');
html = html.replace(/<img([^>]*[^/])>/g, '<img$1/>');
html = html.replace(/<input([^>]*[^/])>/g, '<input$1/>');

html = html.replace(/style=\"(.*?)\"/g, (match, styleString) => {
    const parts = styleString.split(';').filter(p => p.trim() !== '');
    const obj = {};
    parts.forEach(p => {
        const [key, ...valParts] = p.split(':');
        const val = valParts.join(':');
        if (key && val) {
            const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            obj[camelKey] = val.trim();
        }
    });
    return 'style={' + JSON.stringify(obj) + '}';
});

// Drop the <header className="topbar"> entirely
html = html.replace(/<header className="topbar">[\s\S]*?<\/header>/, '');

fs.writeFileSync('e:/SecurePush/web/app/page_body.jsx', html);
console.log('Done creating page_body.jsx');
