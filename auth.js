// v1.1 Authentication layer
// Uses the browser-safe Supabase publishable key.
// The CRM remains static/local-data for now; this milestone adds real user authentication.

(function () {
  const config = window.CRM_CONFIG || {};
  const supabaseUrl = config.supabaseUrl;
  const supabaseKey = config.supabasePublishableKey || config.supabaseAnonKey;

  const authCss = `
    #auth-screen{position:fixed;inset:0;background:#f5f7fb;display:grid;place-items:center;padding:24px;z-index:1000}
    #auth-screen.auth-hidden{display:none}
    .auth-card{width:min(430px,100%);background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:30px;box-shadow:0 20px 45px rgba(16,24,40,.10)}
    .auth-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;margin-bottom:24px}
    .auth-mark{width:36px;height:36px;border-radius:10px;background:#101828;color:#fff;display:grid;place-items:center}
    .auth-card h2{margin:0 0 7px;font-size:24px}
    .auth-subtitle{margin:0 0 22px;color:#667085;font-size:14px;line-height:1.5}
    .auth-form{display:grid;gap:14px}
    .auth-form label{display:grid;gap:6px;font-size:13px;font-weight:650;color:#344054}
    .auth-form input{width:100%;border:1px solid #d7dce5;border-radius:8px;padding:11px 12px;background:#fff}
    .auth-form input:focus{outline:2px solid rgba(23,92,211,.15);border-color:#175cd3}
    .auth-submit{border:0;background:#175cd3;color:#fff;border-radius:8px;padding:11px 14px;font-weight:700;margin-top:4px}
    .auth-submit:disabled{opacity:.6;cursor:wait}
    .auth-switch{border:0;background:transparent;color:#175cd3;font-weight:650;padding:5px;margin-top:2px}
    .auth-message{min-height:20px;font-size:13px;line-height:1.4;margin-top:2px}
    .auth-error{color:#b42318}.auth-success{color:#067647}
    .auth-user{display:flex;align-items:center;gap:10px;color:#667085;font-size:13px}
    .auth-user-email{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #auth-logout{border:1px solid #d7dce5;background:#fff;color:#344054;border-radius:8px;padding:8px 12px}
  `;

  const style = document.createElement('style');
  style.textContent = authCss;
  document.head.appendChild(style);

  const screen = document.createElement('div');
  screen.id = 'auth-screen';
  screen.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand"><span class="auth-mark">C</span><span>CRM Platform</span></div>
      <h2 id="auth-title">Sign in</h2>
      <p id="auth-subtitle" class="auth-subtitle">Access your CRM workspace securely.</p>
      <form id="auth-form" class="auth-form">
        <label>Email<input id="auth-email" type="email" autocomplete="email" required placeholder="you@company.com"></label>
        <label>Password<input id="auth-password" type="password" autocomplete="current-password" minlength="6" required placeholder="••••••••"></label>
        <button id="auth-submit" class="auth-submit" type="submit">Sign in</button>
        <button id="auth-switch" class="auth-switch" type="button">Create a new account</button>
        <div id="auth-message" class="auth-message" role="status" aria-live="polite"></div>
      </form>
    </div>
  `;
  document.body.prepend(screen);

  // Keep the CRM UI hidden until authentication has been resolved.
  document.querySelector('.sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';

  let supabase;
  let signUpMode = false;

  function message(text, type) {
    const el = document.getElementById('auth-message');
    el.textContent = text || '';
    el.className = 'auth-message' + (type ? ' auth-' + type : '');
  }

  function setMode(register) {
    signUpMode = register;
    document.getElementById('auth-title').textContent = register ? 'Create account' : 'Sign in';
    document.getElementById('auth-subtitle').textContent = register
      ? 'Create your CRM account to start your workspace.'
      : 'Access your CRM workspace securely.';
    document.getElementById('auth-submit').textContent = register ? 'Create account' : 'Sign in';
    document.getElementById('auth-switch').textContent = register ? 'Already have an account? Sign in' : 'Create a new account';
    document.getElementById('auth-password').setAttribute('autocomplete', register ? 'new-password' : 'current-password');
    message('');
  }

  function showCRM(session) {
    screen.classList.add('auth-hidden');
    document.querySelector('.sidebar').style.visibility = '';
    document.querySelector('.main').style.visibility = '';

    let userBar = document.getElementById('auth-user-bar');
    if (!userBar) {
      userBar = document.createElement('div');
      userBar.id = 'auth-user-bar';
      userBar.className = 'auth-user';
      const topbar = document.querySelector('.topbar');
      const reset = document.getElementById('reset-demo');
      userBar.innerHTML = '<span class="auth-user-email"></span><button id="auth-logout" type="button">Sign out</button>';
      topbar.insertBefore(userBar, reset);
      document.getElementById('auth-logout').addEventListener('click', async function () {
        const { error } = await supabase.auth.signOut();
        if (error) message(error.message, 'error');
      });
    }
    userBar.querySelector('.auth-user-email').textContent = session.user.email || 'Signed-in user';
  }

  function showAuth() {
    screen.classList.remove('auth-hidden');
    document.querySelector('.sidebar').style.visibility = 'hidden';
    document.querySelector('.main').style.visibility = 'hidden';
    document.getElementById('auth-email').focus();
  }

  async function init() {
    if (!supabaseUrl || !supabaseKey) {
      message('Supabase configuration is missing.', 'error');
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      message('Supabase library could not be loaded. Please refresh the page.', 'error');
      return;
    }

    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    window.crmSupabase = supabase;

    const { data } = await supabase.auth.getSession();
    if (data.session) showCRM(data.session);
    else showAuth();

    supabase.auth.onAuthStateChange(function (event, session) {
      if (session) showCRM(session);
      else showAuth();
    });
  }

  document.getElementById('auth-switch').addEventListener('click', function () {
    setMode(!signUpMode);
  });

  document.getElementById('auth-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!supabase) return;

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const submit = document.getElementById('auth-submit');
    submit.disabled = true;
    message(signUpMode ? 'Creating your account…' : 'Signing you in…');

    try {
      if (signUpMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + window.location.pathname }
        });
        if (error) throw error;
        if (data.session) {
          message('Account created. Opening your CRM…', 'success');
        } else {
          message('Account created. Check your email to confirm your account, then sign in.', 'success');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      message(error.message || 'Authentication failed.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  init();
})();
