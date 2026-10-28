import React, { useState, useEffect } from 'react';
import { hospitalStore } from './store/hospitalStore';
import { User, Appointment } from './types';
import { NavbarShell, OfficerTab } from './components/NavbarShell';
import { AppointmentCardModal } from './components/AppointmentCardModal';
import { ToastProvider, useToast } from './components/Toast';

// Views
import { HomeView } from './views/HomeView';
import { OfficerPortalView } from './views/OfficerPortalView';
import { OfficerLoginView } from './views/OfficerLoginView';
import { OfficerSignupView } from './views/OfficerSignupView';
import { OfficerForgotPasswordView } from './views/OfficerForgotPasswordView';
import { DashboardView } from './views/DashboardView';
import { PatientRegistryView } from './views/PatientRegistryView';
import { PatientRegistrationView } from './views/PatientRegistrationView';
import { AppointmentsView } from './views/AppointmentsView';
import { ComplaintsView } from './views/ComplaintsView';
import { AuditLogView } from './views/AuditLogView';
import { PatientFolder } from './components/PatientFolder';

import { PatientLoginView } from './views/PatientLoginView';
import { PatientSignupView } from './views/PatientSignupView';
import { PatientForgotPasswordView } from './views/PatientForgotPasswordView';
import { PatientDashboardView } from './views/PatientDashboardView';

type ViewRoute =
  | 'home'
  | 'officer_portal'
  | 'officer_login'
  | 'officer_signup'
  | 'officer_forgot_password'
  | 'officer_dashboard'
  | 'officer_patients'
  | 'officer_patient_detail'
  | 'officer_register'
  | 'officer_appointments'
  | 'officer_complaints'
  | 'officer_audit'
  | 'patient_login'
  | 'patient_signup'
  | 'patient_forgot_password'
  | 'patient_dashboard';

const AppContent: React.FC = () => {
  const { toast } = useToast();
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(hospitalStore.getCurrentUser());
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [editPatientId, setEditPatientId] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const update = () => setCurrentUser(hospitalStore.getCurrentUser());
    const unsub = hospitalStore.subscribe(update);
    return unsub;
  }, []);

  const handleLogout = () => {
    hospitalStore.logout();
    toast('Logged out');
    setCurrentRoute('home');
    setSelectedPatientId(null);
  };

  const handleOfficerTabNavigate = (tab: OfficerTab) => {
    setSelectedPatientId(null);
    setEditPatientId(null);
    switch (tab) {
      case 'dashboard':
        setCurrentRoute('officer_dashboard');
        break;
      case 'patients':
        setCurrentRoute('officer_patients');
        break;
      case 'register':
        setEditPatientId(null);
        setCurrentRoute('officer_register');
        break;
      case 'appointments':
        setCurrentRoute('officer_appointments');
        break;
      case 'complaints':
        setCurrentRoute('officer_complaints');
        break;
      case 'audit':
        setCurrentRoute('officer_audit');
        break;
    }
  };

  const openPatientDetail = (patientId: number) => {
    setSelectedPatientId(patientId);
    setCurrentRoute('officer_patient_detail');
  };

  const openEditPatient = (patientId: number) => {
    setEditPatientId(patientId);
    setCurrentRoute('officer_register');
  };

  // ---------------- Render Officer Shell Wrappers ----------------
  if (
    currentRoute.startsWith('officer_') &&
    currentRoute !== 'officer_portal' &&
    currentRoute !== 'officer_login' &&
    currentRoute !== 'officer_signup' &&
    currentRoute !== 'officer_forgot_password'
  ) {
    if (!currentUser || currentUser.role !== 'officer') {
      return (
        <OfficerLoginView
          onSuccess={() => setCurrentRoute('officer_dashboard')}
          onNavigateSignup={() => setCurrentRoute('officer_signup')}
          onNavigateForgotPassword={() => setCurrentRoute('officer_forgot_password')}
          onBackToPortal={() => setCurrentRoute('officer_portal')}
        />
      );
    }

    let activeTab: OfficerTab = 'dashboard';
    let title = 'Front Desk Dashboard';
    let eyebrow = `Today · ${new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;
    let actions: React.ReactNode = (
      <button
        type="button"
        className="btn"
        onClick={() => {
          setEditPatientId(null);
          setCurrentRoute('officer_register');
        }}
      >
        + Open New Folder
      </button>
    );

    let content: React.ReactNode = null;

    if (currentRoute === 'officer_dashboard') {
      activeTab = 'dashboard';
      title = 'Front Desk Dashboard';
      content = (
        <DashboardView
          onOpenPatient={openPatientDetail}
          onOpenRegistry={() => setCurrentRoute('officer_patients')}
          onOpenAppointments={() => setCurrentRoute('officer_appointments')}
          onOpenNewFolder={() => {
            setEditPatientId(null);
            setCurrentRoute('officer_register');
          }}
          onOpenCard={(a) => setSelectedAppointment(a)}
        />
      );
    } else if (currentRoute === 'officer_patients') {
      activeTab = 'patients';
      title = 'Patient Registry';
      eyebrow = 'All Hospital Folders';
      content = (
        <PatientRegistryView
          onOpenPatient={openPatientDetail}
          onOpenNewFolder={() => {
            setEditPatientId(null);
            setCurrentRoute('officer_register');
          }}
        />
      );
    } else if (currentRoute === 'officer_patient_detail') {
      activeTab = 'patients';
      title = 'Patient Folder';
      eyebrow = 'Hospital Record';
      actions = (
        <button
          type="button"
          className="btn ghost"
          onClick={() => setCurrentRoute('officer_patients')}
        >
          ← Back to Registry
        </button>
      );
      content = (
        <PatientFolder
          patientId={selectedPatientId || 1}
          onEditFolder={openEditPatient}
          onBack={() => setCurrentRoute('officer_patients')}
          onOpenCard={(a) => setSelectedAppointment(a)}
          isOfficer={true}
        />
      );
    } else if (currentRoute === 'officer_register') {
      activeTab = 'register';
      title = editPatientId ? 'Edit Hospital Folder' : 'Open a New Hospital Folder';
      eyebrow = 'Patient Registration';
      actions = editPatientId ? (
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setSelectedPatientId(editPatientId);
            setCurrentRoute('officer_patient_detail');
          }}
        >
          ← Back to Folder
        </button>
      ) : null;
      content = (
        <PatientRegistrationView
          editPatientId={editPatientId}
          onSuccess={(newId) => {
            setSelectedPatientId(newId);
            setCurrentRoute('officer_patient_detail');
          }}
          onCancel={() => {
            if (editPatientId) {
              setSelectedPatientId(editPatientId);
              setCurrentRoute('officer_patient_detail');
            } else {
              setCurrentRoute('officer_dashboard');
            }
          }}
        />
      );
    } else if (currentRoute === 'officer_appointments') {
      activeTab = 'appointments';
      title = 'Appointments';
      eyebrow = 'All Departments';
      actions = null;
      content = (
        <AppointmentsView
          onOpenPatient={openPatientDetail}
          onOpenCard={(a) => setSelectedAppointment(a)}
        />
      );
    } else if (currentRoute === 'officer_complaints') {
      activeTab = 'complaints';
      title = 'Patient Complaints';
      eyebrow = 'Front Desk & Patient Relations';
      actions = null;
      content = <ComplaintsView />;
    } else if (currentRoute === 'officer_audit') {
      activeTab = 'audit';
      title = 'Audit Log';
      eyebrow = 'Accountability & Governance';
      actions = null;
      content = <AuditLogView onOpenPatient={openPatientDetail} />;
    }

    return (
      <>
        <NavbarShell
          activeTab={activeTab}
          onNavigate={handleOfficerTabNavigate}
          title={title}
          eyebrow={eyebrow}
          actions={actions}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchPortal={() => setCurrentRoute('home')}
        >
          {content}
        </NavbarShell>
        <AppointmentCardModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      </>
    );
  }

  // ---------------- Other Routes ----------------
  return (
    <>
      {currentRoute === 'home' && (
        <HomeView
          onNavigatePatientLogin={() => setCurrentRoute('patient_login')}
          onNavigatePatientSignup={() => setCurrentRoute('patient_signup')}
          onNavigateOfficerPortal={() => setCurrentRoute('officer_portal')}
          onQuickOfficerLogin={() => {
            hospitalStore.quickLogin('officer');
            setCurrentRoute('officer_dashboard');
          }}
          onQuickPatientLogin={() => {
            hospitalStore.quickLogin('patient', 1);
            setCurrentRoute('patient_dashboard');
          }}
        />
      )}

      {currentRoute === 'officer_portal' && (
        <OfficerPortalView
          onLogin={() => setCurrentRoute('officer_login')}
          onSignup={() => setCurrentRoute('officer_signup')}
          onBackToHome={() => setCurrentRoute('home')}
        />
      )}

      {currentRoute === 'officer_login' && (
        <OfficerLoginView
          onSuccess={() => setCurrentRoute('officer_dashboard')}
          onNavigateSignup={() => setCurrentRoute('officer_signup')}
          onNavigateForgotPassword={() => setCurrentRoute('officer_forgot_password')}
          onBackToPortal={() => setCurrentRoute('officer_portal')}
        />
      )}

      {currentRoute === 'officer_signup' && (
        <OfficerSignupView
          onSuccess={() => setCurrentRoute('officer_login')}
          onNavigateLogin={() => setCurrentRoute('officer_login')}
          onBackToPortal={() => setCurrentRoute('officer_portal')}
        />
      )}

      {currentRoute === 'officer_forgot_password' && (
        <OfficerForgotPasswordView
          onBackToLogin={() => setCurrentRoute('officer_login')}
          onBackToPortal={() => setCurrentRoute('officer_portal')}
        />
      )}

      {currentRoute === 'patient_login' && (
        <PatientLoginView
          onSuccess={() => setCurrentRoute('patient_dashboard')}
          onNavigateSignup={() => setCurrentRoute('patient_signup')}
          onNavigateForgotPassword={() => setCurrentRoute('patient_forgot_password')}
          onBackToHome={() => setCurrentRoute('home')}
        />
      )}

      {currentRoute === 'patient_signup' && (
        <PatientSignupView
          onSuccess={() => setCurrentRoute('patient_dashboard')}
          onNavigateLogin={() => setCurrentRoute('patient_login')}
          onBackToHome={() => setCurrentRoute('home')}
        />
      )}

      {currentRoute === 'patient_forgot_password' && (
        <PatientForgotPasswordView
          onBackToLogin={() => setCurrentRoute('patient_login')}
          onBackToHome={() => setCurrentRoute('home')}
        />
      )}

      {currentRoute === 'patient_dashboard' && (
        <PatientDashboardView
          patientId={currentUser?.patient_id || 1}
          onLogout={handleLogout}
          onOpenCard={(a) => setSelectedAppointment(a)}
          onSwitchToOfficer={() => {
            hospitalStore.quickLogin('officer');
            setCurrentRoute('officer_dashboard');
          }}
        />
      )}

      <AppointmentCardModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
