'use client';

import React from 'react'

import styles from './AdminModalOverlay.module.scss';

interface AdminModalOverlayProps {
    className?: string;
    inlineStyles?: React.CSSProperties;
    children: React.ReactNode;
    onClose: () => void;
}
export const AdminModalOverlay = (props: AdminModalOverlayProps) => {
    const { children, className, inlineStyles, onClose } = props;
    return (
        <div
            className={`${styles.overlay} ${className ?? ''}`}
            style={inlineStyles}
            role='dialog'
            aria-modal='true'
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {children}
        </div>
    )
}