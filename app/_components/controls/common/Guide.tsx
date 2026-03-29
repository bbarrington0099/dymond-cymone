import React from 'react';
import { classes } from '@lib/utils';
import { renderFormattedText } from '@lib/react/renderFormattedText';

import styles from '../Controls.module.scss';

interface GuideProps {
    content: string;
    title?: string;
    className?: string;
    inlineStyles?: React.CSSProperties;
}
export const Guide = (props: GuideProps) => {
    const { content, title, className, inlineStyles } = props;
    return (
        <span className={classes(styles.formatInstructions, className)} style={inlineStyles} title={title}>
            {renderFormattedText(content)}
        </span>
    );
}
