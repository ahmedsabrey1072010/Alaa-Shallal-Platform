function hashPassword(password) {
    return btoa(encodeURIComponent(password) + "_secure_hash_salt");
}

if (!localStorage.getItem('shallan_users')) {
    localStorage.setItem('shallan_users', JSON.stringify([
        { fullname: "أحمد صبري", accountType: "طالب", studentGrade: "الصف الثاني الثانوي", username: "ahmed_2026", password: hashPassword("123"), whatsapp: "01224405119", parent: "01224405119", status: "approved" }
    ]));
}

if (!localStorage.getItem('shallan_activity_logs')) {
    localStorage.setItem('shallan_activity_logs', JSON.stringify([]));
}

window.onload = function() {
    initTheme();
    checkActiveSession();
    if (typeof initRealtimeNotifications === 'function') initRealtimeNotifications();
    if (typeof initRealtimeForumChat === 'function') initRealtimeForumChat();
};

function initTheme() {
    const savedTheme = localStorage.getItem('shallan_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('shallan_theme', newTheme);
    updateThemeIcon(newTheme);
};

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

window.switchAuthTab = function(tab) {
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
};

window.toggleGradeSelection = function() {
    const accountType = document.getElementById('regAccountType').value;
    const gradeGroup = document.getElementById('gradeSelectionGroup');
    if (accountType === 'معلم') {
        gradeGroup.classList.add('hidden');
    } else {
        gradeGroup.classList.remove('hidden');
    }
};

window.updateFileName = function(input) {
    const label = document.getElementById('fileChosenLabel');
    if (input.files && input.files.length > 0) {
        label.innerText = input.files[0].name;
    } else {
        label.innerText = "اختر صورة مرفقة";
    }
};

function isValidEgyptianPhone(phone) {
    const phoneRegex = /^01[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
}

function isValidUsername(username) {
    return username.length >= 5 && username.length <= 15;
}

window.handleLogin = function() {
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
        alert(`تم قفل هذا الحساب مؤقتاً. حاول بعد ${remainingMinutes} دقيقة.`);
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
            alert("تم قفل الحساب لمدة 15 دقيقة بسبب تكرار المحاولات الخاطئة.");
        } else {
            alert(`بيانات الدخول غير صحيحة! متبقي لديك ${remainingAttempts} محاولات.`);
        }
        localStorage.setItem('shallan_login_attempts', JSON.stringify(attemptsData));
    }
};

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
        renderBooksSection();
    } else {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('studentWelcomeCard').classList.add('hidden');
        document.getElementById('profileModal').classList.add('hidden');

        const notifContainer = document.getElementById('notificationsContainer');
        if (notifContainer) {
            notifContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                    <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    يجب تسجيل الدخول بحسابك أولاً لرؤية الإشعارات والتنبيهات.
                </div>
            `;
        }

        const booksContainer = document.getElementById('booksContainer');
        if (booksContainer) {
            booksContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                    <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    قسم الكتب والمذكرات مقفول. يرجى تسجيل الدخول أولاً.
                </div>
            `;
        }

        const chatContainer = document.getElementById('chatMessagesContainer');
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #b45309; background: #fffbeb; border-radius: 10px; border: 1px dashed #f59e0b;">
                    <i class="fas fa-lock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    المنتدى مقفول. يرجى تسجيل الدخول أولاً للمشاركة والتفاعل.
                </div>
            `;
        }
    }
}

window.openProfileModal = function() {
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
};

window.closeProfileModal = function() {
    document.getElementById('profileModal').classList.add('hidden');
};

window.saveProfileChanges = function() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    if (!loggedUser) return;
    const newWhatsapp = document.getElementById('profileWhatsapp').value.trim();
    const newParent = document.getElementById('profileParent').value.trim();
    const newPass = document.getElementById('profileNewPass').value.trim();

    if (!isValidEgyptianPhone(newWhatsapp) || !isValidEgyptianPhone(newParent)) {
        alert("خطأ في أرقام الهواتف المصرية!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    let userIndex = users.findIndex(u => u.username === loggedUser.username);
    if (userIndex !== -1) {
        users[userIndex].whatsapp = newWhatsapp;
        users[userIndex].parent = newParent;
        if (newPass) users[userIndex].password = hashPassword(newPass);
        localStorage.setItem('shallan_users', JSON.stringify(users));
        sessionStorage.setItem('shallan_logged_user', JSON.stringify(users[userIndex]));
        logActivity(loggedUser.fullname, loggedUser.accountType, 'تحديث الملف الشخصي');
        alert("تم تحديث الملف الشخصي بنجاح!");
        closeProfileModal();
    }
};

window.studentLogout = function() {
    let loggedUser = JSON.parse(sessionStorage.getItem('shallan_logged_user'));
    if (loggedUser) logActivity(loggedUser.fullname, loggedUser.accountType, 'تسجيل خروج');
    sessionStorage.removeItem('shallan_logged_user');
    checkActiveSession();
    alert("تم تسجيل الخروج بنجاح.");
};

window.openAdminLoginModal = function() {
    document.getElementById('adminLoginModal').classList.remove('hidden');
    document.getElementById('adminNameInput').value = '';
    document.getElementById('adminPassInput').value = '';
};

window.closeAdminLoginModal = function() {
    document.getElementById('adminLoginModal').classList.add('hidden');
};

window.verifyAdminLogin = function() {
    const adminName = document.getElementById('adminNameInput').value.trim();
    const adminPass = document.getElementById('adminPassInput').value.trim();
    if (!adminName || !adminPass) return alert("يرجى إدخال اسم المسؤول وكلمة المرور!");

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
};

window.logoutAdmin = function() {
    const adminTitle = document.getElementById('currentAdminTitle').innerText || 'الأدمن';
    logActivity(`${adminTitle} (أدمن)`, 'أدمن', 'خروج من لوحة التحكم');
    document.getElementById('adminPanel').classList.add('hidden');
    checkActiveSession();
};

function logActivity(name, role, action) {
    let logs = JSON.parse(localStorage.getItem('shallan_activity_logs')) || [];
    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');
    logs.unshift({ name, role, action, time: timeString });
    if (logs.length > 50) logs.pop();
    localStorage.setItem('shallan_activity_logs', JSON.stringify(logs));
}

window.clearActivityLogs = function() {
    if (confirm("هل أنت متأكد من تفريغ سجل النشاطات؟")) {
        localStorage.setItem('shallan_activity_logs', JSON.stringify([]));
        renderAdminData();
        alert("تم تفريغ السجل.");
    }
};
function renderAdminData() {
    const users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    const pending = users.filter(u => u.status === 'pending');
    const approved = users.filter(u => u.status === 'approved');
    const logs = JSON.parse(localStorage.getItem('shallan_activity_logs')) || [];

    const statApproved = document.getElementById('statApprovedCount');
    const statPending = document.getElementById('statPendingCount');
    if (statApproved) statApproved.innerText = approved.length;
    if (statPending) statPending.innerText = pending.length;

    const pendingTable = document.getElementById('pendingUsersTable');
    if (pendingTable) {
        pendingTable.innerHTML = pending.map(u => `
            <tr>
                <td>${u.fullname}</td><td>${u.accountType}</td><td>${u.accountType === 'طالب' ? u.studentGrade : '-'}</td><td>${u.username}</td>
                <td><button class="btn btn-success btn-sm" onclick="approveUser('${u.username}')">موافقة</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5">لا يوجد طلبات معلقة</td></tr>';
    }

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
}

function renderApprovedTable(approvedList) {
    const approvedTable = document.getElementById('approvedUsersTable');
    if (approvedTable) {
        approvedTable.innerHTML = approvedList.map(u => `
            <tr>
                <td>${u.fullname}</td>
                <td><span style="color:${u.accountType === 'معلم' ? '#f59e0b' : '#10b981'}; font-weight:bold;">${u.accountType}</span></td>
                <td>${u.accountType === 'طالب' ? u.studentGrade : 'معلم عام'}</td>
                <td>${u.username}</td>
                <td><code style="color:#10b981;">[مشفر آمن]</code></td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteUser('${u.username}')">حذف الحساب</button></td>
            </tr>
        `).join('') || '<tr><td colspan="6">لا توجد نتائج</td></tr>';
    }
}

window.filterApprovedStudents = function() {
    const searchInput = document.getElementById('searchStudentInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('shallan_users')) || [];
    let approved = users.filter(u => u.status === 'approved');
    approved.sort((a, b) => a.fullname.localeCompare(b.fullname, 'ar'));
    const filtered = approved.filter(u => u.fullname.toLowerCase().includes(query) || u.username.toLowerCase().includes(query));
    renderApprovedTable(filtered);
};

window.approveUser = function(username) {
    let users = JSON.parse(localStorage.getItem('shallan_users'));
    let u = users.find(x => x.username === username);
    if (u) { u.status = 'approved'; localStorage.setItem('shallan_users', JSON.stringify(users)); renderAdminData(); }
};

window.deleteUser = function(username) {
    if (confirm(`هل أنت متأكد من حذف حساب (${username})؟`)) {
        let users = JSON.parse(localStorage.getItem('shallan_users'));
        users = users.filter(x => x.username !== username);
        localStorage.setItem('shallan_users', JSON.stringify(users));
        renderAdminData();
    }
};

window.handleRegister = function() {
    const fullname = document.getElementById('regFullname').value.trim();
    const accountType = document.getElementById('regAccountType').value;
    const studentGrade = accountType === 'طالب' ? document.getElementById('regStudentGrade').value : 'معلم';
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const parent = document.getElementById('regParentPhone').value.trim();

    if (!fullname || !username || !password || !confirmPassword || !whatsapp || !parent) return alert("يرجى ملء كافة حقول التسجيل!");
    if (!isValidUsername(username)) return alert("اسم المستخدم يجب أن يكون بين 5 إلى 15 حرفاً.");
    if (password !== confirmPassword) return alert("كلمة المرور غير متطابقة!");
    if (!isValidEgyptianPhone(whatsapp) || !isValidEgyptianPhone(parent)) return alert("خطأ في أرقام الهواتف المصرية!");

    let users = JSON.parse(localStorage.getItem('shallan_users'));
    if (users.some(u => u.username === username)) return alert("اسم المستخدم مسجل مسبقاً!");

    users.push({ fullname, accountType, studentGrade, username, password: hashPassword(password), whatsapp, parent, status: 'pending' });
    localStorage.setItem('shallan_users', JSON.stringify(users));
    alert("تم إرسال طلب الانضمام بنجاح! في انتظار موافقة الأدمن.");
    switchAuthTab('login');
};

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

// نظام الإشعارات السحابي اللحظي (Firebase)
function initRealtimeNotifications() {
    const container = document.getElementById('notificationsContainer');
    const adminList = document.getElementById('adminNotificationsList');
    if (!container && !adminList) return;

    const notifQuery = query(collection(db, "shallan_cloud_notifs"), orderBy("createdAt", "desc"));

    onSnapshot(notifQuery, (snapshot) => {
        let htmlContent = "";
        let adminHtml = "";

        if (snapshot.empty) {
            htmlContent = `<p style="text-align:center; color:#888;">لا توجد إشعارات حالياً.</p>`;
            adminHtml = `<p>لا توجد إشعارات لإدارتها.</p>`;
        } else {
            snapshot.forEach((docSnapshot) => {
                const n = docSnapshot.data();
                const docId = docSnapshot.id;

                htmlContent += `
                    <div style="border-bottom: 1px solid var(--input-border); padding-bottom: 12px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 style="color:var(--table-th-color); margin-bottom: 4px;">${n.title}</h4>
                            <small style="font-size:0.8rem; color:#0284c7; font-weight: 700;"><i class="far fa-clock"></i> ${n.time}</small>
                        </div>
                        <p>${n.content}</p>
                    </div>
                `;

                adminHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--input-bg); padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--input-border);">
                        <div style="max-width: 60%;">
                            <strong>${n.title}</strong> <small style="color:#666; margin-right: 8px;">(${n.time})</small>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-success btn-sm" onclick="editCloudNotification('${docId}', '${n.title}', '${n.content}')" style="background: #3b82f6;"><i class="fas fa-edit"></i> تعديل</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteCloudNotification('${docId}')"><i class="fas fa-trash-alt"></i> حذف</button>
                        </div>
                    </div>
                `;
            });
        }

        if (container) container.innerHTML = htmlContent;
        if (adminList) adminList.innerHTML = adminHtml;
    });
}

window.addNotification = async function() {
    const title = document.getElementById('notifTitle').value.trim();
    const content = document.getElementById('notifContent').value.trim();
    if (!title || !content) return alert("يرجى كتابة العنوان والمحتوى!");

    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');

    try {
        await addDoc(collection(db, "shallan_cloud_notifs"), {
            title,
            content,
            time: timeString,
            createdAt: serverTimestamp()
        });
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifContent').value = '';
        showToast("إشعار جديد تم نشره سحابياً!", title);
        alert("تم نشر الإشعار بنجاح لكافة الطلاب والمعلمين!");
    } catch (err) {
        console.error("خطأ في نشر الإشعار:", err);
        alert("تعذر نشر الإشعار، تحقق من الإنترنت.");
    }
};

window.deleteCloudNotification = async function(docId) {
    if (confirm("هل أنت متأكد من حذف هذا الإشعار سحابياً؟")) {
        try {
            await deleteDoc(doc(db, "shallan_cloud_notifs", docId));
            alert("تم حذف الإشعار.");
        } catch (err) {
            console.error("خطأ في الحذف:", err);
            alert("حدث خطأ أثناء محاولة الحذف.");
        }
    }
};

window.editCloudNotification = async function(docId, oldTitle, oldContent) {
    let newTitle = prompt("تعديل عنوان الإشعار:", oldTitle);
    if (newTitle === null) return;
    newTitle = newTitle.trim();

    let newContent = prompt("تعديل تفاصيل الإشعار:", oldContent);
    if (newContent === null) return;
    newContent = newContent.trim();

    if (!newTitle || !newContent) return alert("لا يمكن ترك الحقول فارغة!");

    let now = new Date();
    let timeString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG') + ' (معدل)';

    try {
        await updateDoc(doc(db, "shallan_cloud_notifs", docId), {
            title: newTitle,
            content: newContent,
            time: timeString
        });
        alert("تم تعديل الإشعار وتحديثه لكافة المستخدمين!");
    } catch (err) {
        console.error("خطأ في التعديل:", err);
        alert("تعذر تعديل الإشعار.");
    }
};

// نظام شات المنتدى السحابي اللحظي (Firebase)
function initRealtimeForumChat() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    const chatQuery = query(collection(db, "shallan_cloud_chat"), orderBy("createdAt", "asc"));

    onSnapshot(chatQuery, (snapshot) => {
        container.innerHTML = "";
        
        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align: center; color: #888; padding: 15px;">لا توجد رسائل في الشات بعد. كن أول المشاركين!</p>`;
            return;
        }

        let isAdminOpen = !document.getElementById('adminPanel').classList.contains('hidden');

        snapshot.forEach((docSnapshot) => {
            const m = docSnapshot.data();
            const docId = docSnapshot.id;

            container.innerHTML += `
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
                    ${isAdminOpen ? `<div style="text-align: left; margin-top: 8px;"><button class="btn btn-danger btn-sm" onclick="deleteCloudChatMessage('${docId}')"><i class="fas fa-trash-alt"></i> حذف الرسالة</button></div>` : ''}
                </div>
            `;
        });
        container.scrollTop = container.scrollHeight;
    });
}

window.sendChatMessage = function() {
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

    if (imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            let base64Image = e.target.result;
            try {
                await addDoc(collection(db, "shallan_cloud_chat"), {
                    author: authorName,
                    role: authorRole,
                    grade: authorGrade,
                    message: messageText,
                    image: base64Image,
                    time: timeString,
                    createdAt: serverTimestamp()
                });
                document.getElementById('chatMessageInput').value = '';
                imageInput.value = '';
                document.getElementById('fileChosenLabel').innerText = "اختر صورة مرفقة";
                showToast("رسالة جديدة بالمنتدى", `${authorName} أضاف رسالة.`);
            } catch (err) {
                console.error("خطأ في إرسال الرسالة:", err);
                alert("تعذر إرسال الرسالة، تحقق من الإنترنت.");
            }
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        (async () => {
            try {
                await addDoc(collection(db, "shallan_cloud_chat"), {
                    author: authorName,
                    role: authorRole,
                    grade: authorGrade,
                    message: messageText,
                    image: null,
                    time: timeString,
                    createdAt: serverTimestamp()
                });
                document.getElementById('chatMessageInput').value = '';
                document.getElementById('fileChosenLabel').innerText = "اختر صورة مرفقة";
                showToast("رسالة جديدة بالمنتدى", `${authorName} أضاف رسالة.`);
            } catch (err) {
                console.error("خطأ في إرسال الرسالة:", err);
                alert("تعذر إرسال الرسالة، تحقق من الإنترنت.");
            }
        })();
    }
};

window.deleteCloudChatMessage = async function(docId) {
    if (confirm("هل أنت متأكد من حذف هذه الرسالة من الشات السحابي؟")) {
        try {
            await deleteDoc(doc(db, "shallan_cloud_chat", docId));
        } catch (err) {
            console.error("خطأ في الحذف:", err);
            alert("حدث خطأ أثناء محاولة الحذف.");
        }
    }
};
