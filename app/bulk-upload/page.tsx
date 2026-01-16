import { useTranslations } from 'next-intl';
import { BulkUploadForm } from "@/components/BulkUploadForm";

export default function BulkUploadPage() {
    const t = useTranslations('BulkUpload');

    return (
        <div className="container p-6">
            <div className="flex flex-col gap-8 max-w-5xl mx-auto">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight font-bengali">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('description')}
                    </p>
                </div>

                <BulkUploadForm />
            </div>
        </div>
    );
}
