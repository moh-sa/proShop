import { IMAGE_MIMETYPES } from "@/features/products";
import { cn } from "@/lib/utils";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../../../components/ui/label";
import { useFieldContext } from "../form.context";

const DROP_ZONE_BASE =
	"relative mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors";

const DROP_ZONE_IDLE =
	"border-border hover:border-primary/60 hover:bg-muted/50";

const DROP_ZONE_DRAGGING = "border-primary bg-primary/5";

/**
 * Keeps the native <input type="file"> in sync when the field value is set
 * programmatically (drag-drop or TanStack Form). Without this, input.files can
 * stay empty even though field.state.value holds a File.
 */
function syncNativeFileInput(
	input: HTMLInputElement | null,
	file: File | null,
): void {
	if (!input) return;

	const dataTransfer = new DataTransfer();
	if (file) dataTransfer.items.add(file);
	input.files = dataTransfer.files;
}

type FormImageFieldProps = {
	label: string;
	description?: string;
	required?: boolean;
	currentImageUrl?: string;
};

export function FormImageField(props: FormImageFieldProps) {
	const field = useFieldContext<File | null>();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const file = field.state.value;
	const hasNewFile = file != null;

	const blobPreviewUrl = useMemo(() => {
		if (!file) return null;
		return URL.createObjectURL(file);
	}, [file]);

	useEffect(() => {
		return () => {
			if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl);
		};
	}, [blobPreviewUrl]);

	const previewUrl = hasNewFile ? blobPreviewUrl : props.currentImageUrl;
	const previewCaption = file?.name ?? "Current image";
	const showPreview = previewUrl != null && previewUrl !== "";

	const dropZoneClassName = cn(
		DROP_ZONE_BASE,
		isDragging ? DROP_ZONE_DRAGGING : DROP_ZONE_IDLE,
		isInvalid && "border-destructive",
	);

	function handleFiles(files: FileList | null) {
		const selected = files?.[0] ?? null;
		field.handleChange(selected);
		field.handleBlur();
		syncNativeFileInput(inputRef.current, selected);
	}

	function handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	}

	function handleClear() {
		field.handleChange(null);
		if (inputRef.current) {
			inputRef.current.value = "";
			syncNativeFileInput(inputRef.current, null);
		}
	}

	function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave() {
		setIsDragging(false);
	}

	function handleDropZoneClick() {
		inputRef.current?.click();
	}

	function handleDropZoneKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			inputRef.current?.click();
		}
	}

	return (
		<div>
			<Label
				htmlFor={field.name}
				className="leading-5 font-semibold select-none"
			>
				{props.label}
				{props.required ? <span className="text-destructive">*</span> : null}
			</Label>

			<div
				className={dropZoneClassName}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleDropZoneClick}
				role="button"
				tabIndex={0}
				onKeyDown={handleDropZoneKeyDown}
				aria-invalid={isInvalid}
				aria-label={`Upload ${props.label}`}
			>
				{showPreview ? (
					<ImagePreview
						previewUrl={previewUrl}
						caption={previewCaption}
						onClear={handleClear}
					/>
				) : (
					<ImageUploadPlaceholder description={props.description} />
				)}

				<input
					ref={inputRef}
					id={field.name}
					name={field.name}
					type="file"
					accept={IMAGE_MIMETYPES.join(",")}
					required={props.required}
					className="sr-only"
					onChange={(e) => handleFiles(e.target.files)}
					onClick={(e) => e.stopPropagation()}
				/>
			</div>

			{isInvalid && (
				<p className="mt-1 text-sm text-destructive">
					{field.state.meta.errors.map((error) => error.message).join(", ")}
				</p>
			)}
		</div>
	);
}

type ImagePreviewProps = {
	previewUrl: string;
	caption: string;
	onClear: () => void;
};

function ImagePreview({ previewUrl, caption, onClear }: ImagePreviewProps) {
	function handleRemoveClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation();
		onClear();
	}

	return (
		<>
			<img
				src={previewUrl}
				alt="Preview"
				className="h-32 w-auto max-w-full rounded-md object-contain"
			/>
			<p className="text-xs text-muted-foreground">{caption}</p>
			<button
				type="button"
				className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
				onClick={handleRemoveClick}
				aria-label="Remove image"
			>
				<XIcon className="size-4" />
			</button>
		</>
	);
}

type ImageUploadPlaceholderProps = {
	description?: string;
};

function ImageUploadPlaceholder({ description }: ImageUploadPlaceholderProps) {
	return (
		<>
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<ImageIcon className="size-6 text-muted-foreground" />
			</div>
			<div className="text-center">
				<p className="text-sm font-medium">
					<UploadIcon className="mr-1 inline size-3.5" />
					Drag & drop or click to upload
				</p>
				{description ? (
					<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>
		</>
	);
}
