import React from 'react'
import { classes } from '@lib/utils';

import styles from '../Controls.module.scss';

interface InputProps {
    name: string;
    className?: string;
    inlineStyles?: React.CSSProperties;
    [key: string]: any;
}
export const Input = (props: InputProps) => {
    const { name, className, inlineStyles, ...rest } = props;
    return (
		<input
			name={name}
            className={classes(styles.input, className)}
            style={inlineStyles}
            {...rest}
		/>
	);
}
