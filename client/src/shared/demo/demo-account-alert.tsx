import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

type DemoAccountAlertProps = {
	className?: string;
};

export function DemoAccountAlert(props: DemoAccountAlertProps) {
	return (
		<Alert className={props.className}>
			<InfoIcon className="size-4" />
			<AlertTitle>Protected Demo Data</AlertTitle>
			<AlertDescription>
				Demo accounts are limited. Deletion is disabled, and some fields are
				locked.
			</AlertDescription>
		</Alert>
	);
}
