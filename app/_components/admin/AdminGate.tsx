import { auth } from '@lib/auth';
import { logout } from '@actions/auth';
import { AdminButton, AdminProps, AdminModalForm } from '@components/admin';
import { Button } from '@components/controls';

import styles from './AdminGate.module.scss';

interface AdminGateProps {
  adminProps: AdminProps;
}
export async function AdminGate(props: AdminGateProps) {
  const session = await auth();
  if (!(session?.user ?? false)) return null;

  return (
    <div className={styles.adminBar}>
      <AdminButton
        adminProps={props.adminProps}
      />
      <AdminModalForm action={logout}>
        <Button 
          type="submit" 
          content="Logout"
        />
      </AdminModalForm>
    </div>
  );
}

