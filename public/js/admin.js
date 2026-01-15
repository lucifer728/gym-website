/* ==================  ADMIN.JS  ================== */
const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

/* ---------- TAB SWITCHING ---------- */
const sidebarLinks = document.querySelectorAll('.nav-link');
const tabs = document.querySelectorAll('.tab');
sidebarLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    tabs.forEach(t => t.classList.remove('active'));
    const tabId = link.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    if (tabId === 'members')  loadMembers();
    if (tabId === 'posts')    loadPosts();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'profile')  loadProfile();
  });
});

/* ---------- LOGOUT ---------- */
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  location.href = 'login.html';
});

/* ---------- MEMBERS ---------- */
async function loadMembers() {
  const res = await fetch('/api/admin/members', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const tbody = document.querySelector('#membersTable tbody');
  tbody.innerHTML = '';
  data.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${m.profilePicture || '/assets/avatar.png'}" width="40" height="40" style="border-radius:50%"></td>
      <td>${m.fullName}</td>
      <td>${m.phone}</td>
      <td>${new Date(m.joiningDate).toLocaleDateString()}</td>
      <td>${m.subscriptionPlan}</td>
      <td>₹${m.amount||0}</td>
      <td>${m.remainingDays}</td>
      <td>
        <button onclick="deleteMember('${m._id}')">Delete</button>
        <button onclick="editSubscription('${m._id}')">Extend</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
window.deleteMember = async id => {
  if (!confirm('Delete member?')) return;
  await fetch(`/api/admin/members/${id}`, {
    method : 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  loadMembers();
};
window.editSubscription = async id => {
  const days = prompt('Extend subscription by (days):', 30);
  if (!days) return;
  const expiry = new Date(); expiry.setDate(expiry.getDate() + parseInt(days));
  await fetch(`/api/admin/members/${id}/subscription`, {
    method : 'PUT',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body   : JSON.stringify({ expiryDate: expiry, subscriptionPlan:'Custom' })
  });
  loadMembers();
};

/* ---------- POSTS ---------- */
async function loadPosts() {
  const res = await fetch('/api/posts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const posts = await res.json();
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt=""/>` : ''}
      <div class="body">
        <p>${p.textContent}</p>
        <small>By ${p.adminId.username} – ${new Date(p.createdAt).toLocaleString()}</small>
        <button onclick="deletePost('${p._id}')">Delete</button>
      </div>`;
    container.appendChild(div);
  });
}
window.deletePost = async id => {
  if (!confirm('Delete post?')) return;
  await fetch(`/api/posts/${id}`, {
    method : 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  loadPosts();
};

/* ---------- PAYMENTS ---------- */
async function loadPayments() {
  const res = await fetch('/api/payments', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const tbody = document.querySelector('#paymentsTable tbody');
  tbody.innerHTML = '';
  data.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.memberId.fullName}</td>
      <td>₹${p.amount}</td>
      <td>${new Date(p.date).toLocaleDateString()}</td>
      <td>${p.remarks}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- MODALS ---------- */
const memberModal = document.getElementById('memberModal');
const postModal   = document.getElementById('postModal');

document.getElementById('addMemberBtn').onclick = () => memberModal.classList.add('active');
document.getElementById('addPostBtn').onclick   = () => postModal.classList.add('active');
document.querySelectorAll('.close').forEach(btn => {
  btn.onclick = () => btn.closest('.modal').classList.remove('active');
});

document.getElementById('memberModalForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res  = await fetch('/api/admin/members', {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body   : form
  });
  const data = await res.json();
  alert(data.msg);
  if (res.ok) { memberModal.classList.remove('active'); loadMembers(); }
});

document.getElementById('postModalForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res  = await fetch('/api/posts', {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body   : form
  });
  const data = await res.json();
  alert(data.msg);
  if (res.ok) { postModal.classList.remove('active'); loadPosts(); }
});

/* ---------- BOOTSTRAP ---------- */
loadMembers();