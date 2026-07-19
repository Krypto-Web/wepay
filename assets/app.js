// ===== WePay shared client & helpers =====
// Loaded on every page AFTER the supabase-js CDN script tag.

const SUPABASE_URL = "https://cyruvkrfmbnldaajjdml.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_j1v9aSTqXP-1Fg9hl9tyrw_9Fp8YxvN";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redirect to /login.html if not signed in. Call at top of protected pages.
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "login";
    return null;
  }
  return session.user;
}

// Redirect non-admins away from admin.html
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  const { data: profile, error } = await sb.from("profiles").select("*").eq("id", user.id).single();
  if (error || !profile || profile.role !== "admin") {
    window.location.href = "dashboard";
    return null;
  }
  return profile;
}

async function getMyProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).single();
  if (error) { console.error(error); return null; }
  return data;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = "login";
}

function fmtUSD(n) {
  return "$" + Number(n || 0).toFixed(2);
}

function toast(msg, isError = false) {
  let el = document.getElementById("wp-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "wp-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = isError ? "wp-toast wp-toast-error show" : "wp-toast show";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3500);
}

// Renders the shared top nav + sidebar into elements with id="wp-nav"
function renderNav(active) {
  const items = [
    ["dashboard", "Dashboard"],
    ["ptc", "View Ads"],
    ["surf", "Surf & Earn"],
    ["referral", "Referrals"],
    ["withdraw", "Withdraw"],
  ];
  const links = items.map(([href, label]) =>
    `<a href="${href}" class="${active === href ? 'active' : ''}">${label}</a>`
  ).join("");
  const el = document.getElementById("wp-nav");
  if (el) {
    el.innerHTML = `
      <div class="wp-nav-inner">
        <a href="dashboard" class="wp-logo">WePay</a>
        <nav class="wp-links">${links}</nav>
        <span id="wp-admin-link"></span>
        <button class="wp-signout" onclick="signOut()">Sign Out</button>
      </div>`;
    // Show an Admin link if the current user is an admin (fire-and-forget, non-blocking)
    getMyProfile().then(p => {
      if (p && p.role === "admin") {
        document.getElementById("wp-admin-link").innerHTML =
          `<a href="admin" style="color:var(--gold); font-size:14px; margin-right:6px;">${active === "admin" ? '<b>Admin</b>' : 'Admin'}</a>`;
      }
    });
  }
}
