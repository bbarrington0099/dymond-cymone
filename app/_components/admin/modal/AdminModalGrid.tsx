import styles from './AdminModalGrid.module.scss';

interface AdminModalGridProps {
    children: React.ReactNode;
}
export const AdminModalGrid = (props: AdminModalGridProps) => {
    const { children } = props;
    
    return (
        <div className={styles.grid}>{children}</div>
    )
}
