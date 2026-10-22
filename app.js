const starterMemories = [
  { id: 'm1', title: 'a completely unplanned sunset', owner: 'Bersama', date: '14 JUN 2025', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=85' },
  { id: 'm2', title: 'coffee, stories, and no rush', owner: 'Lisa', date: '02 JUN 2025', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=700&q=85' },
  { id: 'm3', title: 'a tiny weekend in the city', owner: 'Rani', date: '25 MAY 2025', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=85' },
  { id: 'm4', title: 'flowers for no reason', owner: 'Lisa', date: '18 MAY 2025', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=85' },
  { id: 'm5', title: 'our kind of sky', owner: 'Bersama', date: '11 MAY 2025', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85' },
  { id: 'm6', title: 'one little table, a million stories', owner: 'Rani', date: '04 MAY 2025', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=85' },
  { id: 'm7', title: 'all the colors of Sunday', owner: 'Lisa', date: '27 APR 2025', image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=700&q=85' },
  { id: 'm8', title: 'a little walk, absolutely nowhere', owner: 'Bersama', date: '19 APR 2025', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=85' }
];

const config = window.RUANGKITA_CONFIG || {};
const supabaseReady = Boolean(window.supabase && config.url && config.anonKey && !config.url.includes('YOUR_PROJECT'));
const db = supabaseReady ? window.supabase.createClient(config.url, config.anonKey) : null;
let memories = JSON.parse(localStorage.getItem('ruangkita_memories') || 'null') || starterMemories;
let filter = 'Semua';
let showAll = false;
let currentUser = null;
let memoryChannel = null;
let signupMode = false;
const grid = document.getElementById('galleryGrid');
const uploadDialog = document.getElementById('uploadDialog');
const authDialog = document.getElementById('authDialog');
const confirmDialog = document.getElementById('confirmDialog');
const memoryDialog = document.getElementById('memoryDialog');

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function setUser(user) {
  currentUser = user;
  const name = user ? (user.user_metadata?.display_name || user.email.split('@')[0]).replace(/^./, char => char.toUpperCase()) : 'Log in';
  document.getElementById('currentName').textContent = name;
  const avatar = document.querySelector('.tiny-avatar');
  avatar.textContent = user ? name[0].toUpperCase() : '♡';
  avatar.className = `tiny-avatar ${name.toLowerCase() === 'rani' ? 'rani' : 'lisa'}-avatar`;
  const ownerInput = document.getElementById('ownerInput');
  if (user) {
    ownerInput.replaceChildren(new Option(name, name));
    ownerInput.value = name;
  } else {
    ownerInput.replaceChildren(new Option('Lisa', 'Lisa'), new Option('Rani', 'Rani'));
  }
  document.getElementById('signoutBtn').style.display = user ? '' : 'none';
  document.getElementById('authModeBtn').style.display = user ? 'none' : '';
  document.querySelectorAll('[data-auth-field]').forEach(field => { field.hidden = Boolean(user); });
  document.getElementById('authNameWrap').hidden = Boolean(user) || !signupMode;
  document.getElementById('loginButton').hidden = Boolean(user);
  document.getElementById('authHeading').innerHTML = user ? 'You’re <em>in.</em>' : (signupMode ? 'Come on <em>in.</em>' : 'Hey, <em>bestie.</em>');
  document.getElementById('authCopy').textContent = user ? `Logged in as ${name}. Your shared corner is ready.` : (signupMode ? 'Make an account and start filling our little corner with memories.' : 'Log in to catch up on our little memories.');
  document.getElementById('authHint').textContent = user ? 'Your photos and memories are shared with your friends.' : (signupMode ? 'Pick the name your friends know you by. You may need to confirm your email.' : 'Your account gives you access to your shared gallery.');
}

function renderGallery() {
  renderFilters();
  const filtered = filter === 'Semua' ? memories : memories.filter(item => item.owner === filter);
  const visible = showAll ? filtered : filtered.slice(0, 8);
  grid.innerHTML = visible.length ? visible.map((item, index) => {
    const canDelete = item.uploaded && (!db || item.created_by === currentUser?.id);
    return `<article class="memory-card" data-memory-id="${escapeHtml(item.id)}" style="animation-delay:${index * 55}ms"><img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy"><span class="memory-owner">${escapeHtml(item.owner === 'Bersama' ? 'Together' : item.owner)}</span><div class="memory-meta"><p>${escapeHtml(item.title)}</p><span>${escapeHtml(item.date)}</span></div>${canDelete ? `<button class="memory-delete" title="Delete memory" aria-label="Delete memory" data-delete="${escapeHtml(item.id)}">×</button>` : ''}</article>`;
  }).join('') : '<div class="empty-state">No memories here yet. Add the first one? ✿</div>';
  document.getElementById('memoryCount').textContent = String(memories.length).padStart(2, '0');
  document.getElementById('allCount').textContent = String(memories.length).padStart(2, '0');
  document.getElementById('galleryCaption').textContent = filter === 'Semua' ? 'all our little moments, in one place' : `little moments from ${filter === 'Bersama' ? 'both of us' : filter}`;
  document.getElementById('moreBtn').style.display = filtered.length > 8 ? '' : 'none';
  document.getElementById('moreBtn').innerHTML = showAll ? 'Show a little less <span>↑</span>' : 'See all the memories <span>→</span>';
}

function renderFilters() {
  const ownerNames = [...new Set(memories.map(item => item.owner).filter(owner => owner !== 'Bersama'))].sort((a, b) => a.localeCompare(b));
  const options = [{ value: 'Semua', label: 'All' }, ...ownerNames.map(name => ({ value: name, label: name }))];
  if (memories.some(item => item.owner === 'Bersama')) options.push({ value: 'Bersama', label: 'Together' });
  if (!options.some(option => option.value === filter)) filter = 'Semua';
  document.getElementById('galleryFilters').innerHTML = options.map(option => `<button class="filter${option.value === filter ? ' active' : ''}" data-filter="${escapeHtml(option.value)}">${escapeHtml(option.label)}${option.value === 'Semua' ? ` <span id="allCount">${String(memories.length).padStart(2, '0')}</span>` : ''}</button>`).join('');
}

async function loadSharedMemories() {
  if (!db || !currentUser) return;
  const { data, error } = await db.from('memories').select('*').order('created_at', { ascending: false });
  if (error) { toast(`Couldn't load the shared gallery: ${error.message}`); return; }
  memories = await Promise.all(data.map(async row => {
    const { data: file } = await db.storage.from('memories').createSignedUrl(row.photo_path, 3600);
    return {
      id: row.id, title: row.title, owner: row.owner,
      date: new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(row.created_at)).toUpperCase(),
      image: file?.signedUrl || '', uploaded: true, photo_path: row.photo_path, created_by: row.created_by
    };
  }));
  renderGallery();
}

function subscribeToSharedMemories() {
  if (!db || !currentUser) return;
  if (memoryChannel) db.removeChannel(memoryChannel);
  memoryChannel = db.channel('shared-memories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => loadSharedMemories())
    .subscribe();
}

document.getElementById('galleryFilters').addEventListener('click', event => {
  const button = event.target.closest('.filter');
  if (!button) return;
  document.querySelector('.filter.active').classList.remove('active');
  button.classList.add('active');
  filter = button.dataset.filter;
  showAll = false;
  renderGallery();
});

document.getElementById('moreBtn').addEventListener('click', () => { showAll = !showAll; renderGallery(); });
document.getElementById('uploadBtn').addEventListener('click', () => {
  if (supabaseReady && !currentUser) { authDialog.showModal(); return; }
  document.getElementById('captionInput').value = '';
  document.getElementById('modalFile').value = '';
  document.getElementById('fileLabel').textContent = 'Choose a photo from your device';
  uploadDialog.showModal();
});

const modalFile = document.getElementById('modalFile');
modalFile.addEventListener('change', () => { document.getElementById('fileLabel').textContent = modalFile.files[0]?.name || 'Choose a photo from your device'; });

document.getElementById('uploadForm').addEventListener('submit', async event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const file = modalFile.files[0];
  if (!file) { toast('Pick a photo first ✿'); return; }
  if (!file.type.startsWith('image/')) { toast('That file doesn’t look like a photo.'); return; }
  const submit = event.currentTarget.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Saving your moment…';
  try {
    const blob = await resizeImage(file);
    const title = document.getElementById('captionInput').value.trim() || 'a little moment worth keeping';
    const owner = document.getElementById('ownerInput').value;
    const date = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase();
    if (db) {
      if (!currentUser) throw new Error('Log in first to add to our shared gallery.');
      const path = `${currentUser.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await db.storage.from('memories').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const { data: row, error } = await db.from('memories').insert({ title, owner, photo_path: path }).select().single();
      if (error) { await db.storage.from('memories').remove([path]); throw error; }
      memories.unshift({ id: row.id, title, owner, date, image: URL.createObjectURL(blob), uploaded: true, photo_path: path, created_by: currentUser.id });
    } else {
      const image = await blobToDataUrl(blob);
      memories.unshift({ id: `u${Date.now()}`, title, owner, date, image, uploaded: true });
      try { localStorage.setItem('ruangkita_memories', JSON.stringify(memories)); }
      catch { memories.shift(); throw new Error('Your browser storage is full. Delete a few photos and try again.'); }
    }
    filter = 'Semua'; showAll = false;
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === 'Semua'));
    uploadDialog.close(); renderGallery(); document.getElementById('galeri').scrollIntoView({ behavior: 'smooth' });
    toast(db ? 'Saved! It’s now in our shared corner ♡' : 'Saved in this browser ♡');
  } catch (error) { toast(error.message || 'That photo didn’t quite work. Try another?'); }
  finally { submit.disabled = false; submit.innerHTML = 'Add to our gallery <span>↗</span>'; }
});

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = reject;
    reader.onload = () => {
      const image = new Image(); image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Couldn’t process that photo.')), 'image/jpeg', .78);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
}

grid.addEventListener('click', async event => {
  const button = event.target.closest('[data-delete]');
  if (button) {
    event.stopPropagation();
    const memory = memories.find(item => item.id === button.dataset.delete);
    if (db && (!currentUser || memory.created_by !== currentUser.id)) { toast('You can only delete photos you posted.'); return; }
    document.getElementById('confirmCopy').textContent = `“${memory.title}” will be removed from your shared corner. You can’t undo this one.`;
    confirmDialog.showModal();
    const approved = await new Promise(resolve => confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue === 'confirm'), { once: true }));
    if (!approved) return;
    if (db) {
      const { error } = await db.from('memories').delete().eq('id', memory.id);
      if (error) { toast(error.message); return; }
      const { error: storageError } = await db.storage.from('memories').remove([memory.photo_path]);
      if (storageError) toast('Memory removed, but its photo could not be cleaned up.');
    } else {
      memories = memories.filter(item => item.id !== button.dataset.delete);
      localStorage.setItem('ruangkita_memories', JSON.stringify(memories));
    }
    renderGallery(); toast('Memory deleted.');
    return;
  }
  const card = event.target.closest('.memory-card');
  if (!card) return;
  const memory = memories.find(item => String(item.id) === card.dataset.memoryId);
  if (!memory) return;
  document.getElementById('lightboxImage').src = memory.image;
  document.getElementById('lightboxImage').alt = memory.title;
  document.getElementById('lightboxTitle').textContent = memory.title;
  document.getElementById('lightboxDate').textContent = `${memory.owner === 'Bersama' ? 'TOGETHER' : memory.owner.toUpperCase()} · ${memory.date}`;
  memoryDialog.showModal();
});

document.getElementById('profileBtn').addEventListener('click', () => {
  if (!supabaseReady) { toast('Add your Supabase project details in config.js to turn on shared accounts.'); return; }
  setAuthMode(false);
  authDialog.showModal();
});

function setAuthMode(signup) {
  const signedIn = Boolean(currentUser);
  signupMode = signup && !signedIn;
  document.querySelectorAll('[data-auth-field]').forEach(field => { field.hidden = signedIn; });
  document.getElementById('loginButton').hidden = signedIn;
  document.getElementById('authModeBtn').hidden = signedIn;
  document.getElementById('authNameWrap').hidden = signedIn || !signupMode;
  const name = currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || '';
  document.getElementById('authHeading').innerHTML = signedIn ? 'You’re <em>in.</em>' : (signupMode ? 'Come on <em>in.</em>' : 'Hey, <em>bestie.</em>');
  document.getElementById('authCopy').textContent = signedIn ? `Logged in as ${name}. Your shared corner is ready.` : (signupMode ? 'Make an account and start filling our little corner with memories.' : 'Log in to catch up on our little memories.');
  document.getElementById('loginButton').innerHTML = signup ? 'Create my account <span>↗</span>' : 'Log in to our corner <span>↗</span>';
  document.getElementById('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
  document.getElementById('authModeBtn').textContent = signupMode ? 'Already have an account? Log in' : 'New here? Create an account';
  document.getElementById('authHint').textContent = signedIn ? 'Your photos and memories are shared with your friends.' : (signupMode ? 'Pick the name your friends know you by. You may need to confirm your email.' : 'Your account gives you access to your shared gallery.');
}
document.getElementById('authModeBtn').addEventListener('click', () => setAuthMode(!signupMode));

document.getElementById('authForm').addEventListener('submit', async event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  if (!db) { toast('Add your Supabase project details in config.js first.'); return; }
  const button = document.getElementById('loginButton');
  button.disabled = true; button.textContent = signupMode ? 'Creating your account…' : 'Checking your login…';
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const displayName = document.getElementById('authName').value.trim().slice(0, 32);
  if (signupMode && !displayName) { button.disabled = false; setAuthMode(true); toast('Add the name you want your friends to see.'); return; }
  const result = signupMode
    ? await db.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
    : await db.auth.signInWithPassword({ email, password });
  const { data, error } = result;
  button.disabled = false; button.innerHTML = signupMode ? 'Create my account <span>↗</span>' : 'Log in to our corner <span>↗</span>';
  if (error) { toast(error.message === 'Invalid login credentials' ? 'Hmm, that email or password doesn’t look right.' : error.message); return; }
  if (signupMode && !data.session) {
    authDialog.close();
    toast('Account created! Check your inbox to confirm your email, then log in ♡');
    return;
  }
  setUser(data.user); await loadSharedMemories(); subscribeToSharedMemories(); authDialog.close(); toast('You’re home, bestie ♡');
});

document.getElementById('signoutBtn').addEventListener('click', async () => {
  if (!db) return;
  if (memoryChannel) { await db.removeChannel(memoryChannel); memoryChannel = null; }
  await db.auth.signOut(); signupMode = false; setUser(null); memories = starterMemories; renderGallery(); authDialog.close(); toast('See you soon ♡');
});

document.getElementById('themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('ruangkita_dark', dark);
  document.getElementById('themeBtn').setAttribute('aria-pressed', String(dark));
});
if (localStorage.getItem('ruangkita_dark') === 'true') {
  document.body.classList.add('dark');
  document.getElementById('themeBtn').setAttribute('aria-pressed', 'true');
}

document.querySelectorAll('.top-nav .nav-link').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.top-nav .nav-link.active')?.classList.remove('active');
  link.classList.add('active');
}));

[uploadDialog, authDialog, confirmDialog, memoryDialog].forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal) modal.close('cancel');
}));

document.getElementById('shareBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Link copied! Send it to your bestie ♡'); }
  catch { toast('Copy the link from your address bar and send it to your bestie ♡'); }
});

if (!supabaseReady) {
  document.getElementById('storageHint').textContent = 'Demo mode: photos stay in this browser. Add your Supabase project details to share them across devices.';
} else {
  db.auth.getSession().then(async ({ data }) => {
    if (data.session) { setUser(data.session.user); await loadSharedMemories(); subscribeToSharedMemories(); }
  });
  db.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT') { signupMode = false; setUser(null); } });
}

renderGallery();
