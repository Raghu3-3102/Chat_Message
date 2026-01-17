import React, { useState } from 'react';
import { PhoneLogin } from './PhoneLogin';
import { Register } from './Register';

export const AuthFlow: React.FC = () => {
    const [view, setView] = useState<'login' | 'register'>('login');

    return (
        <div>
            {view === 'login' ? (
                <PhoneLogin onSwitchToRegister={() => setView('register')} />
            ) : (
                <Register onSwitchToLogin={() => setView('login')} />
            )}
        </div>
    );
};
