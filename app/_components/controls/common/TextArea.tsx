import React from 'react';
import { classes } from '@lib/utils';

import styles from '../Controls.module.scss';

interface TextAreaProps {
    name: string;
    defaultValue?: string;
    rows?: number;
    className?: string;
    inlineStyles?: React.CSSProperties;
}
export const TextArea = (props: TextAreaProps) => {
    const { name, defaultValue, rows, className, inlineStyles } = props;

    return (
        <textarea
            name={name}
            defaultValue={defaultValue ?? ''}
            className={classes(styles.textarea, className)}
            style={inlineStyles}
            rows={rows ?? undefined}
        />
    );
}
