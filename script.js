function hashPassword(password) {
    return btoa(encodeURIComponent(password) + "_secure_hash_salt");
}

if (!localStorage.getItem('shallan_users')) {
    localStorage.setItem('shallan_users', JSON.stringify([
        { fullname: "أحمد صبري", accountType: "طالب", studentGrade: "الصف الثاني الثانوي", username: "ahmed_2026", password: hashPassword("123"), whatsapp: "01224405119", parent: "01224405119", status: "approved" }
    ]));
}

if (!localStorage.getItem('shallan_notifs')) {
    localStorage.setItem('shallan_notifs', JSON.stringify([
        { id: 1, title: "أهلاً بكم في المنصة", content: "تم افتتاح منصة الأستاذ علاء شلال التعليمية الرسمية.", time: "09/11/2026 - 12:00:00 ص" }
    ]));
}

if (!localStorage.getItem('shallan_activity_logs')) {
    localStorage.setItem('shallan_activity_logs', JSON.stringify([]));
}

window.onload = function() {
    initTheme();
    checkActiveSession();
};

function initTheme() {
    const savedTheme = localStorage.getItem('shallan_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('shallan_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function showToast(title, message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastMessage').innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginFormContainer');
    const regForm = document.getElementById('registerFormContainer');
    const loginBtn = document.getElementById('loginTabBtn');
    const regBtn = document.getElementById('regTabBtn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        loginBtn.style.background = 'rgba(30, 60, 114, 0.85)';
        regBtn.style.background = 'rgba(30, 60, 114, 0.4)';
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        regBtn.style.background = 'rgba(30, 60, 114, 0.85)';
        loginBtn.style.background = 'rgba(30, 60, 114, 0.4)';
    }
}

function toggleGradeSelection() {
    const accountType = document.getElementById('regAccountType').value;
    const gradeGroup = document.getElementById('gradeSelectionGroup');
    if (accountType === 'معلم') {
        gradeGroup.classList.add('hidden');
    } else {
        gradeGroup.classList.remove('hidden');
    }
}

function updateFileName(input) {
    const label = document.getElementById('fileChosenLabel');
    if (input.files && input.files.length > 0) {
        label.innerText = input.files[0].name;
    } else {
        label.innerText = "اختر صورة مرفقة";
    }
}

function isValidEgyptianPhone(phone) {
    const phoneRegex = /^01[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
}

function isValidUsername(username) {
    return username.length >= 5 && username.length <= 15;
}

function handleLogin() {
    const usernameInput = document.getElementById('loginUsername').value.trim();
    const passwordInput = document.getElementById('loginPassword').value.trim();

    if (!usernameInput || !passwordInput) {
        alert("يرجى إدخال اسم المستخدم وكلمة المرور!");
        return;
    }

    let attemptsData = JSON.parse(localStorage.getItem('shallan_login_attempts')) || {};
    let lockData = JSON.parse(localStorage.getItem('shallan_lockout')) || {};
    let now = new Date().getTime();

    if (lockData[usernameInput] && now < lockData[usernameInput]) {
        let remainingMinutes = Math.ceil((lockData[usernameInput] - now) / 60000);
        alert(`تم قفل هذا الحساب مؤقتاً بسبب تكرار المحاولات الخاطئة. يجوز المحاولة بعد ${remainingMinutes} دقيقة.`);
        return;
    }

    let users = JSON.parse(localStorage.getItem('shallan_users'));
    let hashedPassword = hashPassword(passwordInput);
    let user = users.find(u => u.username === usernameInput && u.password === hashedPassword);

    if (user) {
        if (user.status !== 'approved') {
            alert("حسابك ما زال في انتظار موافقة الأدمن.");
            return;
        }
        attemptsData[usernameInput] = 0;
        localStorage.setItem('shallan_login_attempts', JSON.stringify(attemptsData));

        logActivity(user.fullname, user.accountType, 'تسجيل دخول');

        sessionStorage.setItem('shallan_logged_user', JSON.stringify(user));
        alert(`مرحباً بك يا ${user.fullname} (${user.accountType})`);
        checkActiveSession();
    } else {
        attemptsData[usernameInput] = (attemptsData[usernameInput] || 0) + 1;
        let remainingAttempts = 3 - attemptsData[usernameInput];

        if (attemptsData[usernameInput] >= 3) {
            lockData[usernameInput] = now + (15 * 60 * 1000);
            localStorage.setItem('shallan_lockout', JSON.stringify(lockData));
            attemptsData[usernameInput] = 0;
            alert("لقد تجاوزت الحد المسموح من المحاولات الخاطئة (3 مرات). تم قفل الحساب لمدة 15 دقيقة.");
        } else {
            alert(`بيانات الدخول غير صحيحة! متبقي لديك ${remainingAttempts} محاولات قبل قفل الحساب.`);
        }
        localStorage.setItem('shallan_login_attempts', JSON.stringify(attemptsData));
    }
}

function checkActiveSession() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    let isAdminOpen = !document.getElementById('adminPanel').classList.contains('hidden');
    
    if (loggedUser || isAdminOpen) {
        if (loggedUser) {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('studentWelcomeCard').classList.remove('hidden');
            document.getElementById('welcomeStudentName').innerText = loggedUser.fullname;
            document.getElementById('welcomeRoleSpan').innerText = loggedUser.accountType;
            document.getElementById('welcomeGradeP').innerText = loggedUser.accountType === 'طالب' ? `المرحلة الدراسية: ${loggedUser.studentGrade}` : 'حساب معلم رسمي بالمنصة';
        }
        renderNotifications();
        renderBooksSection();
        renderChatMessages();
    } else {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('studentWelcomeCard').classList.add('hidden');
        document.getElementById('profileModal').classList.add('hidden');

        document.getElementById('notificationsContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                يجب تسجيل الدخول بحسابك أولاً لرؤية الإشعارات والتنبيهات.
            </div>
        `;

        document.getElementById('booksContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                قسم الكتب والمذكرات مقفول. يرجى تسجيل الدخول أولاً.
            </div>
        `;

        document.getElementById('chatMessagesContainer').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                المنتدى (الشات الخاص) مقفول. يرجى تسجيل الدخول أولاً للمشاركة والتفاعل.
            </div>
        `;
    }
}
function openProfileModal() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    if (!loggedUser) return;

    document.getElementById('profileFullname').value = loggedUser.fullname;
    document.getElementById('profileAccountType').value = loggedUser.accountType;
    document.getElementById('profileUsername').value = loggedUser.username;
    document.getElementById('profileWhatsapp').value = loggedUser.whatsapp || '';
    document.getElementById('profileParent').value = loggedUser.parent || '';
    document.getElementById('profileNewPass').value = '';

    const gradeGroup = document.getElementById('profileGradeGroup');
    if (loggedUser.accountType === 'معلم') {
        gradeGroup.classList.add('hidden');
    } else {
        gradeGroup.classList.remove('hidden');
        document.getElementById('profileGrade').value = loggedUser.studentGrade;
    }

    document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

function saveProfileChanges() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    if (!loggedUser) return;

    const newWhatsapp = document.getElementById('profileWhatsapp').value.trim();
    const newParent = document.getElementById('profileParent').value.trim();
    const newPass = document.getElementById('profileNewPass').value.trim();

    if (!isValidEgyptianPhone(newWhatsapp) || !isValidEgyptianPhone(newParent)) {
        alert("خطأ في أرقام الهواتف! يجب أن تكون أرقاماً مصرية صحيحة تتكون من 11 رقماً ويبدأ بـ (010, 011, 012, 015).");
        return;
    }

    let users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    let userIndex = users.findIndex(u => u.username === loggedUser.username);

    if (userIndex !== -1) {
        users[userIndex].whatsapp = newWhatsapp;
        users[userIndex].parent = newParent;
        if (newPass) {
            users[userIndex].password = hashPassword(newPass);
        }

        localStorage.setItem('shallan_users', JSON.stringify(users));
        sessionStorage.setItem('shallan_logged_user', JSON.stringify(users[userIndex]));
        
        logActivity(loggedUser.fullname, loggedUser.accountType, 'تحديث الملف الشخصي');
        alert("تم تحديث بيانات الملف الشخصي بنجاح!");
        closeProfileModal();
    }
}

function studentLogout() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    if (loggedUser) {
        logActivity(loggedUser.fullname, loggedUser.accountType, 'تسجيل خروج');
    }
    sessionStorage.removeItem('shallan_logged_user');
    checkActiveSession();
    alert("تم تسجيل الخروج بنجاح.");
}

function openAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.remove('hidden');
    document.getElementById('adminNameInput').value = '';
    document.getElementById('adminPassInput').value = '';
}

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.add('hidden');
}

function verifyAdminLogin() {
    const adminName = document.getElementById('adminNameInput').value.trim();
    const adminPass = document.getElementById('adminPassInput').value.trim();

    if (!adminName || !adminPass) {
        alert("يرجى إدخال اسم المسؤول وكلمة المرور!");
        return;
    }

    if (adminPass === "Sabrey1990@@") {
        logActivity(`${adminName} (أدمن)`, 'أدمن', 'دخول لوحة التحكم');
        document.getElementById('currentAdminTitle').innerText = adminName;
        closeAdminLoginModal();
        document.getElementById('adminPanel').classList.remove('hidden');
        
        checkActiveSession();
        renderAdminData();
    } else {
        alert("كلمة المرور الموحدة غير صحيحة!");
    }
}

function logoutAdmin() {
    const adminTitle = document.getElementById('currentAdminTitle').innerText || 'الأدمن';
    logActivity(`${adminTitle} (أدمن)`, 'أدمن', 'خروج من لوحة التحكم');
    document.getElementById('adminPanel').classList.add('hidden');
    checkActiveSession();
}

function logActivity(name, role, action) {
    let logs = JSON.parse(localStorage.getItem('shallan_activity_logs')) || [];
    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');
    
    logs.unshift({ name, role, action, time: timeString });
    if (logs.length > 50) logs.pop();
    localStorage.setItem('shallan_activity_logs', JSON.stringify(logs));
}

function clearActivityLogs() {
    if (confirm("هل أنت متأكد من مسح وتفريغ سجل النشاطات بالكامل؟")) {
        localStorage.setItem('shallan_activity_logs', JSON.stringify([]));
        renderAdminData();
        alert("تم تفريغ السجل بنجاح.");
    }
}

function renderAdminData() {
    const users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    const pending = users.filter(u => u.status === 'pending');
    const approved = users.filter(u => u.status === 'approved');
    const logs = JSON.parse(localStorage.getItem('shallan_activity_logs')) || [];

    document.getElementById('statApprovedCount').innerText = approved.length;
    document.getElementById('statPendingCount').innerText = pending.length;

    document.getElementById('pendingUsersTable').innerHTML = pending.map(u => `
        <tr>
            <td>${u.fullname}</td><td>${u.accountType}</td><td>${u.accountType === 'طالب' ? u.studentGrade : '-'}</td><td>${u.username}</td>
            <td><button class="btn btn-success btn-sm" onclick="approveUser('${u.username}')">موافقة</button></td>
        </tr>
    `).join('') || '<tr><td colspan="5">لا يوجد طلبات معلقة</td></tr>';

    approved.sort((a, b) => a.fullname.localeCompare(b.fullname, 'ar'));
    renderApprovedTable(approved);

    const activityTable = document.getElementById('activityLogsTable');
    if (activityTable) {
        activityTable.innerHTML = logs.map(l => `
            <tr>
                <td>${l.name}</td>
                <td><span style="padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; background: ${l.role === 'أدمن' ? '#3b82f6' : (l.role === 'معلم' ? '#f59e0b' : '#10b981')}; color: white;">${l.role}</span></td>
                <td>${l.action}</td>
                <td>${l.time}</td>
            </tr>
        `).join('') || '<tr><td colspan="4">لا توجد نشاطات مسجلة بعد</td></tr>';
    }

    renderAdminNotificationsList();
}

function renderApprovedTable(approvedList) {
    document.getElementById('approvedUsersTable').innerHTML = approvedList.map(u => `
        <tr>
            <td>${u.fullname}</td>
            <td><span style="color:${u.accountType === 'معلم' ? '#f59e0b' : '#10b981'}; font-weight:bold;">${u.accountType}</span></td>
            <td>${u.accountType === 'طالب' ? u.studentGrade : 'معلم عام'}</td>
            <td>${u.username}</td>
            <td><code style="color:#10b981;">[مشفر آمن]</code></td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteUser('${u.username}')">حذف الحساب</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6">لا توجد نتائج مطابقة للبحث</td></tr>';
}

function filterApprovedStudents() {
    const query = document.getElementById('searchStudentInput').value.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    let approved = users.filter(u => u.status === 'approved');

    approved.sort((a, b) => a.fullname.localeCompare(b.fullname, 'ar'));
    const filtered = approved.filter(u => u.fullname.toLowerCase().includes(query) || u.username.toLowerCase().includes(query));
    renderApprovedTable(filtered);
}

function approveUser(username) {
    let users = JSON.parse(localStorage.getItem('shallan_users'));
    let u = users.find(x => x.username === username);
    if (u) { u.status = 'approved'; localStorage.setItem('shallan_users', JSON.stringify(users)); renderAdminData(); }
}

function deleteUser(username) {
    if (confirm(`هل أنت متأكد من حذف حساب (${username}) نهائياً؟`)) {
        let users = JSON.parse(localStorage.getItem('shallan_users'));
        users = users.filter(x => x.username !== username);
        localStorage.setItem('shallan_users', JSON.stringify(users));
        renderAdminData();
    }
}

function handleRegister() {
    const fullname = document.getElementById('regFullname').value.trim();
    const accountType = document.getElementById('regAccountType').value;
    const studentGrade = accountType === 'طالب' ? document.getElementById('regStudentGrade').value : 'معلم';
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const parent = document.getElementById('regParentPhone').value.trim();
        if (!fullname || !username || !password || !confirmPassword || !whatsapp || !parent) {
        alert("يرجى ملء كافة حقول التسجيل بدقة!"); return;
    }

    if (!isValidUsername(username)) {
        alert("اسم المستخدم غير صالح! يجب أن يتراوح بين 5 إلى 15 حرفاً.");
        return;
    }

    if (password !== confirmPassword) {
        alert("كلمة المرور غير مطابقة لتأكيد كلمة المرور!");
        return;
    }

    if (!isValidEgyptianPhone(whatsapp) || !isValidEgyptianPhone(parent)) {
        alert("خطأ في أرقام الهواتف! يجب أن تكون أرقاماً مصرية صحيحة تتكون من 11 رقماً ويبدأ بـ (010, 011, 012, 015).");
        return;
    }

    let users = JSON.parse(localStorage.getItem('shallan_users'));
    if (users.some(u => u.username === username)) { 
        alert("اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر!"); 
        return; 
    }

    let hashedPassword = hashPassword(password);
    users.push({ fullname, accountType, studentGrade, username, password: hashedPassword, whatsapp, parent, status: 'pending' });
    localStorage.setItem('shallan_users', JSON.stringify(users));
    alert("تم إرسال طلب الانضمام بنجاح! في انتظار موافقة الأدمن.");
    switchAuthTab('login');
}

function addNotification() {
    const title = document.getElementById('notifTitle').value.trim();
    const content = document.getElementById('notifContent').value.trim();

    if (!title || !content) return alert("يرجى كتابة العنوان والمحتوى!");

    let notifs = JSON.parse(localStorage.getItem('shallan_notifs')) || [];
    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');

    notifs.unshift({ id: Date.now(), title, content, time: timeString });
    localStorage.setItem('shallan_notifs', JSON.stringify(notifs));

    document.getElementById('notifTitle').value = '';
    document.getElementById('notifContent').value = '';
    renderAdminData();
    renderNotifications();

    showToast("إشعار جديد تم نشره!", title);
    alert("تم نشر الإشعار بنجاح!");
}

function deleteNotification(id) {
    if (confirm("هل أنت متأكد من حذف هذا الإشعار نهائياً؟")) {
        let notifs = JSON.parse(localStorage.getItem('shallan_notifs')) || [];
        notifs = notifs.filter(n => n.id !== id);
        localStorage.setItem('shallan_notifs', JSON.stringify(notifs));
        renderAdminData();
        renderNotifications();
        alert("تم حذف الإشعار بنجاح.");
    }
}

function editNotification(id) {
    let notifs = JSON.parse(localStorage.getItem('shallan_notifs')) || [];
    let notif = notifs.find(n => n.id === id);
    if (!notif) return;

    let newTitle = prompt("تعديل عنوان الإشعار:", notif.title);
    if (newTitle === null) return;
    newTitle = newTitle.trim();

    let newContent = prompt("تعديل تفاصيل ومحتوى الإشعار:", notif.content);
    if (newContent === null) return;
    newContent = newContent.trim();

    if (!newTitle || !newContent) {
        alert("لا يمكن ترك العنوان أو التفاصيل فارغة!");
        return;
    }

    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG') + ' (معدل)';

    notif.title = newTitle;
    notif.content = newContent;
    notif.time = timeString;

    localStorage.setItem('shallan_notifs', JSON.stringify(notifs));
    renderAdminData();
    renderNotifications();
    alert("تم تعديل العنوان والتفاصيل بنجاح!");
}

function renderNotifications() {
    const notifs = JSON.parse(localStorage.getItem('shallan_notifs')) || [];
    const container = document.getElementById('notificationsContainer');
    if (container) {
        container.innerHTML = notifs.map(n => `
            <div style="border-bottom: 1px solid var(--input-border); padding-bottom: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="color:var(--table-th-color); margin-bottom: 4px;">${n.title}</h4>
                    <small style="font-size:0.8rem; color:#0284c7; font-weight: 700;"><i class="far fa-clock"></i> ${n.time}</small>
                </div>
                <p>${n.content}</p>
            </div>
        `).join('') || '<p style="text-align:center; color:#888;">لا توجد إشعارات حالياً.</p>';
    }
}

function renderAdminNotificationsList() {
    const notifs = JSON.parse(localStorage.getItem('shallan_notifs')) || [];
    const container = document.getElementById('adminNotificationsList');
    if (!container) return;

    container.innerHTML = notifs.map(n => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--input-bg); padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--input-border);">
            <div style="max-width: 60%;">
                <strong>${n.title}</strong> <small style="color:#666; margin-right: 8px;">(${n.time})</small>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn btn-success btn-sm" onclick="editNotification(${n.id})" style="background: #3b82f6;"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-danger btn-sm" onclick="deleteNotification(${n.id})"><i class="fas fa-trash-alt"></i> حذف</button>
            </div>
        </div>
    `).join('') || '<p>لا توجد إشعارات لإدارتها.</p>';
}

function renderBooksSection() {
    const booksContainer = document.getElementById('booksContainer');
    if (booksContainer) {
        booksContainer.innerHTML = `
            <div class="grid-single">
                <div class="item-card text-center">
                    <h3><i class="fas fa-book"></i> مكتبة الكتب والمذكرات الرسمية</h3>
                    <p>تصفح وتحميل أحدث المذكرات، الملخصات، والكتب الدراسية بصيغة PDF.</p>
                    <a href="#" target="_blank" class="btn" style="margin-top:12px; text-decoration:none;"><i class="fas fa-download"></i> تصفح الكتب والمذكرات</a>
                </div>
            </div>
        `;
    }
}
function sendChatMessage() {
    const messageText = document.getElementById('chatMessageInput').value.trim();
    const imageInput = document.getElementById('chatImageInput');

    if (!messageText && imageInput.files.length === 0) {
        alert("يرجى كتابة رسالة أو إرفاق صورة على الأقل!");
        return;
    }

    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    let isAdminOpen = !document.getElementById('adminPanel').classList.contains('hidden');
    let authorName = isAdminOpen ? "الأستاذ علاء شلال (أدمن)" : (loggedUser ? loggedUser.fullname : "مستخدم");
    let authorRole = isAdminOpen ? "أدمن" : (loggedUser ? loggedUser.accountType : "زائر");
    let authorGrade = loggedUser && loggedUser.accountType === 'طالب' ? loggedUser.studentGrade : (isAdminOpen ? 'معلم عام' : '');

    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');

    const saveToFirestore = (imageUrl = null) => {
        db.collection("chat_messages").add({
            author: authorName,
            role: authorRole,
            grade: authorGrade,
            message: messageText,
            image: imageUrl,
            time: timeString,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            document.getElementById('chatMessageInput').value = '';
            imageInput.value = '';
            document.getElementById('fileChosenLabel').innerText = "اختر صورة مرفقة";
            showToast("رسالة جديدة في المنتدى", `${authorName} أضاف رسالة جديدة.`);
        })
        .catch((error) => {
            console.error("خطأ في إرسال الرسالة: ", error);
            alert("تعذر إرسال الرسالة، تحقق من الإنترنت أو قواعد الأمان.");
        });
    };

    if (imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveToFirestore(e.target.result);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveToFirestore(null);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    let isAdminOpen = !document.getElementById('adminPanel').classList.contains('hidden');

    db.collection("chat_messages").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        let chatMessages = [];
        snapshot.forEach((doc) => {
            chatMessages.push({ id: doc.id, ...doc.data() });
        });

        if (chatMessages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">لا توجد رسائل في الشات بعد.</p>';
            return;
        }

        container.innerHTML = chatMessages.map(m => `
            <div style="background: var(--item-bg); border: 1px solid var(--input-border); padding: 12px 15px; border-radius: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div>
                        <span style="font-weight: 700; color: var(--table-th-color); font-size: 0.95rem;"><i class="fas fa-user-circle"></i> ${m.author}</span>
                        <span style="padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; background: ${m.role === 'أدمن' ? '#3b82f6' : (m.role === 'معلم' ? '#f59e0b' : '#10b981')}; color: white; margin-right: 6px;">${m.role} ${m.grade ? '(' + m.grade + ')' : ''}</span>
                    </div>
                    <small style="color: #0284c7; font-weight: 600; font-size: 0.8rem;"><i class="far fa-clock"></i> ${m.time}</small>
                </div>
                ${m.message ? `<p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 8px; white-space: pre-wrap;">${m.message}</p>` : ''}
                ${m.image ? `<div style="margin-top: 8px;"><img src="${m.image}" alt="صورة مرفقة" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid var(--input-border); display: block;"></div>` : ''}
                ${isAdminOpen ? `<div style="text-align: left; margin-top: 8px;"><button class="btn btn-danger btn-sm" onclick="deleteFirebaseChatMessage('${m.id}')"><i class="fas fa-trash-alt"></i> حذف الرسالة</button></div>` : ''}
            </div>
        `).join('');
    });
}

function deleteFirebaseChatMessage(id) {
    if (confirm("هل أنت متأكد من حذف هذه الرسالة من الشات؟")) {
        db.collection("chat_messages").doc(id).delete().catch((error) => {
            console.error("خطأ في الحذف: ", error);
        });
    }
                }
            
