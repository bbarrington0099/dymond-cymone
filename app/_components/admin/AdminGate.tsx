import { auth } from '@lib/auth';
import { logout } from '@actions/auth';
import { AdminButton, AdminProps } from '@components/admin';

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
      <form action={logout}>
        <button type="submit" className={styles.button}>
          Logout
        </button>
      </form>
    </div>
  );
}

