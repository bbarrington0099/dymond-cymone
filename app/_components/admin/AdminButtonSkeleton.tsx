import styles from './AdminButtonSkeleton.module.scss';

export const AdminButtonSkeleton = () => {
    return (
		<div className={styles.fallbackOverlay}>
			<div className={styles.fallbackModal}>
				<div
					className='skeleton'
					style={{ height: 26, width: 200, marginBottom: 16 }}
				/>
				<div
					className='skeleton'
					style={{ height: 120, width: '100%', marginBottom: 16 }}
				/>
				<div
					className='skeleton'
					style={{ height: 120, width: '100%', marginBottom: 16 }}
				/>
			</div>
		</div>
    );
}
