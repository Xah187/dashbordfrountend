import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import {
  CompaniesView,
  BranchesView,
  EmployeesView,
  ProjectsView,
  ProjectDetailsView,
} from "./components";

export interface ViewState {
  type: 'companies' | 'branches' | 'employees' | 'projects' | 'projectDetails';
  data?: any;
}

export interface NavigationState {
  company: any | null;
  branch: any | null;
  project: any | null;
  view: ViewState;
}

const CompaniesSubscribedPage: React.FC = () => {
  const [navigation, setNavigation] = useState<NavigationState>({
    company: null,
    branch: null,
    project: null,
    view: { type: 'companies' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // إظهار رسالة نجاح أو خطأ
  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // التنقل إلى عرض الشركات
  const navigateToCompanies = () => {
    setNavigation({
      company: null,
      branch: null,
      project: null,
      view: { type: 'companies' }
    });
  };

  // التنقل إلى عرض الفروع أو الموظفين
  const navigateToCompanyDetails = (company: any, viewType: 'branches' | 'employees') => {
    setNavigation({
      company,
      branch: null,
      project: null,
      view: { type: viewType }
    });
  };

  // التنقل إلى عرض الفروع (افتراضي من قائمة الشركات)
  const navigateToCompanyBranches = (company: any) => {
    navigateToCompanyDetails(company, 'branches');
  };

  // التنقل إلى عرض المشاريع
  const navigateToProjects = (branch: any) => {
    setNavigation({
      ...navigation,
      branch,
      project: null,
      view: { type: 'projects' }
    });
  };

  // التنقل إلى تفاصيل المشروع
  const navigateToProjectDetails = (project: any) => {
    setNavigation({
      ...navigation,
      project,
      view: { type: 'projectDetails' }
    });
  };

  // بناء عناصر التنقل العلوية
  const buildBreadcrumbs = () => {
    const items = [
      <Link 
        key="home" 
        color="inherit" 
        onClick={navigateToCompanies}
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        الشركات المشتركة
      </Link>
    ];

    if (navigation.company) {
      items.push(
        <Typography key="company" color="text.primary">
          {navigation.company.name}
        </Typography>
      );
    }

    if (navigation.view.type === 'branches') {
      items.push(
        <Typography key="branches" color="text.primary">
          الفروع
        </Typography>
      );
    }

    if (navigation.view.type === 'employees') {
      items.push(
        <Typography key="employees" color="text.primary">
          الموظفون
        </Typography>
      );
    }

    if (navigation.branch) {
      items.push(
        <Typography key="branch" color="text.primary">
          {navigation.branch.name}
        </Typography>
      );
    }

    if (navigation.view.type === 'projects') {
      items.push(
        <Typography key="projects" color="text.primary">
          المشاريع
        </Typography>
      );
    }

    if (navigation.project) {
      items.push(
        <Typography key="project" color="text.primary">
          {navigation.project.name || navigation.project.Nameproject}
        </Typography>
      );
    }

    return items;
  };

  // عرض المحتوى الحالي
  const renderCurrentView = () => {
    switch (navigation.view.type) {
      case 'companies':
        return (
          <CompaniesView
            onCompanySelect={navigateToCompanyBranches}
            onLoading={setLoading}
            onError={setError}
            showMessage={showMessage}
          />
        );

      case 'branches':
        return (
          <BranchesView
            company={navigation.company}
            onBranchSelect={navigateToProjects}
            onLoading={setLoading}
            onError={setError}
            showMessage={showMessage}
          />
        );

      case 'employees':
        return (
          <EmployeesView
            company={navigation.company}
            onLoading={setLoading}
            onError={setError}
            showMessage={showMessage}
          />
        );

      case 'projects':
        return (
          <ProjectsView
            company={navigation.company}
            branch={navigation.branch}
            onProjectSelect={navigateToProjectDetails}
            onLoading={setLoading}
            onError={setError}
            showMessage={showMessage}
          />
        );

      case 'projectDetails':
        return (
          <ProjectDetailsView
            project={navigation.project}
            onBack={() => navigateToProjects(navigation.branch)}
            onLoading={setLoading}
            onError={setError}
            showMessage={showMessage}
          />
        );

      default:
        return <Typography>عذراً، لم يتم العثور على المحتوى المطلوب</Typography>;
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* عنوان الصفحة والتنقل */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 صفحة الشركات المشتركة
        </Typography>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 2 }}>
          {buildBreadcrumbs()}
        </Breadcrumbs>

        {/* مؤشر التحميل العام */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              جاري التحميل...
            </Typography>
          </Box>
        )}

        {/* رسالة خطأ عامة */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* محتوى الصفحة الحالي */}
      <Box sx={{ flex: 1 }}>
        {renderCurrentView()}
      </Box>

      {/* رسائل التنبيه */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompaniesSubscribedPage; 