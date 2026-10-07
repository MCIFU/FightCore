/**
 * Inline script for <head>: runs before first paint so the page never flashes
 * the wrong theme. Kept out of the client component module so the server
 * layout gets the string itself, not a client reference.
 */
// The stored choice, else the system preference.
export const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem("fc:theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#f6f3ec":"#0b0c0e")})()`;
