import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/student/DashboardView.vue';
import LoginView from '../views/student/LoginView.vue';
import RegisterView from '../views/student/RegisterView.vue';
import ChangePasswordView from '../views/student/ChangePasswordView.vue';
import { useAuth } from '../composables/useAuth';

// Admin pages
const AdminLoginView = () => import('../views/admin/AdminLoginView.vue');
const AdminDashboardView = () => import('../views/admin/AdminDashboardView.vue');
const GradesManagementView = () => import('../views/admin/GradesManagementView.vue');
const SubjectsManagementView = () => import('../views/admin/SubjectsManagementView.vue');
const BooksManagementView = () => import('../views/admin/BooksManagementView.vue');
const UnitsManagementView = () => import('../views/admin/UnitsManagementView.vue');
const StudentsManagementView = () => import('../views/admin/StudentsManagementView.vue');
const TeachersManagementView = () => import('../views/admin/TeachersManagementView.vue');
const QuestionBankManagementView = () => import('../views/admin/QuestionBankManagementView.vue');
const ContentModerationView = () => import('../views/admin/ContentModerationView.vue');
const ContentReviewView = () => import('../views/admin/ContentReviewView.vue');
const ExamPapersManagementView = () => import('../views/admin/ExamPapersManagementView.vue');
const ModelExamManagementView = () => import('../views/admin/ModelExamManagementView.vue');

// Teacher pages
const TeacherLoginView = () => import('../views/teacher/TeacherLoginView.vue');
const TeacherDashboardView = () => import('../views/teacher/TeacherDashboardView.vue');
const TeacherQuestionFormView = () => import('../views/teacher/TeacherQuestionFormView.vue');
const TeacherDraftsView = () => import('../views/teacher/TeacherDraftsView.vue');
const TeacherSubmittedView = () => import('../views/teacher/TeacherSubmittedView.vue');

// School Admin pages
const SchoolAdminLoginView = () => import('../views/school-admin/SchoolAdminLoginView.vue');
const SchoolAdminDashboardView = () => import('../views/school-admin/SchoolAdminDashboardView.vue');
const SectionsManagementView = () => import('../views/school-admin/SectionsManagementView.vue');
const BulkImportView = () => import('../views/school-admin/BulkImportView.vue');
const SchoolStudentsView = () => import('../views/school-admin/SchoolStudentsView.vue');

// Primary student pages (Grade 1-5)
const PrimaryDashboardView = () => import('../views/primary/PrimaryDashboardView.vue');

const routes = [
  // Primary Student routes (Grade 1-5)
  { path: '/primary', component: PrimaryDashboardView, meta: { requiresAuth: true, isPrimary: true } },
  
  // Student routes (Grade 9-12)
  { path: '/', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  {
    path: '/change-password',
    component: ChangePasswordView,
    meta: { requiresAuth: true }
  },
  {
    path: '/notes',
    component: () => import('../views/student/NotesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/progress',
    component: () => import('../views/student/ProgressView.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/exam',
    component: () => import('../views/student/ExamCenterView.vue'),
    meta: { requiresAuth: true }
  },
  
  // Admin routes
  { path: '/admin/login', component: AdminLoginView },
  { path: '/admin', component: AdminDashboardView, meta: { requiresAdmin: true } },
  { path: '/admin/grades', component: GradesManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/subjects', component: SubjectsManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/books', component: BooksManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/units', component: UnitsManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/students', component: StudentsManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/teachers', component: TeachersManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/question-bank', component: QuestionBankManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/content-moderation', component: ContentModerationView, meta: { requiresAdmin: true } },
  { path: '/admin/content-moderation/:type/:id', component: ContentReviewView, meta: { requiresAdmin: true } },
  { path: '/admin/exam-papers', component: ExamPapersManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/model-exams', component: ModelExamManagementView, meta: { requiresAdmin: true } },
  { path: '/admin/schools', component: () => import('../views/admin/SchoolsManagementView.vue'), meta: { requiresAdmin: true } },
  
  // Teacher routes
  { path: '/teachers', component: TeacherLoginView },
  { path: '/teacher/login', component: TeacherLoginView }, // Adding alias for consistency
  { path: '/teacher/register', component: () => import('../views/teacher/TeacherRegisterView.vue') },
  { path: '/teacher', component: TeacherDashboardView, meta: { requiresTeacher: true } },
  { path: '/teacher/create', component: TeacherQuestionFormView, meta: { requiresTeacher: true } },
  { path: '/teacher/edit/:questionId', component: TeacherQuestionFormView, meta: { requiresTeacher: true } },
  { path: '/teacher/drafts', component: TeacherDraftsView, meta: { requiresTeacher: true } },
  { path: '/teacher/submitted', component: TeacherSubmittedView, meta: { requiresTeacher: true } },
  { path: '/teacher/question/:questionId', component: () => import('../views/teacher/TeacherQuestionDetailView.vue'), meta: { requiresTeacher: true } },
  { path: '/teacher/approvals', component: () => import('../views/teacher/TeacherApprovalsView.vue'), meta: { requiresTeacher: true } },
  { path: '/teacher/exam-bank', component: () => import('../views/teacher/TeacherExamBankView.vue'), meta: { requiresTeacher: true } },
  { path: '/teacher/exams', component: () => import('../views/teacher/TeacherExamsListView.vue'), meta: { requiresTeacher: true } },
  { path: '/teacher/exams/new', component: () => import('../views/teacher/TeacherExamBuilderView.vue'), meta: { requiresTeacher: true } },
  { path: '/teacher/exams/:examId/edit', component: () => import('../views/teacher/TeacherExamBuilderView.vue'), meta: { requiresTeacher: true } },
  
  // School Admin routes
  { path: '/school-admin/login', component: SchoolAdminLoginView },
  { path: '/school-admin', component: SchoolAdminDashboardView, meta: { requiresSchoolAdmin: true } },
  { path: '/school-admin/sections', component: SectionsManagementView, meta: { requiresSchoolAdmin: true } },
  { path: '/school-admin/students', component: SchoolStudentsView, meta: { requiresSchoolAdmin: true } },
  { path: '/school-admin/teachers', component: () => import('../views/school-admin/SchoolTeachersView.vue'), meta: { requiresSchoolAdmin: true } },
  { path: '/school-admin/import', redirect: '/school-admin/sections' }, // Bulk import now in sections
  
  // Book/Chat View
  { path: '/book/:bookId', component: () => import('../views/student/BookView.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const { token, user } = useAuth();
  const adminToken = localStorage.getItem('adminToken');
  const teacherToken = localStorage.getItem('teacherToken');
  const schoolAdminToken = localStorage.getItem('schoolAdminToken');
  
  // Get admin role if logged in
  const adminData = localStorage.getItem('admin');
  const adminRole = adminData ? JSON.parse(adminData).role : null;
  
  // Student auth check
  if (to.meta.requiresAuth && !token.value) {
    next('/login');
  } 
  // Admin routes - check token AND ensure not a school_admin
  else if (to.meta.requiresAdmin) {
    if (!adminToken) {
      next('/admin/login');
    } else if (adminRole === 'school_admin') {
      // School admins should not access super admin routes
      next('/school-admin');
    } else {
      next();
    }
  } 
  // Teacher auth check
  else if (to.meta.requiresTeacher && !teacherToken) {
    next('/teacher/login');
  } 
  // School admin routes - check correct token
  else if (to.meta.requiresSchoolAdmin) {
    if (!schoolAdminToken) {
      next('/school-admin/login');
    } else {
      next();
    }
  } 
  else {
    next();
  }
});

export default router;