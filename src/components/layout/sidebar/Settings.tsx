"use client";

import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showProtectedAtom } from "@/stores/docs";

export function Settings() {
    return "";

    const [showProtected, setShowProtected] = useAtom(showProtectedAtom);

    return (
        <div className="p-1 mt-2">
            <div className="flex items-center space-x-2">
                <Switch id="show-protected" checked={showProtected} onCheckedChange={setShowProtected} />
                <Label htmlFor="show-protected">Show Protected</Label>
            </div>
        </div>
    );
}
