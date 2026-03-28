import React from 'react';
import { classes } from '@lib/utils';

interface ImgProps {
    src: string;
    alt?: string;
    className?: string;
    inlineStyles?: React.CSSProperties;
}
export const Img = (props: ImgProps) => {
    const { src, alt, className, inlineStyles } = props;
    
    return (
        <img
            className={classes(className)}
            alt={alt}
            src={src}
            style={inlineStyles}
        />
    );
}
