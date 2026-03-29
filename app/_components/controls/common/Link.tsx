import React from 'react';
import { classes } from '@lib/utils';

import styles from '../Controls.module.scss';

interface LinkProps {
    href: string;
    target?: "_blank" | "_self";
    content: string;
    className?: string;
    inlineStyles?: React.CSSProperties;
}
export function Link(props: LinkProps) {
    const { href, target, className, inlineStyles, content } = props;

    return (
        <a
            href={href}
            target={target ?? "_blank"}
            rel="noreferrer"
            className={classes(className, styles.link)}
            style={inlineStyles}
        >
            {content}
        </a>
    )
}