!function() {
    let e = !1;
    function n() {
        const e = document.getElementById("loader-overlay");
        e && e.remove()
    }
    function r() {
        !function() {
            const e = document.createElement("style");
            e.textContent = "\n        #loader-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95);\n          display:flex; align-items:center; justify-content:center; z-index:9999; }\n        @keyframes spin { from {transform:rotate(0)} to {transform:rotate(360deg)} }\n        #loader-spinner { width:60px; height:60px;\n          border:6px solid #222; border-top:6px solid #0ff;\n          border-radius:50%; animation:spin 1s linear infinite; }\n      ",
            document.head.appendChild(e);
            const n = document.createElement("div");
            n.id = "loader-overlay",
            n.innerHTML = '<div id="loader-spinner"></div>',
            document.body.appendChild(n)
        }();
        const build = [
            "scripts/image.js", 
            "scripts/link.js", 
            "scripts/theme.js", 
            "scripts/save.js", 
            "scripts/audio.js", 
            "scripts/player.js", 
            "scripts/banner.js", 
            "scripts/performance.js", 
            "scripts/render.js", 
            "scripts/export.js", 
            "scripts/recorder.js", 
            "scripts/parse.js", 
            "scripts/stay.js", 
            "scripts/right.js",
            "scripts/info.js",
            "scripts/color.js", 
            "scripts/format.js", 
            "scripts/flowchart.js", 
            "scripts/search.js", 
            "scripts/shuffle.js", 
            "scripts/show.js", 
            "scripts/gpu.js", 
            "scripts/video.js", 
            ...(window.userLoggedIn ? ["scripts/find.js"] : []),
            ...(window.userLoggedIn ? ["scripts/p2p.js"] : []),
        ];
        build.reduce(((n, r) => n.then(() => new Promise((e, n) => {
            const o = document.createElement("script");
            o.src = r;
            o.onload = e;
            o.onerror = () => n(new Error(`Failed to load ${r}`));
            document.head.appendChild(o);
        }))), Promise.resolve()).then(( () => console.log("Initialized"))).catch((e => console.error(e))).finally(n)
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", r) : r()
}();