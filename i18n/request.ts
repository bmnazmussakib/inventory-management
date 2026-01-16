import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    // Read locale from cookie or use 'bn' as default
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'bn';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
