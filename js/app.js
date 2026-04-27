// ===== AUTH CHECK =====
if (sessionStorage.getItem('auth') !== 'admin') location.href = 'login.html';

// ===== ROUTER =====
const pages = { dashboard, students, classes, tuition, receipts, discounts, history };
const pageTitles = { dashboard:'Dashboard', students:'Qu\u1ea3n L\u00fd H\u1ecdc Vi\u00ean', classes:'Qu\u1ea3n L\u00fd L\u1edbp H\u1ecdc', tuition:'Qu\u1ea3n L\u00fd H\u1ecdc Ph\u00ed', receipts:'Bi\u00ean Lai \u0110\u0103ng K\u00fd', discounts:'M\u00e3 Gi\u1ea3m Gi\u00e1', history:'L\u1ecbch S\u1eed H\u1ecdc T\u1eadp' };

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('headerTitle').textContent = pageTitles[page] || page;
  document.getElementById('mainContent').innerHTML = '';
  pages[page]();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
});

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.querySelector('.main-wrapper').classList.toggle('expanded');
});

// Site name
document.getElementById('siteName').innerHTML = 'Duy Ho\u00e0ng <b>D\u1ea1y To\u00e1n</b>';
document.getElementById('footerName').innerHTML = '\u00a9 2026 <b>Duy Ho\u00e0ng D\u1ea1y To\u00e1n</b> \u2013 Qu\u1ea3n l\u00fd d\u1ec5 d\u00e0ng \u2013 V\u1eadn h\u00e0nh chuy\u00ean nghi\u1ec7p';
document.title = 'Duy Ho\u00e0ng D\u1ea1y To\u00e1n';
function updateClock() {
  const now = new Date();
  document.getElementById('headerDate').textContent = now.toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '  ' + now.toLocaleTimeString('vi-VN');
}
updateClock();
setInterval(updateClock, 1000);

// ===== MODAL HELPERS =====
function openModal(title, bodyHTML, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modalConfirm').onclick = () => { if(onConfirm()) closeModal(); };
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalClose').onclick = closeModal;
document.getElementById('modalCancel').onclick = closeModal;
document.getElementById('modalOverlay').addEventListener('click', e => { if(e.target === document.getElementById('modalOverlay')) closeModal(); });

// ===== TOAST =====
function toast(msg, type='success') {
  saveDB(); // lưu mỗi khi có thay đổi
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:28px;right:28px;background:${type==='success'?'#10b981':type==='error'?'#ef4444':'#f59e0b'};color:#fff;padding:12px 22px;border-radius:10px;font-size:.9rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:fadeIn .3s`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ===== CONFIRM DELETE =====
function confirmDelete(msg, onYes) {
  openModal('Xác nhận xóa', `<p style="color:#ef4444;font-size:1rem;"><i class="fas fa-exclamation-triangle"></i> ${msg}</p>`, () => { onYes(); return true; });
  document.getElementById('modalConfirm').textContent = 'Xóa';
  document.getElementById('modalConfirm').className = 'btn btn-danger';
}

// ===== PAGE: DASHBOARD =====
function dashboard() {
  const c = document.getElementById('mainContent');
  const totalStudents = DB.students.length;
  const totalClasses = DB.classes.length;

  // Thời gian thực
  const now = new Date(); now.setHours(0,0,0,0);
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed
  const curMonthStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}`;
  const curMonthLabel = `tháng ${curMonth+1}/${curYear}`;

  // Doanh thu tháng hiện tại
  const monthRevenue = DB.receipts.filter(r => r.date && r.date.startsWith(curMonthStr)).reduce((a,r) => a+r.amount, 0);

  // Thông báo khóa học
  const notify = DB.classes.map(cl => {
    if (!cl.endDate) return null;
    const end = new Date(cl.endDate); end.setHours(0,0,0,0);
    const days = Math.round((end - now) / (1000*60*60*24));
    if (days < 0) return { cl, days, type: 'ended' };
    if (days <= 30) return { cl, days, type: 'soon' };
    return null;
  }).filter(Boolean);

  // Doanh thu 6 tháng gần nhất từ dữ liệu thực
  const revenueLabels = [];
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    revenueLabels.push(`T${d.getMonth()+1}/${d.getFullYear()}`);
    revenueData.push(DB.receipts.filter(r => r.date && r.date.startsWith(key)).reduce((a,r) => a+r.amount, 0));
  }

  c.innerHTML = `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon"><i class="fas fa-user-graduate"></i></div><div class="stat-info"><div class="stat-value">${totalStudents}</div><div class="stat-label">Tổng học viên</div></div></div>
    <div class="stat-card green"><div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div><div class="stat-info"><div class="stat-value">${totalClasses}</div><div class="stat-label">Tổng lớp học</div></div></div>
    <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-value">${formatCurrency(monthRevenue)}</div><div class="stat-label">Doanh thu ${curMonthLabel}</div></div></div>
  </div>
  ${notify.length ? `
  <div class="card" style="border-left:4px solid #f59e0b;margin-bottom:24px">
    <div class="card-header" style="padding-bottom:12px;margin-bottom:12px">
      <div class="card-title"><i class="fas fa-bell" style="color:#f59e0b"></i> Thông báo khóa học</div>
      <span class="badge badge-warning">${notify.length} thông báo</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${notify.map(n => `
        <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:10px;background:${n.type==='ended'?'rgba(239,68,68,0.06)':'rgba(245,158,11,0.06)'}">
          <div style="width:40px;height:40px;border-radius:10px;background:${n.type==='ended'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:${n.type==='ended'?'#ef4444':'#f59e0b'}">
            <i class="fas fa-${n.type==='ended'?'times-circle':'clock'}"></i>
          </div>
          <div style="flex:1">
            <div style="font-weight:700;color:#1e293b">${n.cl.name}</div>
            <div style="font-size:.82rem;color:#64748b;margin-top:2px">
              ${n.cl.subject ? n.cl.subject + ' · ' : ''}Kết thúc: ${formatDate(n.cl.endDate)}
            </div>
          </div>
          <span style="font-size:.82rem;font-weight:700;padding:5px 12px;border-radius:20px;background:${n.type==='ended'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)'};color:${n.type==='ended'?'#ef4444':'#f59e0b'}">
            ${n.type==='ended' ? 'Đã kết thúc' : `Còn ${n.days} ngày`}
          </span>
        </div>`).join('')}
    </div>
  </div>` : ''}
  <div class="charts-grid">
    <div class="chart-card"><h3><i class="fas fa-chart-bar"></i> Học viên theo lớp</h3><canvas id="chartClass" height="200"></canvas></div>
    <div class="chart-card"><h3><i class="fas fa-chart-line"></i> Doanh thu 6 tháng gần nhất</h3><canvas id="chartRevenue" height="200"></canvas></div>
  </div>`;

  // Charts
  new Chart(document.getElementById('chartClass'), {
    type: 'bar',
    data: {
      labels: DB.classes.map(c=>c.name),
      datasets: [{ label: 'Số học viên', data: DB.classes.map(c=>getStudentsByClass(c.id).length), backgroundColor: ['#4f46e5','#7c3aed','#3b82f6'], borderRadius: 8 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
  new Chart(document.getElementById('chartRevenue'), {
    type: 'line',
    data: {
      labels: revenueLabels,
      datasets: [{ label: 'Doanh thu (đ)', data: revenueData, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#4f46e5' }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// ===== PAGE: STUDENTS =====
function students() {
  const c = document.getElementById('mainContent');
  let filter = '';

  function render() {
    let list = DB.students.filter(s =>
      (!filter || s.name.toLowerCase().includes(filter) || s.id.toLowerCase().includes(filter) || s.phone.includes(filter))
    );
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-user-graduate"></i> Danh Sách Học Viên</div>
        <button class="btn btn-primary" id="btnAddStudent"><i class="fas fa-plus"></i> Thêm học viên</button>
      </div>
      <div class="toolbar">
        <div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Tìm theo tên, mã, SĐT..." id="searchStudent" value="${filter}"/></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã HV</th><th>Họ và tên</th><th>SĐT</th><th>Gmail</th><th>Lớp</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${list.map(s=>`<tr>
            <td><b>${s.id}</b></td><td>${s.name}</td><td>${s.phone}</td><td>${s.email||'—'}</td>
            <td>${getClassById(s.centerClass)?.name||'—'}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="viewStudent('${s.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-warning btn-sm" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddStudent').onclick = () => addStudentModal();
    document.getElementById('searchStudent').oninput = e => { filter = e.target.value.toLowerCase(); render(); };
  }
  render();

  window.viewStudent = (id) => {
    const s = DB.students.find(x=>x.id===id);
    openModal('Chi tiết học viên – ' + s.name, `
      <div class="form-grid">
        ${[['Mã học viên',s.id],['Họ và tên',s.name],['SĐT',s.phone],['Gmail',s.email||'—'],['Lớp TT',getClassById(s.centerClass)?.name||'—'],['Ngày bắt đầu khóa',formatDate(getClassById(s.centerClass)?.startDate)],['Ngày kết thúc khóa',formatDate(getClassById(s.centerClass)?.endDate)],['Học phí',formatCurrency(getClassById(s.centerClass)?.fee||0)],['Ghi chú',s.note||'—']].map(([l,v])=>`<div class="form-group"><label>${l}</label><input readonly value="${v}"/></div>`).join('')}
      </div>`, () => true);
    document.getElementById('modalConfirm').style.display='none';
  };

  window.editStudent = (id) => {
    const s = DB.students.find(x=>x.id===id);
    openModal('Sửa thông tin học viên', studentForm(s), () => {
      const f = collectStudentForm();
      if (!f) return false;
      Object.assign(s, f);
      toast('Đã cập nhật học viên!');
      render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'Lưu';
    document.getElementById('modalConfirm').className = 'btn btn-primary';
  };

  window.deleteStudent = (id) => {
    confirmDelete('Bạn có chắc muốn xóa học viên này?', () => {
      const i = DB.students.findIndex(x=>x.id===id);
      DB.students.splice(i,1); toast('Đã xóa học viên!','warning'); render();
    });
  };

  function addStudentModal() {
    openModal('Thêm học viên mới', studentForm(), () => {
      const f = collectStudentForm();
      if (!f) return false;
      f.id = genStudentId(f.name, f.centerClass);
      DB.students.push(f);
      toast('Đã thêm học viên!'); render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'Thêm';
    document.getElementById('modalConfirm').className = 'btn btn-primary';
  }

  function studentForm(s={}) {
    if (DB.classes.length === 0) {
      return `<div style="padding:20px;text-align:center;color:#ef4444"><i class="fas fa-exclamation-triangle"></i> Chưa có lớp học nào. Vui lòng tạo lớp trước!</div>`;
    }
    return `<div class="form-grid">
      <div class="form-group"><label>Họ và tên *</label><input id="f_name" value="${s.name||''}"/></div>
      <div class="form-group"><label>Số điện thoại</label><input id="f_phone" value="${s.phone||''}"/></div>
      <div class="form-group"><label>Gmail</label><input type="email" id="f_email" value="${s.email||''}"/></div>
      <div class="form-group"><label>Lớp học</label><select id="f_centerClass">${DB.classes.map(cl=>`<option value="${cl.id}" ${s.centerClass===cl.id?'selected':''}>${cl.name}</option>`).join('')}</select></div>
      <div class="form-group" style="grid-column:1/-1"><label>Ghi chú</label><textarea id="f_note">${s.note||''}</textarea></div>
    </div>`;
  }

  function collectStudentForm() {
    if (DB.classes.length === 0) return null;
    const name = document.getElementById('f_name').value.trim();
    if (!name) { toast('Vui lòng nhập họ tên!','error'); return null; }
    const centerClass = document.getElementById('f_centerClass')?.value || '';
    if (!centerClass) { toast('Vui lòng chọn lớp học!','error'); return null; }
    return {
      name,
      phone: document.getElementById('f_phone').value,
      email: document.getElementById('f_email').value,
      centerClass,
      note: document.getElementById('f_note').value
    };
  }
}

// ===== PAGE: CLASSES =====
function classes() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-chalkboard-teacher"></i> Danh Sách Lớp Học</div>
        <button class="btn btn-primary" id="btnAddClass"><i class="fas fa-plus"></i> Tạo lớp mới</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã lớp</th><th>Tên lớp</th><th>Bắt đầu</th><th>Kết thúc</th><th>Học phí</th><th>Thao tác</th></tr></thead>
          <tbody>
          ${DB.classes.map(cl=>`<tr>
            <td><b>${cl.id}</b></td><td>${cl.name}</td>
            <td>${formatDate(cl.startDate)}</td><td>${formatDate(cl.endDate)}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(cl.fee||0)}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="viewClassStudents('${cl.id}')"><i class="fas fa-users"></i></button>
              <button class="btn btn-warning btn-sm" onclick="editClass('${cl.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteClass('${cl.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddClass').onclick = () => addClassModal();
  }
  render();

  window.viewClassStudents = (id) => {
    const cl = getClassById(id);
    const list = getStudentsByClass(id);
    openModal(`Danh sách học viên – ${cl.name}`, `
      <div style="margin-bottom:12px;display:flex;gap:10px;align-items:center">
        <span class="badge badge-primary">${list.length} học viên</span>
        <button class="btn btn-warning btn-sm" onclick="transferStudentModal('${id}')"><i class="fas fa-exchange-alt"></i> Chuyển lớp</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Mã HV</th><th>Họ tên</th><th>SĐT</th><th>Tình trạng</th></tr></thead>
        <tbody>${list.map(s=>`<tr><td>${s.id}</td><td>${s.name}</td><td>${s.phone}</td><td><span class="badge ${s.status==='Đang học'?'badge-success':'badge-danger'}">${s.status}</span></td></tr>`).join('')}</tbody>
      </table></div>`, () => true);
    document.getElementById('modalConfirm').style.display='none';
  };

  window.transferStudentModal = (fromClassId) => {
    const list = getStudentsByClass(fromClassId);
    openModal('Chuyển học viên sang lớp khác', `
      <div class="form-grid">
        <div class="form-group"><label>Chọn học viên</label><select id="t_student">${list.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Chuyển sang lớp</label><select id="t_class">${DB.classes.filter(cl=>cl.id!==fromClassId).map(cl=>`<option value="${cl.id}">${cl.name}</option>`).join('')}</select></div>
      </div>`, () => {
      const sid = document.getElementById('t_student').value;
      const cid = document.getElementById('t_class').value;
      const s = DB.students.find(x=>x.id===sid);
      s.centerClass = cid;
      toast(`Đã chuyển ${s.name} sang ${getClassById(cid).name}`);
      render(); return true;
    });
  };

  window.editClass = (id) => {
    const cl = DB.classes.find(x=>x.id===id);
    openModal('Chỉnh sửa lớp học', classForm(cl), () => {
      const f = collectClassForm();
      if (!f) return false;
      Object.assign(cl, f);
      toast('Đã cập nhật lớp học!'); render(); return true;
    });
  };

  window.deleteClass = (id) => {
    confirmDelete('Bạn có chắc muốn xóa lớp học này?', () => {
      const i = DB.classes.findIndex(x=>x.id===id);
      DB.classes.splice(i,1); toast('Đã xóa lớp!','warning'); render();
    });
  };

  function addClassModal() {
    openModal('Tạo lớp học mới', classForm(), () => {
      const f = collectClassForm();
      if (!f) return false;
      f.id = genClassId(f.name);
      DB.classes.push(f);
      toast('Đã tạo lớp mới!'); render(); return true;
    });
  }

  function classForm(cl={}) {
    return `<div class="form-grid">
      <div class="form-group"><label>Tên lớp *</label><input id="c_name" value="${cl.name||''}"/></div>
      <div class="form-group"><label>Ngày bắt đầu khóa</label><input type="date" id="c_startDate" value="${cl.startDate||''}"/></div>
      <div class="form-group"><label>Ngày kết thúc khóa</label><input type="date" id="c_endDate" value="${cl.endDate||''}"/></div>
      <div class="form-group"><label>Học phí (VNĐ)</label><input type="number" id="c_fee" value="${cl.fee||''}"/></div>
    </div>`;
  }

  function collectClassForm() {
    const name = document.getElementById('c_name').value.trim();
    if (!name) { toast('Vui lòng nhập tên lớp!','error'); return null; }
    return { name, startDate: document.getElementById('c_startDate').value, endDate: document.getElementById('c_endDate').value, fee: Number(document.getElementById('c_fee').value)||0 };
  }
}

// ===== PAGE: TUITION =====
function tuition() {
  const c = document.getElementById('mainContent');

  function render() {
    const total = DB.students.reduce((a,s) => a + (getClassById(s.centerClass)?.fee||0), 0);

    c.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-value">${DB.students.length}</div><div class="stat-label">Tổng học viên</div></div></div>
      <div class="stat-card green"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-value">${formatCurrency(total)}</div><div class="stat-label">Tổng học phí thu được</div></div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-money-bill-wave"></i> Danh Sách Học Phí</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mã HV</th><th>Họ tên</th><th>Lớp</th><th>Thời hạn khóa học</th><th>Học phí</th></tr></thead>
          <tbody>
          ${DB.students.map(s=>{const cl=getClassById(s.centerClass); return `<tr>
            <td><b>${s.id}</b></td><td>${s.name}</td>
            <td>${cl?.name||s.centerClass}</td>
            <td style="font-size:.82rem">${cl?.startDate?formatDate(cl.startDate)+' \u2192 '+formatDate(cl.endDate):'—'}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(cl?.fee||0)}</td>
          </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }
  render();
}

// ===== PAGE: RECEIPTS =====
function receipts() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-receipt"></i> Biên Lai Đăng Ký</div>
        <button class="btn btn-primary" id="btnAddReceipt"><i class="fas fa-plus"></i> Tạo biên lai</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>M\u00e3 BL</th><th>Ng\u00e0y t\u1ea1o</th><th>H\u1ecdc vi\u00ean</th><th>M\u00e3 HV</th><th>L\u1edbp \u0111\u0103ng k\u00fd</th><th>M\u00e3 gi\u1ea3m</th><th>H\u1ecdc ph\u00ed</th><th>Ghi ch\u00fa</th><th>Thao t\u00e1c</th></tr></thead>
          <tbody>
          ${DB.receipts.map(r=>`<tr>
            <td><b>${r.id}</b></td>
            <td>${formatDate(r.date)}</td>
            <td>${r.studentName}</td>
            <td>${r.studentId}</td>
            <td>${getClassById(r.classId)?.name||r.classId}</td>
            <td>${r.discountCode?`<span class="badge badge-primary">${r.discountCode}</span>`:'—'}</td>
            <td style="color:#10b981;font-weight:700">${formatCurrency(r.amount)}</td>
            <td>${r.note||'—'}</td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="previewReceipt('${r.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteReceipt('${r.id}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddReceipt').onclick = () => addReceiptModal();
  }
  render();

  window.previewReceipt = (id) => {
    const r = DB.receipts.find(x=>x.id===id);
    const cl = getClassById(r.classId);
    openModal('Biên Lai Đăng Ký', `
      <div class="receipt-preview">
        <div class="receipt-title">DUY HOÀNG DẠY TOÁN</div>
        <div class="receipt-sub">Quản lý dễ dàng – Vận hành chuyên nghiệp</div>
        ${[
          ['Mã biên lai', r.id],
          ['Ngày tạo', formatDate(r.date)],
          ['Tên học viên', r.studentName],
          ['Mã học viên', r.studentId],
          ['Lớp đăng ký', cl?.name||r.classId],
          ['Thời hạn', cl?.startDate ? formatDate(cl.startDate)+' → '+formatDate(cl.endDate) : '—'],
          ['Ghi chú', r.note||'—']
        ].map(([l,v])=>`<div class="receipt-row"><span>${l}:</span><b>${v}</b></div>`).join('')}
        <div class="receipt-total">Học phí: ${formatCurrency(r.amount)}</div>
      </div>`, () => { window.print(); return true; });
    document.getElementById('modalConfirm').innerHTML = '<i class="fas fa-print"></i> In biên lai';
  };

  window.deleteReceipt = (id) => {
    confirmDelete('Xóa biên lai này?', () => {
      DB.receipts.splice(DB.receipts.findIndex(x=>x.id===id), 1);
      toast('Đã xóa biên lai!', 'warning'); render();
    });
  };

  function addReceiptModal() {
    const firstFee = DB.classes[0]?.fee || 0;
    openModal('T\u1ea1o bi\u00ean lai \u0111\u0103ng k\u00fd', `
      <div class="form-grid">
        <div class="form-group"><label>H\u1ecdc vi\u00ean *</label><select id="r_student">${DB.students.map(s=>`<option value="${s.id}">${s.name} (${s.id})</option>`).join('')}</select></div>
        <div class="form-group"><label>L\u1edbp \u0111\u0103ng k\u00fd *</label><select id="r_class" onchange="updateReceiptFee()">${DB.classes.map(cl=>`<option value="${cl.id}" data-fee="${cl.fee||0}">${cl.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Ng\u00e0y t\u1ea1o</label><input type="date" id="r_date" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label>H\u1ecdc ph\u00ed g\u1ed1c</label><input type="number" id="r_fee_original" value="${firstFee}" readonly style="background:#f1f5f9;color:#64748b"/></div>
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1</label><input id="r_discount_code" placeholder="Nh\u1eadp m\u00e3..." oninput="updateReceiptFee()" style="text-transform:uppercase"/></div>
        <div class="form-group"><label>H\u1ecdc ph\u00ed sau gi\u1ea3m</label><input type="number" id="r_amount" value="${firstFee}" readonly style="background:#f1f5f9;color:#10b981;font-weight:700"/></div>
        <div class="form-group" style="grid-column:1/-1"><label>Ghi ch\u00fa</label><input id="r_note"/></div>
      </div>`, () => {
      const sid = document.getElementById('r_student').value;
      const cid = document.getElementById('r_class').value;
      const amt = Number(document.getElementById('r_amount').value)||0;
      const dcode = document.getElementById('r_discount_code').value.trim().toUpperCase();
      if (!sid) { toast('Ch\u1ecdn h\u1ecdc vi\u00ean!','error'); return false; }
      // Đánh dấu mã đã dùng
      if (dcode) {
        const disc = DB.discounts.find(x=>x.code===dcode && x.active);
        if (disc) { disc.usedCount = (disc.usedCount||0)+1; if (disc.maxUse>0 && disc.usedCount>=disc.maxUse) disc.active=false; }
      }
      const s = DB.students.find(x=>x.id===sid);
      DB.receipts.push({ id: genId('BL',DB.receipts), date: document.getElementById('r_date').value, studentName: s.name, studentId: sid, classId: cid, amount: amt, discountCode: dcode||null, note: document.getElementById('r_note').value });
      toast('T\u1ea1o bi\u00ean lai th\u00e0nh c\u00f4ng!'); render(); return true;
    });
  }

  window.updateReceiptFee = () => {
    const sel = document.getElementById('r_class');
    const fee = Number(sel.options[sel.selectedIndex]?.dataset.fee||0);
    document.getElementById('r_fee_original').value = fee;
    const code = (document.getElementById('r_discount_code')?.value||'').trim().toUpperCase();
    const disc = DB.discounts.find(x=>x.code===code && x.active);
    let final = fee;
    if (disc) { final = disc.type==='percent' ? Math.round(fee*(1-disc.value/100)) : Math.max(0, fee-disc.value); }
    document.getElementById('r_amount').value = final;
  };
}

// ===== PAGE: DISCOUNTS =====
function discounts() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-tags" style="color:var(--primary)"></i> Qu\u1ea3n L\u00fd M\u00e3 Gi\u1ea3m Gi\u00e1</div>
        <button class="btn btn-primary" id="btnAddDiscount"><i class="fas fa-plus"></i> T\u1ea1o m\u00e3 m\u1edbi</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>M\u00e3</th><th>Lo\u1ea1i gi\u1ea3m</th><th>Gi\u00e1 tr\u1ecb</th><th>S\u1ed1 l\u1ea7n d\u00f9ng</th><th>\u0110\u00e3 d\u00f9ng</th><th>Tr\u1ea1ng th\u00e1i</th><th>Thao t\u00e1c</th></tr></thead>
          <tbody>
          ${DB.discounts.map(d=>`<tr>
            <td><b style="color:var(--primary);font-size:1rem;letter-spacing:1px">${d.code}</b></td>
            <td>${d.type==='percent'?'Ph\u1ea7n tr\u0103m':'S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh'}</td>
            <td style="color:#10b981;font-weight:700">${d.type==='percent'?d.value+'%':formatCurrency(d.value)}</td>
            <td>${d.maxUse===0?'Kh\u00f4ng gi\u1edbi h\u1ea1n':d.maxUse}</td>
            <td>${d.usedCount||0}</td>
            <td><span class="badge ${d.active?'badge-success':'badge-danger'}">${d.active?'\u0110ang ho\u1ea1t \u0111\u1ed9ng':'V\u00f4 hi\u1ec7u'}</span></td>
            <td><div class="action-btns">
              <button class="btn btn-info btn-sm" onclick="editDiscount('${d.code}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-warning btn-sm" onclick="toggleDiscount('${d.code}')"><i class="fas fa-power-off"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteDiscount('${d.code}')"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddDiscount').onclick = () => addDiscountModal();
  }
  render();

  window.editDiscount = (code) => {
    const d = DB.discounts.find(x=>x.code===code);
    openModal('Ch\u1ec9nh s\u1eeda m\u00e3 gi\u1ea3m gi\u00e1', `
      <div class="form-grid">
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1</label><input id="d_code" value="${d.code}" style="text-transform:uppercase"/></div>
        <div class="form-group"><label>Lo\u1ea1i gi\u1ea3m</label>
          <select id="d_type">
            <option value="percent" ${d.type==='percent'?'selected':''}>Ph\u1ea7n tr\u0103m (%)</option>
            <option value="fixed" ${d.type==='fixed'?'selected':''}>S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh (VN\u0110)</option>
          </select>
        </div>
        <div class="form-group"><label>Gi\u00e1 tr\u1ecb</label><input type="number" id="d_value" value="${d.value}"/></div>
        <div class="form-group"><label>S\u1ed1 l\u1ea7n d\u00f9ng (0 = kh\u00f4ng gi\u1edbi h\u1ea1n)</label><input type="number" id="d_maxUse" value="${d.maxUse}"/></div>
      </div>`, () => {
      const newCode = document.getElementById('d_code').value.trim().toUpperCase();
      const value = Number(document.getElementById('d_value').value);
      if (!newCode) { toast('Nh\u1eadp m\u00e3!','error'); return false; }
      if (!value || value <= 0) { toast('Nh\u1eadp gi\u00e1 tr\u1ecb h\u1ee3p l\u1ec7!','error'); return false; }
      d.code = newCode;
      d.type = document.getElementById('d_type').value;
      d.value = value;
      d.maxUse = Number(document.getElementById('d_maxUse').value)||0;
      toast('C\u1eadp nh\u1eadt th\u00e0nh c\u00f4ng!'); render(); return true;
    });
    document.getElementById('modalConfirm').textContent = 'L\u01b0u';
  };

  window.toggleDiscount = (code) => {
    const d = DB.discounts.find(x=>x.code===code);
    d.active = !d.active;
    toast(d.active ? 'M\u00e3 \u0111\u00e3 k\u00edch ho\u1ea1t!' : 'M\u00e3 \u0111\u00e3 v\u00f4 hi\u1ec7u h\u00f3a!', 'warning');
    render();
  };

  window.deleteDiscount = (code) => {
    confirmDelete('X\u00f3a m\u00e3 gi\u1ea3m gi\u00e1 n\u00e0y?', () => {
      DB.discounts.splice(DB.discounts.findIndex(x=>x.code===code), 1);
      toast('X\u00f3a th\u00e0nh c\u00f4ng!', 'warning'); render();
    });
  };

  function addDiscountModal() {
    openModal('T\u1ea1o m\u00e3 gi\u1ea3m gi\u00e1', `
      <div class="form-grid">
        <div class="form-group"><label>M\u00e3 gi\u1ea3m gi\u00e1 *</label><input id="d_code" placeholder="VD: GIAM50, KHAI_GIANG..." style="text-transform:uppercase"/></div>
        <div class="form-group"><label>Lo\u1ea1i gi\u1ea3m</label>
          <select id="d_type">
            <option value="percent">Ph\u1ea7n tr\u0103m (%)</option>
            <option value="fixed">S\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh (VN\u0110)</option>
          </select>
        </div>
        <div class="form-group"><label>Gi\u00e1 tr\u1ecb *</label><input type="number" id="d_value" placeholder="VD: 10 ho\u1eb7c 100000"/></div>
        <div class="form-group"><label>S\u1ed1 l\u1ea7n d\u00f9ng (0 = kh\u00f4ng gi\u1edbi h\u1ea1n)</label><input type="number" id="d_maxUse" value="0"/></div>
      </div>`, () => {
      const code = document.getElementById('d_code').value.trim().toUpperCase();
      const value = Number(document.getElementById('d_value').value);
      if (!code) { toast('Nh\u1eadp m\u00e3!', 'error'); return false; }
      if (!value || value <= 0) { toast('Nh\u1eadp gi\u00e1 tr\u1ecb h\u1ee3p l\u1ec7!', 'error'); return false; }
      if (DB.discounts.find(x=>x.code===code)) { toast('M\u00e3 \u0111\u00e3 t\u1ed3n t\u1ea1i!', 'error'); return false; }
      DB.discounts.push({ code, type: document.getElementById('d_type').value, value, maxUse: Number(document.getElementById('d_maxUse').value)||0, usedCount: 0, active: true });
      toast('T\u1ea1o m\u00e3 th\u00e0nh c\u00f4ng!'); render(); return true;
    });
  }
}

// ===== PAGE: HISTORY =====
function history() {
  const c = document.getElementById('mainContent');

  function render() {
    c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-history"></i> Lịch Sử Học Tập</div>
        <button class="btn btn-primary" id="btnAddHistory"><i class="fas fa-plus"></i> Thêm lịch sử</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Học viên</th><th>Mã HV</th><th>Lớp đã học</th><th>Bắt đầu</th><th>Kết thúc</th><th>Kết quả</th><th>Nhận xét GV</th><th>Hoàn thành</th></tr></thead>
          <tbody>
          ${DB.history.map(h=>`<tr>
            <td>${h.studentName}</td><td>${h.studentId}</td><td>${h.className}</td>
            <td>${formatDate(h.start)}</td><td>${formatDate(h.end)}</td>
            <td><span class="badge ${h.result==='Xuất sắc'?'badge-primary':h.result==='Giỏi'?'badge-success':h.result==='Khá'?'badge-info':'badge-warning'}">${h.result}</span></td>
            <td style="max-width:200px;font-size:.82rem">${h.comment}</td>
            <td><span class="badge ${h.completed?'badge-success':'badge-warning'}">${h.completed?'Hoàn thành':'Đang học'}</span></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById('btnAddHistory').onclick = () => addHistoryModal();
  }
  render();

  function addHistoryModal() {
    openModal('Thêm lịch sử học tập', `
      <div class="form-grid">
        <div class="form-group"><label>Học viên *</label><select id="h_student">${DB.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Lớp học</label><select id="h_class">${DB.classes.map(cl=>`<option value="${cl.id}">${cl.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Ngày bắt đầu</label><input type="date" id="h_start"/></div>
        <div class="form-group"><label>Ngày kết thúc</label><input type="date" id="h_end"/></div>
        <div class="form-group"><label>Kết quả</label><select id="h_result"><option>Xuất sắc</option><option>Giỏi</option><option>Khá</option><option>Trung bình</option></select></div>
        <div class="form-group"><label>Hoàn thành</label><select id="h_done"><option value="1">Hoàn thành</option><option value="0">Đang học</option></select></div>
        <div class="form-group" style="grid-column:1/-1"><label>Nhận xét giáo viên</label><textarea id="h_comment"></textarea></div>
      </div>`, () => {
      const sid = document.getElementById('h_student').value;
      const cid = document.getElementById('h_class').value;
      const s = DB.students.find(x=>x.id===sid);
      const cl = getClassById(cid);
      DB.history.push({ studentId: sid, studentName: s.name, classId: cid, className: cl.name, start: document.getElementById('h_start').value, end: document.getElementById('h_end').value, result: document.getElementById('h_result').value, comment: document.getElementById('h_comment').value, completed: document.getElementById('h_done').value==='1' });
      toast('Đã thêm lịch sử!'); render(); return true;
    });
  }
}

// ===== INIT =====
navigate('dashboard');
