import React from 'react';

import styles from '../AdminControls.module.scss';

interface ListItemProps {
    children: React.ReactNode;
}
export const ListItem = (props: ListItemProps) => {
    const { children } = props;
    
    return (
        <li className={styles.listItem}>
            {children}
        </li>
    )
}
