import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Modal } from './Modal';

export const GlobalModal: React.FC = () => {
    const { modal, hideModal } = useChatStore();

    return (
        <Modal
            isOpen={modal.isOpen}
            onClose={hideModal}
            title={modal.title}
            message={modal.message}
            type={modal.type}
        />
    );
};
