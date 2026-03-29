'use client';

import React from 'react'
import { classes } from '@lib/utils';

import styles from '../Controls.module.scss';

interface ButtonProps {
    content: string;
	className?: string;
    inlineStyles?: React.CSSProperties;
	onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
	[key: string]: any;
}
export const Button = (props: ButtonProps) => {
  const { className, onClick, content, inlineStyles, disabled, type, ...rest } = props;
  return (
		<button
			type={type ?? 'button'}
			className={classes(styles.button, className)}
			style={inlineStyles}
			onClick={onClick ?? (() => {})}
            disabled={disabled ?? false}
            {...rest}
		>
			{content}
		</button>
  );
}

export default Button