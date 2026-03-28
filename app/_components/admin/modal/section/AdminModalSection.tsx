import styles from './AdminModalSection.module.scss';

interface AdminModalSectionProps {
    children: React.ReactNode;
    title: string;
}
export const AdminModalSection = (props: AdminModalSectionProps) => {
    const { children, title } = props;

    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            {children}
        </section>
    )
}

export const resolvePublicObjectUrl = (bucket: string, pathOrUrl: string) => {
	const trimmed = pathOrUrl?.trim();
	if (!trimmed) return '';
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
		return trimmed;
	const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!base) return '';
	return `${base}/storage/v1/object/public/${bucket}/${trimmed}`;
};