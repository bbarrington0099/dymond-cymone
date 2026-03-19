import React from 'react';

/**
 * Render DB text with support for:
 * - \n  -> line break (continuation lines, no indent)
 * - \n\n -> paragraph (first line of each paragraph indented when indent=true)
 */
export function renderFormattedText(
	text?: string,
	{
		indent = true,
		inline = true,
	}: { indent?: boolean; inline?: boolean } = {},
): React.ReactNode {
	if (!text) return null;

	// Normalize literal \n (backslash-n) to actual newlines, e.g. from pasted text or escaped storage
	text = text.replace(/\\n/g, '\n');

	const paragraphs = text.split(/\r?\n\r?\n/);

	if (inline) {
		return (
			<>
				{paragraphs.map((para, pIndex) => (
					<React.Fragment key={pIndex}>
						{pIndex > 0 && <br />}
						{para.split(/\r?\n/).map((line, lIndex) => (
							<React.Fragment key={lIndex}>
								{lIndex > 0 && <br />}
								{indent && lIndex === 0 ? (
									<span style={{ paddingLeft: '1.5em' }}>{line}</span>
								) : (
									<>{line}</>
								)}
							</React.Fragment>
						))}
					</React.Fragment>
				))}
			</>
		);
	}

	// text-indent only works on block elements; apply to <p> to indent first line of each paragraph
	return paragraphs.map((para, pIndex) => (
		<p
			key={pIndex}
			style={{
				marginBottom: '0.75em',
				...(indent ? { textIndent: '1.5em' } : {}),
			}}
		>
			{para.split(/\r?\n/).map((line, lIndex) => (
				<React.Fragment key={lIndex}>
					{lIndex > 0 && <br />}
					{line}
				</React.Fragment>
			))}
		</p>
	));
}