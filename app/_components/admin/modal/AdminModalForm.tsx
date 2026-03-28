import styles from './AdminModalForm.module.scss';

interface AdminModalFormProps {
    action: (formData: FormData) => Promise<void>;
    children: React.ReactNode;
    type?: 'grid' | 'row' | undefined;
}
export const AdminModalForm = (props: AdminModalFormProps) => {
  const { action, children, type } = props;

  const className = type === 'grid' ? styles.formGrid : type === 'row' ? styles.formRow : undefined;

  return (
    <form action={action} className={className}>
      {children}
    </form>
  )
}
