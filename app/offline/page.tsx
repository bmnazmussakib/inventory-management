import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-4">
            <div className="p-6 rounded-full bg-muted">
                <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">অফলাইন মোড (Offline Mode)</h1>
                <p className="text-muted-foreground max-w-[500px]">
                    আপনি বর্তমানে ইন্টারনেটের সাথে সংযুক্ত নন। তবে চিন্তা করবেন না, ক্যাশ করা ডাটা ব্যবহার করে আপনি এখনও ইনভেন্টরি চেক করতে পারবেন।
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline">
                    <Link href="/">ড্যাশবোর্ডে ফিরে যান</Link>
                </Button>
                <Button onClick={() => window.location.reload()}>আবার চেষ্টা করুন</Button>
            </div>
        </div>
    );
}
