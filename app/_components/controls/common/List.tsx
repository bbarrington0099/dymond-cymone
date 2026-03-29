import React from 'react';

import styles from '../Controls.module.scss';

interface ListProps {
    children: React.ReactNode;
}
export const List = (props: ListProps) => {
    const { children } = props;

    return (
    <ul className={styles.ul}>
        {children}
    </ul>
    )
}
