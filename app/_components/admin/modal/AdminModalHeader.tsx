'use client';

import { Button } from '@components/admin';

import styles from './AdminModalHeader.module.scss';

interface AdminModalHeaderProps {
    onClose: () => void;
}
export const AdminModalHeader = (props: AdminModalHeaderProps) => {
    const { onClose } = props;
    return (
        <div className={styles.header}>
            <h2 className={styles.title}>Artist Admin</h2>
            <Button content='Close' onClick={() => onClose()} />
        </div>
    );
}