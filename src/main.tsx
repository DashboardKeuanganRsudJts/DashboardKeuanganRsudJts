import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthWrapper } from './components/AuthWrapper.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthWrapper>
        {(user, isAdmin, role, isLoginModalOpen, openLoginModal, closeLoginModal) => (
          <App 
            user={user} 
            isAdmin={isAdmin} 
            role={role} 
            isLoginModalOpen={isLoginModalOpen} 
            openLoginModal={openLoginModal} 
            closeLoginModal={closeLoginModal} 
          />
        )}
      </AuthWrapper>
    </ThemeProvider>
  </StrictMode>,
);

