import React from 'react';
import { classes } from '@lib/utils';

import styles from '../AdminControls.module.scss';

interface FieldProps {
    label: string;
    className?: string;
    inlineStyles?: React.CSSProperties;
    children: React.ReactNode;
}
export const Field = (props: FieldProps) => {
    const { label, className, inlineStyles, children } = props;
    return (
		<label className={classes(styles.field, className)} style={inlineStyles}>
			{label}
			{children}
		</label>
	);
}
