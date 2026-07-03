"use strict";

const STORAGE_KEY = "students";

let students = loadStudents();
let activeFilter = "all";
let activeSort = null;

const els = {
    form: document.getElementById("studentForm"),
    editId: document.getElementById("editId"),
    studentId: document.getElementById("studentId"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    mobile: document.getElementById("mobile"),
    course: document.getElementById("course"),
    age: document.getElementById("age"),
    percentage: document.getElementById("percentage"),
    submitBtn: document.getElementById("submitBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    deleteLastBtn: document.getElementById("deleteLastBtn"),
    search: document.getElementById("search"),
    tableBody: document.getElementById("studentTableBody"),
    totalStudents: document.getElementById("totalStudents"),
    avgPercentage: document.getElementById("avgPercentage"),
    showingCount: document.getElementById("showingCount"),
    toast: document.getElementById("toast"),
    selectedCount: document.getElementById("selectedCount"),
    deleteSelectedBtn: document.getElementById("deleteSelectedBtn"),
    selectAll: document.getElementById("selectAll"),
    selectAllHeader: document.getElementById("selectAllHeader"),
};

function loadStudents() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function showToast(message, type = "success") {
    els.toast.textContent = message;
    els.toast.className = `toast toast-${type}`;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        els.toast.classList.add("hidden");
    }, 3000);
}

function getStudentById(id) {
    return students.find((s) => s.studentId === id);
}

function isDuplicateId(id, excludeId = "") {
    return students.some((s) => s.studentId === id && s.studentId !== excludeId);
}

function validateForm() {
    const id = els.studentId.value.trim();
    const editingId = els.editId.value;

    if (!id) {
        showToast("Student ID is required.", "error");
        els.studentId.focus();
        return false;
    }

    if (isDuplicateId(id, editingId)) {
        showToast("A student with this ID already exists.", "error");
        els.studentId.focus();
        return false;
    }

    const age = Number(els.age.value);
    const pct = Number(els.percentage.value);

    if (age < 5 || age > 100) {
        showToast("Age must be between 5 and 100.", "error");
        els.age.focus();
        return false;
    }

    if (pct < 0 || pct > 100) {
        showToast("Percentage must be between 0 and 100.", "error");
        els.percentage.focus();
        return false;
    }

    return true;
}

function buildStudentFromForm() {
    return {
        studentId: els.studentId.value.trim(),
        name: els.name.value.trim(),
        email: els.email.value.trim(),
        mobile: els.mobile.value.trim(),
        course: els.course.value.trim(),
        age: Number(els.age.value),
        percentage: Number(els.percentage.value),
    };
}

function resetForm() {
    els.form.reset();
    els.editId.value = "";
    els.studentId.disabled = false;
    els.submitBtn.textContent = "💾 Save Student";
    els.cancelBtn.classList.add("hidden");
}

function setEditMode(student) {
    els.editId.value = student.studentId;
    els.studentId.value = student.studentId;
    els.studentId.disabled = true;
    els.name.value = student.name;
    els.email.value = student.email;
    els.mobile.value = student.mobile;
    els.course.value = student.course;
    els.age.value = student.age;
    els.percentage.value = student.percentage;
    els.submitBtn.textContent = "✏️ Update Student";
    els.cancelBtn.classList.remove("hidden");
    els.studentId.scrollIntoView({ behavior: "smooth", block: "center" });
}

function applyFilter(list) {
    switch (activeFilter) {
        case "percentage":
            return list.filter((s) => s.percentage > 75);
        case "age":
            return list.filter((s) => s.age > 20);
        default:
            return list;
    }
}

function applySearch(list) {
    const keyword = els.search.value.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter(
        (s) =>
            s.name.toLowerCase().includes(keyword) ||
            s.course.toLowerCase().includes(keyword) ||
            s.studentId.toLowerCase().includes(keyword)
    );
}

function applySort(list) {
    const sorted = [...list];

    switch (activeSort) {
        case "name":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "age":
            sorted.sort((a, b) => a.age - b.age);
            break;
        case "percentage":
            sorted.sort((a, b) => b.percentage - a.percentage);
            break;
    }

    return sorted;
}

function getVisibleStudents() {
    return applySort(applySearch(applyFilter(students)));
}

function updateStats(visibleCount) {
    els.totalStudents.textContent = students.length;
    els.showingCount.textContent = visibleCount;

    if (students.length === 0) {
        els.avgPercentage.textContent = "0";
        return;
    }

    const avg =
        students.reduce((sum, s) => sum + s.percentage, 0) / students.length;
    els.avgPercentage.textContent = avg.toFixed(2);
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#studentTableBody input[type="checkbox"]');
    const checked = document.querySelectorAll('#studentTableBody input[type="checkbox"]:checked');
    els.selectedCount.textContent = checked.length;
    els.deleteSelectedBtn.disabled = checked.length === 0;
}

function renderTable(data) {
    els.tableBody.replaceChildren();

    if (data.length === 0) {
        const row = document.createElement("tr");
        row.className = "empty-row";
        row.innerHTML =
            '<td colspan="9">No students found. Add a student or adjust your search.</td>';
        els.tableBody.appendChild(row);
        updateStats(0);
        updateSelectedCount();
        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach((student, index) => {
        const row = document.createElement("tr");
        row.dataset.index = index;
        row.innerHTML = `
            <td>
                <input type="checkbox" class="student-checkbox" data-id="${escapeHtml(student.studentId)}" onchange="updateSelectedCount()">
            </td>
            <td>${escapeHtml(student.studentId)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.mobile)}</td>
            <td>${escapeHtml(student.course)}</td>
            <td>${escapeHtml(student.age)}</td>
            <td>${escapeHtml(student.percentage)}%</td>
            <td class="actions-cell">
                <button type="button" class="btn btn-edit" data-action="edit" data-id="${escapeHtml(student.studentId)}">Edit</button>
                <button type="button" class="btn btn-delete" data-action="delete" data-id="${escapeHtml(student.studentId)}">Delete</button>
            </td>
        `;
        fragment.appendChild(row);
    });

    els.tableBody.appendChild(fragment);
    updateStats(data.length);
    updateSelectedCount();
}

function displayStudents() {
    renderTable(getVisibleStudents());
}

function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const student = buildStudentFromForm();
    const editingId = els.editId.value;

    if (editingId) {
        const index = students.findIndex((s) => s.studentId === editingId);
        if (index !== -1) {
            students[index] = student;
            showToast("Student updated successfully.");
        }
    } else {
        students.push(student);
        showToast("Student added successfully.");
    }

    saveStudents();
    resetForm();
    displayStudents();
}

function handleEdit(id) {
    const student = getStudentById(id);
    if (!student) {
        showToast("Student not found.", "error");
        displayStudents();
        return;
    }
    setEditMode(student);
}

function handleDelete(id) {
    const student = getStudentById(id);
    if (!student) {
        showToast("Student not found.", "error");
        displayStudents();
        return;
    }

    const confirmed = confirm(`Delete ${student.name} (${student.studentId})?`);
    if (!confirmed) return;

    students = students.filter((s) => s.studentId !== id);
    saveStudents();

    if (els.editId.value === id) resetForm();

    showToast(`Student ${student.name} deleted.`, "info");
    displayStudents();
}

// Delete only the last student in the list (bottom to top)
function deleteLastStudent() {
    if (students.length === 0) {
        showToast("No students to delete.", "error");
        return;
    }

    // Get the last student
    const lastStudent = students[students.length - 1];
    
    const confirmed = confirm(`Delete the last student?\n\n${lastStudent.name} (${lastStudent.studentId}) will be deleted.`);
    if (!confirmed) return;

    // Remove the last student
    students.pop();
    saveStudents();

    if (els.editId.value === lastStudent.studentId) {
        resetForm();
    }

    showToast(`Last student ${lastStudent.name} deleted.`, "info");
    displayStudents();
}

// Delete only selected students
function deleteSelected() {
    const checkboxes = document.querySelectorAll('#studentTableBody input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        showToast("No students selected.", "error");
        return;
    }

    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    const names = ids.map(id => {
        const student = getStudentById(id);
        return student ? student.name : id;
    });

    const confirmed = confirm(`Delete ${ids.length} selected student(s)?\n\nOnly the checked students will be deleted.`);
    if (!confirmed) return;

    // Delete only the selected students (filter them out)
    const deletedCount = ids.length;
    students = students.filter((s) => !ids.includes(s.studentId));
    saveStudents();

    if (els.editId.value && ids.includes(els.editId.value)) {
        resetForm();
    }

    // Uncheck select all checkboxes
    if (els.selectAll) els.selectAll.checked = false;
    if (els.selectAllHeader) els.selectAllHeader.checked = false;

    displayStudents();
    showToast(`${deletedCount} student(s) deleted successfully.`, "success");
}

// Toggle all checkboxes
function toggleAllCheckboxes() {
    const checkboxes = document.querySelectorAll('#studentTableBody input[type="checkbox"]');
    const isChecked = els.selectAll.checked || els.selectAllHeader.checked;
    
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
    
    // Sync both select all checkboxes
    if (els.selectAll) els.selectAll.checked = isChecked;
    if (els.selectAllHeader) els.selectAllHeader.checked = isChecked;
    
    updateSelectedCount();
}

// Make functions globally accessible
window.toggleAllCheckboxes = toggleAllCheckboxes;
window.deleteSelected = deleteSelected;
window.updateSelectedCount = updateSelectedCount;

function setActiveFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-filter]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    displayStudents();
}

function setActiveSort(sort) {
    activeSort = activeSort === sort ? null : sort;
    document.querySelectorAll("[data-sort]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.sort === activeSort);
    });
    displayStudents();
}

els.form.addEventListener("submit", handleSubmit);

els.cancelBtn.addEventListener("click", resetForm);

// Delete Last Student button
if (els.deleteLastBtn) {
    els.deleteLastBtn.addEventListener("click", deleteLastStudent);
}

els.search.addEventListener("input", displayStudents);

document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveFilter(btn.dataset.filter));
});

document.querySelectorAll("[data-sort]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveSort(btn.dataset.sort));
});

// Sync select all checkboxes
if (els.selectAll) {
    els.selectAll.addEventListener('change', toggleAllCheckboxes);
}
if (els.selectAllHeader) {
    els.selectAllHeader.addEventListener('change', toggleAllCheckboxes);
}

els.tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    if (btn.dataset.action === "edit") handleEdit(id);
    if (btn.dataset.action === "delete") handleDelete(id);
});

// Initial display
displayStudents();