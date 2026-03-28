import { AdminModalSection, AdminModalForm, Field, Input, Theme, Button } from "@components/admin";
import { camelCaseToWords } from "@lib/utils";
import { updateArtistTheme } from "@actions/artist";

interface AdminModalSectionThemeProps {
  initialTheme: Theme;
}
export const AdminModalSectionTheme = (props: AdminModalSectionThemeProps) => {
  const { initialTheme } = props;

  const themeFields: { name: string; defaultValue: string }[] = [
    { name: 'primaryColor', defaultValue: initialTheme.themePrimaryColor },
    { name: 'secondaryColor', defaultValue: initialTheme.themeSecondaryColor },
    { name: 'tertiaryColor', defaultValue: initialTheme.themeTertiaryColor },
    { name: 'primaryFontCssLink', defaultValue: initialTheme.themePrimaryFontCssLink },
    { name: 'secondaryFontCssLink', defaultValue: initialTheme.themeSecondaryFontCssLink },
  ];

  return (
		<AdminModalSection title='Theme'>
			<AdminModalForm action={updateArtistTheme} type='grid'>
				{themeFields.map((field) => (
          <Field key={field.name} label={camelCaseToWords(field.name)}>
            <Input name={field.name} defaultValue={field.defaultValue} />
          </Field>
        ))}

				<Button
          type='submit'
					content='Save theme'
				/>
			</AdminModalForm>
		</AdminModalSection>
  );
}
