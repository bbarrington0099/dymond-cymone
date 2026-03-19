/**
 * Style exports for Dymond Cymone
 * These values are used to generate SCSS variables and can be imported in JS/TS
 */

export const styleExports = {
    colors: createStyleExport({
        unit: '#',
        unitPosition: 'prefix',
        stringify: false,
        values: {
            // Skeleton loading
            "skeleton-base": { raw: "1c2029" },
            "skeleton-shine": { raw: "2a2e38" },
            "skeleton-light-base": { raw: "e0d9c8" },
            "skeleton-light-shine": { raw: "f5f0e6" },
        }
    }),
    spacing: createStyleExport({
        unit: 'rem',
        unitPosition: 'suffix',
        stringify: false,
        values: {
            "xs": { raw: "0.25" },
            "sm": { raw: "0.5" },
            "md": { raw: "1" },
            "lg": { raw: "1.5" },
            "xl": { raw: "2" },
            "2xl": { raw: "3" },
            "3xl": { raw: "4" },
        }
    }),
    breakpoints: {
        unit: 'px',
        unitPosition: 'suffix',
        stringify: false,
        values: {
            "sm": { raw: "640" },
            "md": { raw: "768" },
            "lg": { raw: "1024" },
            "xl": { raw: "1280" },
            "2xl": { raw: "1536" },
        },
    },
    shadows: {
        values: {
            "sm": { raw: "0 1px 2px rgba(0, 0, 0, 0.3)", natural: true },
            "md": { raw: "0 4px 6px rgba(0, 0, 0, 0.4)", natural: true },
            "lg": { raw: "0 10px 15px rgba(0, 0, 0, 0.5)", natural: true },
        },
    },
    transitions: createStyleExport({
        unit: 'ms ease',
        unitPosition: 'suffix',
        stringify: false,
        values: {
            "fast": { raw: "150" },
            "normal": { raw: "250" },
            "slow": { raw: "400" },
        },
    }),
    radii: createStyleExport({
        unit: 'px',
        unitPosition: 'suffix',
        stringify: false,
        values: {
            "sm": { raw: "4" },
            "md": { raw: "8" },
            "lg": { raw: "12" },
            "xl": { raw: "16" },
            "full": { raw: "9999" },
        },
    }),
};

function createStyleExport(styleExport) {
    for (const [key, styleValue] of Object.entries(styleExport.values)) {
        if (styleValue.natural) {
            styleExport.values[key].dressed = styleValue.raw;
            continue;
        };
        let dressedValue = '';
        dressedValue += styleExport.unit && styleExport.unitPosition === 'prefix' ? styleExport.unit : '';
        dressedValue += styleValue.raw;
        dressedValue += styleExport.unit && (!styleExport.unitPosition || styleExport.unitPosition === 'suffix') ? styleExport.unit : '';
        styleExport.values[key].dressed = styleExport.stringify ? `"${dressedValue}"` : dressedValue;
    }
    return styleExport;
}